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
    inject: ['$confirm'],
    setup() {
        const { t, locale } = useI18n();
        return { t, locale };
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
            csvFile: null,
            csvUploadResult: null,
            selectedSensorForUpload: '',
            expandedSensor: null,     // gid of sensor whose detail/usage panel is open
            rotatedKeys: {},          // { [sensorGid]: plaintext API key (shown once) }
            copyFlashes: {}           // { [key]: true for 1.5s } for copy button feedback
        };
    },
    computed: {
        busy() { return this.loading || this.adminLoading; },
        apiBaseUrl() {
            return (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:8008';
        },
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
        sensorsForArtifact() { return this.environment?.sensors || []; },
        /** Detect gaps in the time-series where consecutive samples are
         *  farther apart than the expected cadence * 2. Returns:
         *    { count, totalMs, list: [{ from, to, durationMs }] } */
        gapInfo() {
            const samples = this.environment?.samples || [];
            if (samples.length < 2) return { count: 0, totalMs: 0, list: [] };
            // Expected cadence: raw=10min, hourly=1h, daily=1d
            const expected = { raw: 10*60*1000, hourly: 3600*1000, daily: 86400*1000 }[this.interval] || 10*60*1000;
            const threshold = expected * 2.5;
            const list = [];
            let totalMs = 0;
            for (let i = 1; i < samples.length; i++) {
                const prev = new Date(samples[i-1].timestamp).getTime();
                const curr = new Date(samples[i].timestamp).getTime();
                const d = curr - prev;
                if (d > threshold) {
                    list.push({ from: samples[i-1].timestamp, to: samples[i].timestamp, durationMs: d });
                    totalMs += d;
                }
            }
            return { count: list.length, totalMs, list };
        }
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

            // Build chart points with null insertions at gap boundaries,
            // so the line breaks visually rather than interpolating across the gap.
            const expected = { raw: 10*60*1000, hourly: 3600*1000, daily: 86400*1000 }[this.interval] || 10*60*1000;
            const gapThreshold = expected * 2.5;
            const labels = [];
            const tData = [];
            const rhData = [];
            for (let i = 0; i < samples.length; i++) {
                if (i > 0) {
                    const prev = new Date(samples[i-1].timestamp).getTime();
                    const curr = new Date(samples[i].timestamp).getTime();
                    if (curr - prev > gapThreshold) {
                        // Insert a null marker at the gap midpoint so the line breaks
                        labels.push('');
                        tData.push(null);
                        rhData.push(null);
                    }
                }
                labels.push(new Date(samples[i].timestamp).toLocaleString());
                tData.push(samples[i].temperature);
                rhData.push(samples[i].humidity);
            }

            if (this.chart) {
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = tData;
                this.chart.data.datasets[1].data = rhData;
                this.chart.update('none');
                return;
            }
            // Vue.markRaw prevents Vue's reactivity proxy from wrapping the
            // Chart.js instance. Without it, Chart.js's color animator hits a
            // circular toRaw chain and recurses into a stack overflow loop
            // (visible as "Maximum call stack size exceeded" + 100+ rAF-driven
            // "Cannot read properties of undefined" errors in the console).
            this.chart = Vue.markRaw(new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Temperature (°C)', data: tData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', yAxisID: 'yT', tension: 0.2, pointRadius: 0, borderWidth: 1.5, spanGaps: false },
                        { label: 'Humidity (%)',    data: rhData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', yAxisID: 'yRH', tension: 0.2, pointRadius: 0, borderWidth: 1.5, spanGaps: false }
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
            }));
        },

        formatDuration(ms) {
            const s = Math.floor(ms / 1000);
            if (s < 60) return `${s}s`;
            if (s < 3600) return `${Math.floor(s/60)}m`;
            if (s < 86400) {
                const h = Math.floor(s/3600);
                const m = Math.floor((s % 3600) / 60);
                return m > 0 ? `${h}h ${m}m` : `${h}h`;
            }
            return `${(s/86400).toFixed(1)}d`;
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
        },

        toggleSensorDetails(gid) {
            this.expandedSensor = this.expandedSensor === gid ? null : gid;
        },

        async rotateKey(gid) {
            const _ok = await this.$confirm({
                message: this.t('liveData.rotateKeyConfirm') || 'This invalidates the current API key. Any field logger using the old key will stop being able to post data until reconfigured. Continue?',
                danger: true
            });
            if (!_ok) return;
            this.adminLoading = true;
            this.adminError = null;
            try {
                const res = await window.api.sensors.rotateKey(gid);
                this.rotatedKeys = { ...this.rotatedKeys, [gid]: res.data.apiKey };
                await this.loadAllSensors();
            } catch (err) {
                this.adminError = err.response?.data?.error || err.message;
            } finally {
                this.adminLoading = false;
            }
        },

        async copyToClipboard(text, flashKey) {
            try {
                await navigator.clipboard.writeText(text);
                this.copyFlashes = { ...this.copyFlashes, [flashKey]: true };
                setTimeout(() => {
                    const next = { ...this.copyFlashes };
                    delete next[flashKey];
                    this.copyFlashes = next;
                }, 1500);
            } catch (err) {
                console.warn('Clipboard write failed:', err);
            }
        },

        /** Ingest endpoint URL for a given path ('samples' | 'samples/batch' | 'samples/upload'). */
        endpointUrl(path) {
            return `${this.apiBaseUrl}/telemetry/${path}`;
        },

        /** Example curl command for batch ingestion, using the key if the admin just rotated it. */
        curlExample(sensor) {
            const key = this.rotatedKeys[sensor.gid] || `${sensor.apiKeyPrefix}.<secret>`;
            const url = this.endpointUrl('samples/batch');
            return `curl -X POST "${url}" \\\n  -H "X-Sensor-Key: ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"samples":[{"timestamp":"2026-04-18T10:00:00Z","temperature":13.2,"humidity":37.4}]}'`;
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
                <span style="font-weight: 600; font-size: 14px;">{{ t('liveData.title') }}</span>
                <span v-if="sensorsForArtifact.length" style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                    {{ sensorsForArtifact.length }} {{ t('liveData.sensors') }} · {{ sampleCount }} {{ t('liveData.samples') }}
                </span>
            </div>

            <!-- No sensors hint -->
            <div v-if="!loading && sensorsForArtifact.length === 0 && !error" style="background: #fff8e8; border-left: 3px solid #f59e0b; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #5c4a1a;">
                {{ t('liveData.noSensors') }}
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                {{ error }}
            </div>

            <!-- Current reading summary -->
            <div v-if="latestSample" style="display: flex; gap: 12px; margin-bottom: 14px;">
                <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">{{ t('liveData.currentTemp') }}</div>
                    <div style="font-size: 22px; font-weight: 700; color: #dc2626;">{{ latestSample.temperature.toFixed(1) }}°C</div>
                </div>
                <div style="flex: 1; background: #eff6ff; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">{{ t('liveData.currentRh') }}</div>
                    <div style="font-size: 22px; font-weight: 700; color: #2563eb;">{{ latestSample.humidity.toFixed(0) }}%</div>
                </div>
                <div v-if="summary && summary.humidity" style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">{{ t('liveData.dailyRhAmplitude') }}</div>
                    <div style="font-size: 22px; font-weight: 700; color: #b45309;">{{ summary.humidity.dailyAmplitudeMean.toFixed(1) }}%</div>
                </div>
            </div>

            <!-- Controls -->
            <div v-if="sensorsForArtifact.length" style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; font-size: 12px;">
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">{{ t('liveData.range') }}</label>
                    <select v-model="range" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option value="24h">{{ t('liveData.last24h') }}</option>
                        <option value="7d">{{ t('liveData.last7d') }}</option>
                        <option value="30d">{{ t('liveData.last30d') }}</option>
                        <option value="1y">{{ t('liveData.last1y') }}</option>
                        <option value="all">{{ t('liveData.allTime') }}</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">{{ t('liveData.interval') }}</label>
                    <select v-model="interval" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option value="raw">{{ t('liveData.raw') }}</option>
                        <option value="hourly">{{ t('liveData.hourly') }}</option>
                        <option value="daily">{{ t('liveData.daily') }}</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">{{ t('liveData.autoRefresh') }}</label>
                    <select v-model.number="autoRefreshSeconds" class="preset-select" style="padding: 4px 8px; font-size: 12px;">
                        <option :value="0">{{ t('liveData.off') }}</option>
                        <option :value="30">30 s</option>
                        <option :value="120">2 min</option>
                        <option :value="600">10 min</option>
                    </select>
                </div>
                <button @click="refresh" class="btn btn-xs" :disabled="busy" style="align-self: flex-end;">↻ {{ t('liveData.refresh') }}</button>
            </div>

            <!-- Chart -->
            <div v-if="sensorsForArtifact.length" style="position: relative; height: 220px; background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
                <canvas ref="chartCanvas"></canvas>
            </div>

            <!-- Data-gap notice -->
            <div v-if="gapInfo.count > 0" style="background: #fff8e8; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #5c4a1a;">
                <div style="font-weight: 600; margin-bottom: 4px;">⚠ {{ gapInfo.count }} data gap{{ gapInfo.count > 1 ? 's' : '' }} detected (totalling {{ formatDuration(gapInfo.totalMs) }})</div>
                <div style="font-size: 11px;">
                    <div v-for="(g, i) in gapInfo.list.slice(0, 5)" :key="i" style="color: #8b5a00;">
                        · {{ new Date(g.from).toLocaleString() }} → {{ new Date(g.to).toLocaleString() }} ({{ formatDuration(g.durationMs) }})
                    </div>
                    <div v-if="gapInfo.list.length > 5" style="color: #8b5a00; font-style: italic;">
                        … and {{ gapInfo.list.length - 5 }} more.
                    </div>
                </div>
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
                    {{ showAdmin ? '▼' : '▶' }} {{ t('liveData.adminControls') }}
                </button>

                <div v-if="showAdmin" style="margin-top: 10px;">

                    <!-- Admin error -->
                    <div v-if="adminError" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                        {{ adminError }}
                    </div>

                    <!-- Sensor list with link/unlink + expandable usage details -->
                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Registered sensors</div>
                        <div v-if="allSensors.length === 0" style="font-size: 11px; font-style: italic; color: var(--text-secondary);">No sensors registered yet.</div>
                        <div v-for="s in allSensors" :key="s.gid" style="border-bottom: 1px solid #f0ece7;">
                            <!-- Row header -->
                            <div style="display: flex; gap: 6px; align-items: center; padding: 6px 0; font-size: 12px;">
                                <button class="btn btn-xs" @click="toggleSensorDetails(s.gid)" style="min-width: 24px; padding: 2px 6px;">
                                    {{ expandedSensor === s.gid ? '▼' : '▶' }}
                                </button>
                                <span :style="{ fontWeight: isSensorLinkedToArtifact(s) ? 600 : 400 }">{{ s.name }}</span>
                                <span style="color: var(--text-secondary); font-size: 10px;">{{ s.model || '—' }}</span>
                                <span style="color: var(--text-secondary); font-size: 10px;">· cave {{ s.location?.cave || '—' }}</span>
                                <span v-if="!s.status?.active" style="font-size: 10px; color: #b45309; font-weight: 600;">inactive</span>
                                <span style="flex: 1;"></span>
                                <button v-if="!isSensorLinkedToArtifact(s)" class="btn btn-xs" @click="linkSensor(s.gid)" :disabled="busy">Link</button>
                                <button v-else class="btn btn-xs" @click="unlinkSensor(s.gid)" :disabled="busy" style="background: #fee2e2; color: #991b1b;">Unlink</button>
                            </div>

                            <!-- Expanded details / usage info -->
                            <div v-if="expandedSensor === s.gid" style="padding: 10px 12px 14px 30px; background: #fafafa; font-size: 11px; margin-bottom: 6px; border-radius: 6px;">

                                <!-- Identification -->
                                <div style="display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; margin-bottom: 10px;">
                                    <span style="color: var(--text-secondary);">Sensor gid</span>
                                    <code style="font-size: 11px;">{{ s.gid }}</code>
                                    <span style="color: var(--text-secondary);">Key prefix</span>
                                    <code style="font-size: 11px;">{{ s.apiKeyPrefix }}.&lt;secret&gt;</code>
                                    <span style="color: var(--text-secondary);">Channels</span>
                                    <span>{{ (s.channels || []).join(', ') || '—' }}</span>
                                    <span style="color: var(--text-secondary);">Samples ingested</span>
                                    <span>{{ s.status?.samplesTotal || 0 }}</span>
                                    <span style="color: var(--text-secondary);">Last seen</span>
                                    <span>{{ s.status?.lastSeenAt ? new Date(s.status.lastSeenAt).toLocaleString() : 'never' }}</span>
                                </div>

                                <!-- Ingestion endpoints -->
                                <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">Ingestion endpoints</div>
                                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 4px 8px; align-items: center; margin-bottom: 10px;">
                                    <span style="color: var(--text-secondary);">Single</span>
                                    <code style="font-size: 10px; word-break: break-all;">POST {{ endpointUrl('samples') }}</code>
                                    <button class="btn btn-xs" @click="copyToClipboard(endpointUrl('samples'), s.gid + '-single')" style="padding: 1px 6px;">
                                        {{ copyFlashes[s.gid + '-single'] ? '✓' : 'Copy' }}
                                    </button>
                                    <span style="color: var(--text-secondary);">Batch</span>
                                    <code style="font-size: 10px; word-break: break-all;">POST {{ endpointUrl('samples/batch') }}</code>
                                    <button class="btn btn-xs" @click="copyToClipboard(endpointUrl('samples/batch'), s.gid + '-batch')" style="padding: 1px 6px;">
                                        {{ copyFlashes[s.gid + '-batch'] ? '✓' : 'Copy' }}
                                    </button>
                                    <span style="color: var(--text-secondary);">CSV</span>
                                    <code style="font-size: 10px; word-break: break-all;">POST {{ endpointUrl('samples/upload') }}</code>
                                    <button class="btn btn-xs" @click="copyToClipboard(endpointUrl('samples/upload'), s.gid + '-csv')" style="padding: 1px 6px;">
                                        {{ copyFlashes[s.gid + '-csv'] ? '✓' : 'Copy' }}
                                    </button>
                                </div>
                                <div style="color: var(--text-secondary); margin-bottom: 10px;">
                                    Authenticate with header: <code style="font-size: 10px;">X-Sensor-Key: &lt;prefix&gt;.&lt;secret&gt;</code>
                                </div>

                                <!-- API key management -->
                                <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">API key</div>
                                <div v-if="rotatedKeys[s.gid]" style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                                    <div style="font-weight: 600; color: #065f46; margin-bottom: 4px;">✓ New key generated — save it now (shown once):</div>
                                    <div style="display: flex; gap: 6px; align-items: center;">
                                        <code style="flex: 1; background: white; padding: 4px 6px; border-radius: 3px; word-break: break-all; user-select: all; font-size: 10px;">{{ rotatedKeys[s.gid] }}</code>
                                        <button class="btn btn-xs" @click="copyToClipboard(rotatedKeys[s.gid], s.gid + '-key')" style="padding: 1px 6px;">
                                            {{ copyFlashes[s.gid + '-key'] ? '✓' : 'Copy' }}
                                        </button>
                                    </div>
                                </div>
                                <div v-else style="color: var(--text-secondary); margin-bottom: 8px;">
                                    The secret portion of the key is stored as a bcrypt hash and cannot be recovered.
                                    If the field deployment has lost its key, rotate it to issue a new one.
                                </div>
                                <button class="btn btn-xs" @click="rotateKey(s.gid)" :disabled="busy" style="background: #fff7ed; color: #9a3412; border-color: #fed7aa;">
                                    🔑 Rotate API key
                                </button>

                                <!-- Curl example -->
                                <div style="font-weight: 600; color: var(--text-secondary); margin: 10px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">Example usage</div>
                                <div style="position: relative;">
                                    <pre style="background: #1e293b; color: #e2e8f0; font-size: 10px; padding: 10px 38px 10px 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0;">{{ curlExample(s) }}</pre>
                                    <button class="btn btn-xs" @click="copyToClipboard(curlExample(s), s.gid + '-curl')" style="position: absolute; top: 6px; right: 6px; padding: 1px 6px; background: #334155; color: white; border-color: #475569;">
                                        {{ copyFlashes[s.gid + '-curl'] ? '✓' : 'Copy' }}
                                    </button>
                                </div>
                            </div>
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

                    <!-- Register / edit / delete a sensor: handled exclusively
                         on the Sensors page in the sidebar so this artefact
                         view stays focused on viewing telemetry, not fleet
                         management. -->
                </div>
            </div>

        </div>
    `
};
