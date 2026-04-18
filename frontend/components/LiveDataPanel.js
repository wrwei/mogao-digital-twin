/**
 * Live Data Panel
 * Displays sensor telemetry (T/RH/light) for an artifact:
 *   - Current reading (latest sample)
 *   - Historical time-series chart (T + RH on dual axis)
 *   - Time-range and interval selectors
 *   - Admin-only controls: sensor linking, CSV upload, sensor registration
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'LiveDataPanel',
    props: {
        /** The artifact currently being viewed (must have .gid) */
        entity: { type: Object, default: null },
        /** Whether the current user is an administrator */
        isAdmin: { type: Boolean, default: false }
    },
    emits: ['busy-changed'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            // Query state
            loading: false,
            error: null,
            environment: null,        // server response { samples, summary, sensors, ... }
            range: '7d',              // 24h | 7d | 30d | 1y | all
            interval: 'hourly',       // raw | hourly | daily
            autoRefreshSeconds: 0,    // 0 = off
            _autoRefreshTimer: null,

            // Chart
            chart: null,

            // Admin panel state
            showAdmin: false,
            allSensors: [],           // full list (admin-only)
            adminLoading: false,
            adminError: null,
            newSensorForm: { name: '', model: '', serialNumber: '', cave: '' },
            newSensorApiKey: null,    // returned once after registration
            csvFile: null,
            csvUploadResult: null,
            selectedSensorForUpload: ''
        };
    },
    computed: {
        busy() { return this.loading || this.adminLoading; },
        rangeFromIso() {
            if (this.range === 'all') return null;
            const now = new Date();
            const ms = { '24h': 864e5, '7d': 7*864e5, '30d': 30*864e5, '1y': 365*864e5 }[this.range];
            return new Date(now.getTime() - ms).toISOString();
        },
        latestSample() {
            const s = this.environment?.samples;
            if (!s || s.length === 0) return null;
            return s[s.length - 1];
        },
        sampleCount() { return this.environment?.samples?.length || 0; },
        summary() { return this.environment?.summary || null; },
        sensorsForArtifact() { return this.environment?.sensors || []; }
    },
    watch: {
        entity() { this.refresh(); },
        range() { this.refresh(); },
        interval() { this.refresh(); },
        autoRefreshSeconds(v) {
            if (this._autoRefreshTimer) { clearInterval(this._autoRefreshTimer); this._autoRefreshTimer = null; }
            if (v > 0) this._autoRefreshTimer = setInterval(() => this.refresh(), v * 1000);
        },
        busy(v) { this.$emit('busy-changed', v); }
    },
    mounted() {
        this.refresh();
        if (this.isAdmin) this.loadAllSensors();
    },
    beforeUnmount() {
        if (this._autoRefreshTimer) clearInterval(this._autoRefreshTimer);
        if (this.chart) { this.chart.destroy(); this.chart = null; }
    },
    methods: {
        async refresh() {
            if (!this.entity || !this.entity.gid) return;
            this.loading = true;
            this.error = null;
            try {
                const params = { interval: this.interval };
                if (this.rangeFromIso) params.from = this.rangeFromIso;
                const res = await window.api.exhibits.getEnvironment(this.entity.gid, params);
                this.environment = res.data;
                this.$nextTick(() => this.drawChart());
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },

        drawChart() {
            const canvas = this.$refs.chartCanvas;
            if (!canvas) return;
            const samples = this.environment?.samples || [];
            const labels = samples.map(s => new Date(s.timestamp).toLocaleString());
            const tData = samples.map(s => s.temperature);
            const rhData = samples.map(s => s.humidity);

            if (this.chart) {
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = tData;
                this.chart.data.datasets[1].data = rhData;
                this.chart.update('none');
                return;
            }
            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Temperature (°C)', data: tData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', yAxisID: 'yT', tension: 0.2, pointRadius: 0, borderWidth: 1.5 },
                        { label: 'Humidity (%)',    data: rhData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', yAxisID: 'yRH', tension: 0.2, pointRadius: 0, borderWidth: 1.5 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                        tooltip: { enabled: true }
                    },
                    scales: {
                        x: { display: true, ticks: { maxTicksLimit: 8, font: { size: 10 } }, grid: { display: false } },
                        yT:  { type: 'linear', position: 'left',  title: { display: true, text: '°C', font: { size: 11 } }, grid: { color: 'rgba(239,68,68,0.06)' } },
                        yRH: { type: 'linear', position: 'right', title: { display: true, text: '%RH', font: { size: 11 } }, min: 0, max: 100, grid: { display: false } }
                    }
                }
            });
        },

        // ── Admin ────────────────────────────────────────────────────────
        async loadAllSensors() {
            if (!this.isAdmin) return;
            this.adminLoading = true;
            try {
                const res = await window.api.sensors.list();
                this.allSensors = res.data;
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        async linkSensor(sensorGid) {
            if (!this.entity?.gid) return;
            this.adminLoading = true;
            this.adminError = null;
            try {
                await window.api.sensors.linkArtifact(sensorGid, this.entity.gid);
                await this.loadAllSensors();
                await this.refresh();
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        async unlinkSensor(sensorGid) {
            if (!this.entity?.gid) return;
            this.adminLoading = true;
            this.adminError = null;
            try {
                await window.api.sensors.unlinkArtifact(sensorGid, this.entity.gid);
                await this.loadAllSensors();
                await this.refresh();
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        async registerSensor() {
            if (!this.newSensorForm.name) return;
            this.adminLoading = true;
            this.adminError = null;
            this.newSensorApiKey = null;
            try {
                const payload = {
                    name: this.newSensorForm.name,
                    model: this.newSensorForm.model || undefined,
                    serialNumber: this.newSensorForm.serialNumber || undefined,
                    location: { cave: this.newSensorForm.cave || undefined }
                };
                const res = await window.api.sensors.register(payload);
                this.newSensorApiKey = res.data.apiKey;
                this.newSensorForm = { name: '', model: '', serialNumber: '', cave: '' };
                await this.loadAllSensors();
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        onCsvFileChange(e) {
            this.csvFile = e.target.files[0] || null;
            this.csvUploadResult = null;
        },

        async uploadCsv() {
            if (!this.csvFile || !this.selectedSensorForUpload) return;
            this.adminLoading = true;
            this.adminError = null;
            this.csvUploadResult = null;
            try {
                const res = await window.api.sensors.uploadCSV(this.selectedSensorForUpload, this.csvFile);
                this.csvUploadResult = res.data;
                await this.refresh();
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        isSensorLinkedToArtifact(sensor) {
            if (!this.entity?.gid) return false;
            const list = sensor.location?.explicitArtifacts || [];
            return list.includes(this.entity.gid);
        }
    },
    template: `
        <div class="live-data-panel" style="padding: 16px 20px; background: white; border-radius: 12px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative;">

            <!-- Loading overlay -->
            <div v-if="busy" style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); border-radius: 12px; z-index: 20; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div class="pigment-spinner"></div>
                <span style="font-size: 13px; font-weight: 500; color: #555;">Loading…</span>
            </div>

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                <span style="font-size: 18px;">📡</span>
                <span style="font-weight: 600; font-size: 14px;">Environment Monitoring</span>
                <span v-if="sensorsForArtifact.length" style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                    {{ sensorsForArtifact.length }} sensor{{ sensorsForArtifact.length > 1 ? 's' : '' }} · {{ sampleCount }} samples
                </span>
            </div>

            <!-- No sensors hint -->
            <div v-if="!loading && sensorsForArtifact.length === 0 && !error" style="background: #fff8e8; border-left: 3px solid #f59e0b; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #5c4a1a;">
                No sensors are linked to this artifact or its parent cave yet.
                <span v-if="isAdmin">Use the admin panel below to link one or register a new sensor.</span>
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                {{ error }}
            </div>

            <!-- Current reading summary -->
            <div v-if="latestSample" style="display: flex; gap: 12px; margin-bottom: 14px;">
                <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Temp</div>
                    <div style="font-size: 22px; font-weight: 700; color: #dc2626;">{{ latestSample.temperature.toFixed(1) }}°C</div>
                </div>
                <div style="flex: 1; background: #eff6ff; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">RH</div>
                    <div style="font-size: 22px; font-weight: 700; color: #2563eb;">{{ latestSample.humidity.toFixed(0) }}%</div>
                </div>
                <div v-if="summary && summary.humidity" style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Daily ΔRH</div>
                    <div style="font-size: 22px; font-weight: 700; color: #b45309;">{{ summary.humidity.dailyAmplitudeMean.toFixed(1) }}%</div>
                </div>
            </div>

            <!-- Controls -->
            <div v-if="sensorsForArtifact.length" style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; font-size: 12px;">
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Range</label>
                    <select v-model="range" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option value="24h">Last 24h</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="1y">Last year</option>
                        <option value="all">All time</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Interval</label>
                    <select v-model="interval" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option value="raw">Raw (10 min)</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Auto-refresh</label>
                    <select v-model.number="autoRefreshSeconds" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option :value="0">Off</option>
                        <option :value="30">30 s</option>
                        <option :value="120">2 min</option>
                        <option :value="600">10 min</option>
                    </select>
                </div>
                <button @click="refresh" class="btn btn-xs" :disabled="busy" style="align-self: flex-end;">↻ Refresh</button>
            </div>

            <!-- Chart -->
            <div v-if="sensorsForArtifact.length" style="position: relative; height: 220px; background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
                <canvas ref="chartCanvas"></canvas>
            </div>

            <!-- Summary stats -->
            <div v-if="summary && summary.count > 0" style="background: #fafafa; border-radius: 8px; padding: 10px; margin-bottom: 14px; font-size: 12px;">
                <div style="font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">Period Summary ({{ summary.count }} samples, {{ summary.daysCovered }} days)</div>
                <div style="display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 4px 12px;">
                    <span style="color: var(--text-secondary);">T mean</span><strong>{{ summary.temperature.mean?.toFixed(1) }}°C</strong>
                    <span style="color: var(--text-secondary);">T range</span><strong>{{ summary.temperature.min?.toFixed(1) }} – {{ summary.temperature.max?.toFixed(1) }}°C</strong>
                    <span style="color: var(--text-secondary);">RH mean</span><strong>{{ summary.humidity.mean?.toFixed(1) }}%</strong>
                    <span style="color: var(--text-secondary);">RH range</span><strong>{{ summary.humidity.min?.toFixed(0) }} – {{ summary.humidity.max?.toFixed(0) }}%</strong>
                    <span style="color: var(--text-secondary);">T stddev</span><strong>{{ summary.temperature.stddev?.toFixed(2) }}</strong>
                    <span style="color: var(--text-secondary);">ΔRH / day</span><strong>{{ summary.humidity.dailyAmplitudeMean?.toFixed(1) }}%</strong>
                </div>
            </div>

            <!-- Admin panel (collapsible) -->
            <div v-if="isAdmin" style="border-top: 1px solid #e5e5e5; padding-top: 10px;">
                <button @click="showAdmin = !showAdmin" class="btn btn-xs" style="width: 100%; text-align: left;">
                    {{ showAdmin ? '▼' : '▶' }} Admin controls
                </button>

                <div v-if="showAdmin" style="margin-top: 10px;">

                    <!-- Admin error -->
                    <div v-if="adminError" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                        {{ adminError }}
                    </div>

                    <!-- Sensor linking -->
                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Sensors (link to this artifact)</div>
                        <div v-if="allSensors.length === 0" style="font-size: 11px; font-style: italic; color: var(--text-secondary);">No sensors registered yet.</div>
                        <div v-for="s in allSensors" :key="s.gid" style="display: flex; gap: 6px; align-items: center; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f0ece7;">
                            <span :style="{ fontWeight: isSensorLinkedToArtifact(s) ? 600 : 400 }">{{ s.name }}</span>
                            <span style="color: var(--text-secondary); font-size: 10px;">{{ s.model || '—' }}</span>
                            <span style="color: var(--text-secondary); font-size: 10px;">· cave {{ s.location?.cave || '—' }}</span>
                            <span style="flex: 1;"></span>
                            <button v-if="!isSensorLinkedToArtifact(s)" class="btn btn-xs" @click="linkSensor(s.gid)" :disabled="busy">Link</button>
                            <button v-else class="btn btn-xs" @click="unlinkSensor(s.gid)" :disabled="busy" style="background: #fee2e2; color: #991b1b;">Unlink</button>
                        </div>
                    </div>

                    <!-- CSV upload -->
                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">CSV Upload</div>
                        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
                            <select v-model="selectedSensorForUpload" class="preset-select" style="flex: 1; padding: 4px 8px; font-size: 12px;">
                                <option value="" disabled>Select sensor…</option>
                                <option v-for="s in allSensors" :key="s.gid" :value="s.gid">{{ s.name }}</option>
                            </select>
                            <input type="file" accept=".csv,text/csv" @change="onCsvFileChange" style="font-size: 11px;" />
                            <button class="btn btn-xs" @click="uploadCsv" :disabled="busy || !csvFile || !selectedSensorForUpload">Upload</button>
                        </div>
                        <div v-if="csvUploadResult" style="font-size: 11px; color: #065f46; background: #ecfdf5; border-radius: 4px; padding: 4px 8px;">
                            ✓ Accepted {{ csvUploadResult.accepted }}, duplicates {{ csvUploadResult.duplicates }}, rejected {{ csvUploadResult.rejected }}
                        </div>
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
                            CSV must have columns: timestamp, temperature, humidity (lightKlux optional).
                        </div>
                    </div>

                    <!-- Register new sensor -->
                    <div>
                        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Register new sensor</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
                            <input v-model="newSensorForm.name" placeholder="Name *" class="form-input" style="font-size: 12px; padding: 4px 8px;" />
                            <input v-model="newSensorForm.model" placeholder="Model" class="form-input" style="font-size: 12px; padding: 4px 8px;" />
                            <input v-model="newSensorForm.serialNumber" placeholder="Serial #" class="form-input" style="font-size: 12px; padding: 4px 8px;" />
                            <input v-model="newSensorForm.cave" placeholder="Cave gid" class="form-input" style="font-size: 12px; padding: 4px 8px;" />
                        </div>
                        <button class="btn btn-xs" @click="registerSensor" :disabled="busy || !newSensorForm.name">Register sensor</button>
                        <div v-if="newSensorApiKey" style="margin-top: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 8px; font-size: 11px;">
                            <div style="font-weight: 600; color: #065f46; margin-bottom: 4px;">✓ Sensor registered — save this API key (shown once):</div>
                            <code style="display: block; background: white; padding: 4px 6px; border-radius: 3px; word-break: break-all; user-select: all;">{{ newSensorApiKey }}</code>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
};
