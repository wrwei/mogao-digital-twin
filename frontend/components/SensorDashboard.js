/**
 * Sensor Dashboard (admin-only full-page view)
 * Fleet management for all registered sensors: health status, per-sensor
 * detail rows, bulk CSV backfill.
 */
import { useI18n } from '../i18n.js';
import StatusBadge from './StatusBadge.js';
import StatusCard from './StatusCard.js';

const STALE_MS_WARNING  = 30 * 60 * 1000;       // > 30 min since last sample → warning
const STALE_MS_OFFLINE  = 6  * 60 * 60 * 1000;  // > 6 h → offline

export default {
    name: 'SensorDashboard',
    components: { StatusBadge, StatusCard },
    inject: ['$confirm'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            sensors: [],
            artifacts: { caves: [], statues: [], murals: [], paintings: [], inscriptions: [] },
            loading: false,
            error: null,
            search: '',
            statusFilter: 'all',      // all | online | warning | offline | inactive

            // Sensor form — used for both register and edit.
            // editingSensorGid === null → create; otherwise edit that sensor.
            showSensorForm: false,
            editingSensorGid: null,
            sensorForm: { name: '', model: '', serialNumber: '', location: '', active: true },
            newSensorApiKey: null,

            // Bulk import
            bulkFiles: [],            // [{ file, sensorGid }]
            bulkProgress: null,       // [{ name, status, result }]
            bulkRunning: false
        };
    },
    computed: {
        now() { return Date.now(); },
        sensorsDecorated() {
            const now = Date.now();
            return this.sensors.map(s => {
                const last = s.status?.lastSeenAt ? new Date(s.status.lastSeenAt).getTime() : null;
                const age = last ? now - last : null;
                let health = 'unknown';
                if (!s.status?.active) health = 'inactive';
                else if (last === null) health = 'new';
                else if (age < STALE_MS_WARNING) health = 'online';
                else if (age < STALE_MS_OFFLINE) health = 'warning';
                else health = 'offline';
                return { ...s, _health: health, _ageMs: age };
            });
        },
        filteredSensors() {
            const q = this.search.trim().toLowerCase();
            return this.sensorsDecorated.filter(s => {
                if (this.statusFilter !== 'all' && s._health !== this.statusFilter) return false;
                if (!q) return true;
                return (s.name || '').toLowerCase().includes(q)
                    || (s.model || '').toLowerCase().includes(q)
                    || (s.gid || '').toLowerCase().includes(q)
                    || (s.location?.cave || '').toLowerCase().includes(q);
            });
        },
        stats() {
            const byHealth = { online: 0, warning: 0, offline: 0, inactive: 0, new: 0, unknown: 0 };
            let totalSamples = 0;
            for (const s of this.sensorsDecorated) {
                byHealth[s._health] = (byHealth[s._health] || 0) + 1;
                totalSamples += (s.status?.samplesTotal || 0);
            }
            return { total: this.sensors.length, byHealth, totalSamples };
        }
    },
    async mounted() {
        await Promise.all([this.loadSensors(), this.loadArtifacts()]);
    },
    methods: {
        async loadSensors() {
            this.loading = true;
            this.error = null;
            try {
                const res = await window.api.sensors.list();
                this.sensors = res.data;
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },

        humanAge(ms) {
            if (ms == null) return '—';
            const s = Math.floor(ms / 1000);
            if (s < 60) return `${s}s ago`;
            if (s < 3600) return `${Math.floor(s/60)}m ago`;
            if (s < 86400) return `${Math.floor(s/3600)}h ago`;
            return `${Math.floor(s/86400)}d ago`;
        },

        /** Map sensor health → severity-token level used by StatusBadge. */
        healthLevel(h) {
            return { online: 'ok', warning: 'medium', offline: 'high',
                     inactive: 'neutral', new: 'info', unknown: 'neutral' }[h] || 'neutral';
        },

        healthLabel(h) {
            const map = {
                online: this.t('sensorDashboard.online'),
                warning: this.t('sensorDashboard.warning'),
                offline: this.t('sensorDashboard.offline'),
                inactive: this.t('sensorDashboard.inactive'),
                new: this.t('sensorDashboard.new'),
                unknown: this.t('sensorDashboard.unknown')
            };
            return map[h] || h;
        },

        async loadArtifacts() {
            try {
                const [c, s, m, p, i] = await Promise.all([
                    window.api.caves.getAll(),
                    window.api.statues.getAll(),
                    window.api.murals.getAll(),
                    window.api.paintings.getAll(),
                    window.api.inscriptions.getAll()
                ]);
                this.artifacts = {
                    caves:        c.data || [],
                    statues:      s.data || [],
                    murals:       m.data || [],
                    paintings:    p.data || [],
                    inscriptions: i.data || []
                };
            } catch (err) {
                console.warn('Artifact list load failed:', err.message);
            }
        },

        /** Resolve "type:gid" back to a display name for a given sensor's location. */
        locationLabel(sensor) {
            const loc = sensor && sensor.location;
            if (!loc) return '—';
            if (loc.cave) {
                const c = this.artifacts.caves.find(x => x.gid === loc.cave);
                return c ? `🏛️ ${c.name || loc.cave}` : `🏛️ ${loc.cave}`;
            }
            if (Array.isArray(loc.explicitArtifacts) && loc.explicitArtifacts.length > 0) {
                const gid = loc.explicitArtifacts[0];
                const buckets = [
                    ['statue', '🗿', this.artifacts.statues],
                    ['mural', '🎨', this.artifacts.murals],
                    ['painting', '🖼️', this.artifacts.paintings],
                    ['inscription', '✍️', this.artifacts.inscriptions]
                ];
                for (const [, icon, list] of buckets) {
                    const a = list.find(x => x.gid === gid);
                    if (a) return `${icon} ${a.name || gid}`;
                }
                return gid;
            }
            return '—';
        },

        /** Encode the sensor's current location as "type:gid" for the form select. */
        encodeLocation(sensor) {
            const loc = sensor && sensor.location;
            if (!loc) return '';
            if (loc.cave) return `cave:${loc.cave}`;
            if (Array.isArray(loc.explicitArtifacts) && loc.explicitArtifacts.length > 0) {
                const gid = loc.explicitArtifacts[0];
                for (const t of ['statue', 'mural', 'painting', 'inscription']) {
                    if ((this.artifacts[t + 's'] || []).some(x => x.gid === gid)) {
                        return `${t}:${gid}`;
                    }
                }
                // Fall back to "artifact:gid" if type unknown (artifact list not loaded yet)
                return `artifact:${gid}`;
            }
            return '';
        },

        /** Convert "type:gid" into the `location` payload the backend expects. */
        buildLocationPayload(locString) {
            if (!locString) return {};
            const idx = locString.indexOf(':');
            if (idx < 0) return {};
            const type = locString.slice(0, idx);
            const gid = locString.slice(idx + 1);
            if (type === 'cave') return { cave: gid, explicitArtifacts: [] };
            return { cave: null, explicitArtifacts: [gid] };
        },

        openCreateForm() {
            this.editingSensorGid = null;
            this.sensorForm = { name: '', model: '', serialNumber: '', location: '', active: true };
            this.newSensorApiKey = null;
            this.showSensorForm = true;
        },

        openEditForm(sensor) {
            this.editingSensorGid = sensor.gid;
            this.sensorForm = {
                name: sensor.name || '',
                model: sensor.model || '',
                serialNumber: sensor.serialNumber || '',
                location: this.encodeLocation(sensor),
                active: sensor.status?.active !== false
            };
            this.newSensorApiKey = null;
            this.showSensorForm = true;
        },

        closeSensorForm() {
            this.showSensorForm = false;
            this.editingSensorGid = null;
            this.sensorForm = { name: '', model: '', serialNumber: '', location: '', active: true };
        },

        async saveSensor() {
            if (!this.sensorForm.name) return;
            this.loading = true;
            this.error = null;
            try {
                const location = this.buildLocationPayload(this.sensorForm.location);
                if (this.editingSensorGid) {
                    const patch = {
                        name: this.sensorForm.name,
                        model: this.sensorForm.model || undefined,
                        serialNumber: this.sensorForm.serialNumber || undefined,
                        location,
                        active: this.sensorForm.active
                    };
                    await window.api.sensors.update(this.editingSensorGid, patch);
                    this.closeSensorForm();
                } else {
                    const payload = {
                        name: this.sensorForm.name,
                        model: this.sensorForm.model || undefined,
                        serialNumber: this.sensorForm.serialNumber || undefined,
                        location
                    };
                    const res = await window.api.sensors.register(payload);
                    this.newSensorApiKey = res.data.apiKey;
                    this.sensorForm = { name: '', model: '', serialNumber: '', location: '', active: true };
                }
                await this.loadSensors();
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },

        async deactivate(gid) {
            const _ok = await this.$confirm({
                message: this.t('sensorDashboard.deactivateConfirm'),
                danger: true
            });
            if (!_ok) return;
            try {
                await window.api.sensors.deactivate(gid);
                await this.loadSensors();
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            }
        },

        async remove(sensor) {
            const name = sensor.name || sensor.gid;
            const samples = (sensor.status && sensor.status.samplesTotal) || 0;
            const warning = this.t('sensorDashboard.deleteConfirm', { name, samples })
                || `Permanently delete sensor "${name}" and all ${samples} telemetry samples? This cannot be undone.`;
            const _ok = await this.$confirm({ message: warning, danger: true });
            if (!_ok) return;
            try {
                await window.api.sensors.remove(sensor.gid);
                if (this.selectedGid === sensor.gid) this.selectedGid = null;
                await this.loadSensors();
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            }
        },

        // ── Bulk import ─────────────────────────────────────────────────
        onBulkFilesChange(e) {
            const files = Array.from(e.target.files || []);
            this.bulkFiles = files.map(file => {
                // Try to auto-match sensor by filename containing the sensor gid
                const stem = file.name.replace(/\.[^.]+$/, '');
                const match = this.sensors.find(s => stem.includes(s.gid) || stem.includes(s.name.replace(/\s+/g, '-')));
                return { file, sensorGid: match ? match.gid : '' };
            });
            this.bulkProgress = null;
        },

        removeBulkFile(idx) {
            this.bulkFiles = this.bulkFiles.filter((_, i) => i !== idx);
        },

        async runBulkImport() {
            if (this.bulkFiles.some(f => !f.sensorGid)) {
                alert('Every file must be assigned to a sensor before importing.');
                return;
            }
            this.bulkRunning = true;
            this.bulkProgress = this.bulkFiles.map(f => ({ name: f.file.name, status: 'pending', result: null }));
            for (let i = 0; i < this.bulkFiles.length; i++) {
                const entry = this.bulkFiles[i];
                this.bulkProgress[i].status = 'uploading';
                try {
                    const res = await window.api.sensors.uploadCSV(entry.sensorGid, entry.file);
                    this.bulkProgress[i].status = 'done';
                    this.bulkProgress[i].result = res.data;
                } catch (err) {
                    this.bulkProgress[i].status = 'failed';
                    this.bulkProgress[i].result = { error: err.response?.data?.error || err.message };
                }
            }
            this.bulkRunning = false;
            await this.loadSensors();
        },

        clearBulkImport() {
            this.bulkFiles = [];
            this.bulkProgress = null;
        }
    },
    template: `
        <div style="padding: 24px; max-width: 1400px; margin: 0 auto;">

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">📡 {{ t('sensorDashboard.title') }}</h2>
                <span style="flex: 1;"></span>
                <button class="btn btn-sm" @click="loadSensors" :disabled="loading">{{ t('sensorDashboard.refresh') }}</button>
                <button class="btn btn-sm btn-primary" @click="showSensorForm ? closeSensorForm() : openCreateForm()">
                    {{ showSensorForm ? t('sensorDashboard.cancel') : t('sensorDashboard.registerSensor') }}
                </button>
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #dc2626; font-size: 13px;">
                {{ error }}
            </div>

            <!-- Register / edit sensor form -->
            <div v-if="showSensorForm" class="sim-card" style="margin-bottom: 16px;">
                <div class="sim-card-title">{{ editingSensorGid ? t('sensorDashboardForm.editTitle') : t('sensorDashboardForm.createTitle') }}</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px;">
                    <input v-model="sensorForm.name" :placeholder="t('sensorDashboardForm.placeholderName')" class="form-input" />
                    <input v-model="sensorForm.model" :placeholder="t('sensorDashboardForm.placeholderModel')" class="form-input" />
                    <input v-model="sensorForm.serialNumber" :placeholder="t('sensorDashboardForm.placeholderSerial')" class="form-input" />
                    <select v-model="sensorForm.location" class="form-input">
                        <option value="">{{ t('sensorDashboardForm.noArtifactLink') }}</option>
                        <optgroup v-if="artifacts.caves.length" :label="t('sensorDashboardForm.groupCaves')">
                            <option v-for="c in artifacts.caves" :key="c.gid" :value="'cave:' + c.gid">
                                🏛️ {{ c.name || c.gid }}
                            </option>
                        </optgroup>
                        <optgroup v-if="artifacts.statues.length" :label="t('sensorDashboardForm.groupStatues')">
                            <option v-for="a in artifacts.statues" :key="a.gid" :value="'statue:' + a.gid">
                                🗿 {{ a.name || a.gid }}
                            </option>
                        </optgroup>
                        <optgroup v-if="artifacts.murals.length" :label="t('sensorDashboardForm.groupMurals')">
                            <option v-for="a in artifacts.murals" :key="a.gid" :value="'mural:' + a.gid">
                                🎨 {{ a.name || a.gid }}
                            </option>
                        </optgroup>
                        <optgroup v-if="artifacts.paintings.length" :label="t('sensorDashboardForm.groupPaintings')">
                            <option v-for="a in artifacts.paintings" :key="a.gid" :value="'painting:' + a.gid">
                                🖼️ {{ a.name || a.gid }}
                            </option>
                        </optgroup>
                        <optgroup v-if="artifacts.inscriptions.length" :label="t('sensorDashboardForm.groupInscriptions')">
                            <option v-for="a in artifacts.inscriptions" :key="a.gid" :value="'inscription:' + a.gid">
                                ✍️ {{ a.name || a.gid }}
                            </option>
                        </optgroup>
                    </select>
                </div>
                <label v-if="editingSensorGid" style="display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 8px; cursor: pointer;">
                    <input type="checkbox" v-model="sensorForm.active" />
                    {{ t('sensorDashboardForm.activeCheckbox') }}
                </label>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" @click="saveSensor" :disabled="loading || !sensorForm.name">
                        {{ editingSensorGid ? t('sensorDashboardForm.saveChanges') : t('sensorDashboardForm.register') }}
                    </button>
                    <button class="btn btn-sm" @click="closeSensorForm" :disabled="loading">{{ t('sensorDashboardForm.cancel') }}</button>
                </div>
                <div v-if="newSensorApiKey" style="margin-top: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px;">
                    <div style="font-weight: 600; color: #065f46; margin-bottom: 4px; font-size: 13px;">{{ t('sensorDashboardForm.apiKeyShown') }}</div>
                    <code style="display: block; background: white; padding: 6px 8px; border-radius: 4px; word-break: break-all; user-select: all; font-size: 12px;">{{ newSensorApiKey }}</code>
                </div>
            </div>

            <!-- Stats row -->
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px;">
                <status-card level="neutral" :title="t('sensorDashboard.total')" :value="stats.total"></status-card>
                <status-card level="ok" :title="t('sensorDashboard.online')" :value="stats.byHealth.online || 0"
                             clickable :active="statusFilter==='online'" @click="statusFilter='online'"></status-card>
                <status-card level="medium" :title="t('sensorDashboard.warning')" :value="stats.byHealth.warning || 0"
                             clickable :active="statusFilter==='warning'" @click="statusFilter='warning'"></status-card>
                <status-card level="high" :title="t('sensorDashboard.offline')" :value="stats.byHealth.offline || 0"
                             clickable :active="statusFilter==='offline'" @click="statusFilter='offline'"></status-card>
                <status-card level="neutral" :title="t('sensorDashboard.inactive')" :value="stats.byHealth.inactive || 0"
                             clickable :active="statusFilter==='inactive'" @click="statusFilter='inactive'"></status-card>
                <status-card level="info" :title="t('sensorDashboard.samples')" :value="stats.totalSamples.toLocaleString()"></status-card>
            </div>

            <!-- Search + filter -->
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input v-model="search" :placeholder="t('sensorDashboard.search')" class="form-input" style="flex: 1;" />
                <button v-if="statusFilter !== 'all'" class="btn btn-sm" @click="statusFilter='all'">{{ t('sensorDashboard.clearFilter') }}</button>
            </div>

            <!-- Sensor table -->
            <div class="sim-card" style="padding: 0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 2px solid #e5e5e5;">
                            <th style="text-align: left; padding: 10px;">{{ t('sensorDashboard.colStatus') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('sensorDashboard.colName') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('sensorDashboard.colModel') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('sensorDashboard.colCave') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('sensorDashboard.colSamples') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('sensorDashboard.colLastSeen') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('sensorDashboard.colActions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredSensors.length === 0">
                            <td colspan="7" style="padding: 20px; text-align: center; color: var(--text-secondary); font-style: italic;">
                                {{ loading ? t('liveData.loading') : t('sensorDashboard.noMatch') }}
                            </td>
                        </tr>
                        <tr v-for="s in filteredSensors" :key="s.gid" style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 8px 10px;">
                                <status-badge :level="healthLevel(s._health)" variant="dot" :label="healthLabel(s._health)"></status-badge>
                            </td>
                            <td style="padding: 8px 10px;">
                                <div style="font-weight: 600;">{{ s.name }}</div>
                                <div style="font-size: 10px; color: var(--text-secondary); font-family: monospace;">{{ s.gid }}</div>
                            </td>
                            <td style="padding: 8px 10px; color: var(--text-secondary);">{{ s.model || '—' }}</td>
                            <td style="padding: 8px 10px; color: var(--text-secondary);">{{ locationLabel(s) }}</td>
                            <td style="padding: 8px 10px; text-align: right;">{{ (s.status?.samplesTotal || 0).toLocaleString() }}</td>
                            <td style="padding: 8px 10px; text-align: right; color: var(--text-secondary); font-size: 11px;">
                                {{ humanAge(s._ageMs) }}
                            </td>
                            <td style="padding: 8px 10px; white-space: nowrap;">
                                <button class="btn btn-xs" @click="openEditForm(s)" style="margin-right: 4px;" :title="t('sensorDashboardForm.editTitle2')">{{ t('sensorDashboardForm.edit') }}</button>
                                <button v-if="s.status?.active" class="btn btn-xs" @click="deactivate(s.gid)" style="background: #fee2e2; color: #991b1b; margin-right: 4px;">{{ t('sensorDashboard.deactivate') }}</button>
                                <button class="btn btn-xs" @click="remove(s)" style="background: #7f1d1d; color: white;" :title="t('sensorDashboard.deleteTitle') || 'Permanently delete sensor and all its samples'">{{ t('sensorDashboard.delete') || 'Delete' }}</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bulk import -->
            <div class="sim-card" style="margin-top: 16px;">
                <div class="sim-card-title">{{ t('sensorDashboard.bulkTitle') }}</div>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 10px 0;">
                    {{ t('sensorDashboard.bulkHint') }}
                </p>

                <input type="file" accept=".csv,text/csv" multiple @change="onBulkFilesChange" style="margin-bottom: 10px;" />

                <div v-if="bulkFiles.length > 0">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="text-align: left; padding: 6px;">File</th>
                                <th style="text-align: left; padding: 6px;">Size</th>
                                <th style="text-align: left; padding: 6px;">Target sensor</th>
                                <th style="text-align: left; padding: 6px;">Status</th>
                                <th style="padding: 6px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(entry, i) in bulkFiles" :key="entry.file.name + i" style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 6px;">{{ entry.file.name }}</td>
                                <td style="padding: 6px; color: var(--text-secondary);">{{ (entry.file.size / 1024).toFixed(1) }} KB</td>
                                <td style="padding: 6px;">
                                    <select v-model="entry.sensorGid" :disabled="bulkRunning" class="preset-select" style="padding: 3px 6px; font-size: 11px;">
                                        <option value="" disabled>Select…</option>
                                        <option v-for="s in sensors" :key="s.gid" :value="s.gid">{{ s.name }} ({{ s.gid.substring(0, 20) }}…)</option>
                                    </select>
                                </td>
                                <td style="padding: 6px;">
                                    <span v-if="bulkProgress && bulkProgress[i]">
                                        <span v-if="bulkProgress[i].status === 'pending'" style="color: var(--text-secondary);">pending</span>
                                        <span v-else-if="bulkProgress[i].status === 'uploading'" style="color: #3b82f6;">uploading…</span>
                                        <span v-else-if="bulkProgress[i].status === 'done'" style="color: #10b981;">
                                            ✓ {{ bulkProgress[i].result.accepted }} accepted,
                                            {{ bulkProgress[i].result.duplicates }} dup,
                                            {{ bulkProgress[i].result.rejected }} rejected
                                        </span>
                                        <span v-else style="color: #ef4444;">✗ {{ bulkProgress[i].result.error }}</span>
                                    </span>
                                    <span v-else style="color: var(--text-secondary);">ready</span>
                                </td>
                                <td style="padding: 6px;">
                                    <button v-if="!bulkRunning" class="btn btn-xs" @click="removeBulkFile(i)" :aria-label="t('common.delete')" style="padding: 1px 6px;">✕</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-primary" @click="runBulkImport" :disabled="bulkRunning || bulkFiles.length === 0">
                            {{ bulkRunning ? t('sensorDashboard.bulkImporting') : (t('sensorDashboard.bulkImportAll') + ' (' + bulkFiles.length + ')') }}
                        </button>
                        <button class="btn btn-sm" @click="clearBulkImport" :disabled="bulkRunning">{{ t('sensorDashboard.bulkClear') }}</button>
                    </div>
                </div>
            </div>

        </div>
    `
};
