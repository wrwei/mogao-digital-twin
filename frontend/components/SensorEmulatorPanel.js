/**
 * SensorEmulatorPanel — admin "Data Lab" tab on the Sensors page.
 *
 * Lists every sensor (climate + cameras) and per sensor exposes:
 *   - Start / Stop toggle (writes to the in-process runner on the backend)
 *   - Cadence (seconds between samples) and channel checkboxes
 *   - Synthetic-data parameters (T/RH means + amplitudes, summer spike rate)
 *     — collapsible per-card so the page isn't visually overwhelming
 *   - Catchup button — bulk backfill N days at 10-min cadence
 *   - Live status: started-at, sample count, last sample, last error
 *
 * Polls /emulator/status every 4s while mounted so the panel stays in sync
 * with whatever's actually running on the backend.
 */
import { useI18n } from '../i18n.js';

const POLL_INTERVAL_MS = 4000;

function defaultLocal(defaults) {
    return {
        cadenceSec: 10,
        catchupDays: 7,
        channels: { temperature: true, humidity: true, light: false },
        params: { ...(defaults || {}) },
        expanded: false
    };
}

export default {
    name: 'SensorEmulatorPanel',
    inject: ['$confirm'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            loading: false,
            error: null,
            defaults: {},
            sensors: [],         // [{ sensor, running, config?, stats? }]
            locals: {},          // sensorGid → local UI state (sliders, channel toggles, expanded, etc.)
            pollTimer: null,
            busyByGid: {},       // sensorGid → boolean while a request is in-flight
            _patchTimers: {}     // sensorGid → debounce handle for the live PATCH /config call
        };
    },
    async mounted() {
        await this.refresh();
        this.pollTimer = setInterval(this.refresh, POLL_INTERVAL_MS);
    },
    beforeUnmount() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        for (const h of Object.values(this._patchTimers)) clearTimeout(h);
    },
    methods: {
        async refresh() {
            try {
                const { data } = await window.api.emulator.status();
                this.defaults = data.defaults || {};
                this.sensors = data.sensors || [];
                // Seed local UI state for any sensor we haven't seen yet. If the
                // backend says "running" we hydrate the local form from the
                // running config so the controls reflect reality.
                for (const row of this.sensors) {
                    const gid = row.sensor.gid;
                    if (!this.locals[gid]) {
                        this.locals[gid] = defaultLocal(data.defaults);
                        // Pre-tick channel checkboxes based on the sensor's declared channels.
                        const ch = row.sensor.channels || [];
                        this.locals[gid].channels = {
                            temperature: ch.includes('temperature') || ch.length === 0,
                            humidity:    ch.includes('humidity')    || ch.length === 0,
                            light:       ch.includes('light')
                        };
                    }
                    if (row.running && row.config) {
                        // Sync the live config back to the form so a refresh
                        // doesn't clobber settings made elsewhere (e.g. CLI).
                        const local = this.locals[gid];
                        local.cadenceSec = row.config.cadenceSec;
                        for (const k of ['temperature', 'humidity', 'light']) {
                            local.channels[k] = (row.config.channels || []).includes(k);
                        }
                        if (row.config.params) {
                            for (const [k, v] of Object.entries(row.config.params)) {
                                local.params[k] = v;
                            }
                        }
                    }
                }
                this.error = null;
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            }
        },

        _channelsArray(gid) {
            const c = this.locals[gid].channels;
            return Object.keys(c).filter(k => c[k]);
        },

        /**
         * Debounced live-patch: collapses a flurry of slider events (~one per
         * pixel of drag) into a single backend call ~250 ms after the user
         * stops moving. Only fires if the sensor's runner is actually running
         * — pre-Start changes stay local and are sent in full at Start time.
         */
        _isRunning(gid) {
            const row = this.sensors.find(r => r.sensor.gid === gid);
            return !!(row && row.running);
        },
        _scheduleLivePatch(gid, body) {
            if (!this._isRunning(gid)) return;
            if (this._patchTimers[gid]) clearTimeout(this._patchTimers[gid]);
            this._patchTimers[gid] = setTimeout(async () => {
                this._patchTimers[gid] = null;
                try {
                    await window.api.emulator.update(gid, body);
                } catch (err) {
                    // 404 = not running anymore; ignore. Any other status was
                    // logged by the interceptor.
                }
            }, 250);
        },

        setTargetT(gid, value) {
            const v = Number(value);
            this.locals[gid].params.tMean = v;
            this._scheduleLivePatch(gid, { params: { tMean: v } });
        },
        setTargetRH(gid, value) {
            const v = Number(value);
            this.locals[gid].params.rhMean = v;
            this._scheduleLivePatch(gid, { params: { rhMean: v } });
        },
        setCadence(gid, value) {
            const v = Math.max(1, Number(value));
            this.locals[gid].cadenceSec = v;
            this._scheduleLivePatch(gid, { cadenceSec: v });
        },
        toggleChannel(gid, channel, checked) {
            this.locals[gid].channels[channel] = checked;
            this._scheduleLivePatch(gid, { channels: this._channelsArray(gid) });
        },
        setParam(gid, key, value) {
            const v = Number(value);
            this.locals[gid].params[key] = v;
            this._scheduleLivePatch(gid, { params: { [key]: v } });
        },

        async startEmulator(gid) {
            this.busyByGid[gid] = true;
            try {
                const local = this.locals[gid];
                await window.api.emulator.start(gid, {
                    cadenceSec: local.cadenceSec,
                    channels:   this._channelsArray(gid),
                    params:     local.params
                });
                await this.refresh();
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.busyByGid[gid] = false;
            }
        },

        async stopEmulator(gid) {
            this.busyByGid[gid] = true;
            try {
                await window.api.emulator.stop(gid);
                await this.refresh();
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.busyByGid[gid] = false;
            }
        },

        async runCatchup(gid) {
            const local = this.locals[gid];
            const ok = await this.$confirm({
                message: this.t('emulator.catchupConfirm', { days: local.catchupDays })
                    || `Backfill ${local.catchupDays} days of synthetic samples for this sensor? Existing samples in the same minute-buckets will be left alone (deduped).`
            });
            if (!ok) return;
            this.busyByGid[gid] = true;
            try {
                const { data } = await window.api.emulator.catchup(gid, {
                    days:     local.catchupDays,
                    channels: this._channelsArray(gid),
                    params:   local.params
                });
                this.error = null;
                alert(this.t('emulator.catchupDone', { ...data }) ||
                      `Catchup complete: ${data.accepted} accepted, ${data.duplicates} duplicates, ${data.rejected} rejected.`);
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.busyByGid[gid] = false;
            }
        },

        formatNum(v, digits = 2) {
            if (v === null || v === undefined || Number.isNaN(v)) return '—';
            return Number(v).toFixed(digits);
        },
        formatTime(iso) {
            if (!iso) return '—';
            try { return new Date(iso).toLocaleString(); } catch (_) { return String(iso); }
        }
    },
    template: `
        <div style="padding: 4px 0;">
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #c1432c; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; color: #963326;">
                {{ error }}
            </div>

            <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 14px;">
                {{ t('emulator.intro') || 'Synthetic data publisher for development and demos. Each sensor gets its own runner — adjust parameters then Start to begin emitting samples at the chosen cadence. Catchup fills past history in one go.' }}
            </p>

            <div v-if="sensors.length === 0" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px; font-style: italic;">
                {{ t('emulator.noSensors') || 'No sensors registered yet. Add one from the Fleet tab first.' }}
            </div>

            <div v-for="row in sensors" :key="row.sensor.gid"
                 :style="{
                     background: 'var(--surface)',
                     border: '1px solid var(--border)',
                     borderLeft: '4px solid ' + (row.running ? 'var(--success-color)' : 'var(--border-strong)'),
                     borderRadius: 'var(--radius-md)',
                     padding: '14px 16px',
                     marginBottom: '12px',
                     boxShadow: 'var(--shadow-sm)'
                 }">

                <!-- Header: name + running status + start/stop -->
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">
                            <span v-if="row.running" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--success-color); margin-right: 8px; box-shadow: 0 0 8px var(--success-color);"></span>
                            {{ row.sensor.name || row.sensor.gid }}
                        </div>
                        <div style="font-family: monospace; font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            {{ row.sensor.gid }} · channels: {{ (row.sensor.channels || []).join(', ') || '—' }}
                        </div>
                    </div>
                    <button v-if="!row.running"
                            class="btn btn-sm btn-primary"
                            :disabled="busyByGid[row.sensor.gid]"
                            @click="startEmulator(row.sensor.gid)">
                        ▶ {{ t('emulator.start') || 'Start' }}
                    </button>
                    <button v-else
                            class="btn btn-sm"
                            :disabled="busyByGid[row.sensor.gid]"
                            style="background: #fee2e2; color: #991b1b; border: 1px solid #fad6c2;"
                            @click="stopEmulator(row.sensor.gid)">
                        ■ {{ t('emulator.stop') || 'Stop' }}
                    </button>
                </div>

                <!-- Live status when running -->
                <div v-if="row.running && row.stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; font-size: 12px;">
                    <div style="background: var(--surface-elevated); border-radius: 6px; padding: 6px 10px;">
                        <div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">{{ t('emulator.sampleCount') || 'Samples' }}</div>
                        <div style="font-weight: 700; font-family: monospace;">{{ row.stats.sampleCount }}</div>
                    </div>
                    <div style="background: var(--surface-elevated); border-radius: 6px; padding: 6px 10px;">
                        <div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">{{ t('emulator.startedAt') || 'Started' }}</div>
                        <div style="font-weight: 700; font-family: monospace; font-size: 11px;">{{ formatTime(row.stats.startedAt) }}</div>
                    </div>
                    <div style="background: var(--surface-elevated); border-radius: 6px; padding: 6px 10px;">
                        <div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">{{ t('emulator.lastSample') || 'Last' }}</div>
                        <div style="font-weight: 700; font-family: monospace; font-size: 11px;">
                            <template v-if="row.stats.lastSample">
                                <span v-if="row.stats.lastSample.temperature != null">T={{ formatNum(row.stats.lastSample.temperature) }}°C</span>
                                <span v-if="row.stats.lastSample.humidity != null" style="margin-left: 6px;">RH={{ formatNum(row.stats.lastSample.humidity) }}%</span>
                            </template>
                            <span v-else>—</span>
                        </div>
                    </div>
                </div>
                <div v-if="row.running && row.stats?.lastError" style="font-size: 11px; color: #c1432c; margin-bottom: 8px;">
                    ⚠ {{ row.stats.lastError }}
                </div>

                <!-- Live T / RH sliders. These set the generator's mean — samples
                     still wobble around them by the annual/diurnal amplitudes
                     (collapsed under "Synthetic-data parameters"). Drag the
                     amplitudes to 0 there if you want a flat reading. -->
                <div v-if="locals[row.sensor.gid].channels.temperature"
                     style="display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; margin-bottom: 8px;">
                    <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600; min-width: 86px;">🌡️ {{ t('emulator.targetT') || 'Temperature' }}</label>
                    <input type="range" min="-10" max="50" step="0.5"
                           :value="locals[row.sensor.gid].params.tMean"
                           @input="setTargetT(row.sensor.gid, $event.target.value)"
                           style="width: 100%;" />
                    <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: var(--primary); min-width: 60px; text-align: right;">{{ formatNum(locals[row.sensor.gid].params.tMean, 1) }}°C</span>
                </div>
                <div v-if="locals[row.sensor.gid].channels.humidity"
                     style="display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; margin-bottom: 8px;">
                    <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600; min-width: 86px;">💧 {{ t('emulator.targetRH') || 'Humidity' }}</label>
                    <input type="range" min="0" max="100" step="1"
                           :value="locals[row.sensor.gid].params.rhMean"
                           @input="setTargetRH(row.sensor.gid, $event.target.value)"
                           style="width: 100%;" />
                    <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: var(--primary); min-width: 60px; text-align: right;">{{ formatNum(locals[row.sensor.gid].params.rhMean, 0) }}%</span>
                </div>

                <!-- Controls -->
                <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 10px; align-items: center; margin-bottom: 8px;">
                    <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600; min-width: 86px;">{{ t('emulator.cadence') || 'Cadence' }}</label>
                    <input type="range" min="1" max="60"
                           :value="locals[row.sensor.gid].cadenceSec"
                           @input="setCadence(row.sensor.gid, $event.target.value)"
                           style="width: 100%;" />
                    <span style="font-family: monospace; font-size: 12px; color: var(--text-secondary); min-width: 40px; text-align: right;">{{ locals[row.sensor.gid].cadenceSec }}s</span>
                    <div style="display: flex; gap: 8px;">
                        <label v-for="ch in ['temperature','humidity','light']" :key="ch"
                               style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); cursor: pointer; user-select: none;">
                            <input type="checkbox" :checked="locals[row.sensor.gid].channels[ch]"
                                   @change="toggleChannel(row.sensor.gid, ch, $event.target.checked)" />
                            <span style="text-transform: capitalize;">{{ ch }}</span>
                        </label>
                    </div>
                </div>

                <!-- Params (collapsible) -->
                <details :open="locals[row.sensor.gid].expanded" @toggle="locals[row.sensor.gid].expanded = $event.target.open" style="margin: 8px 0 0;">
                    <summary style="cursor: pointer; font-size: 12px; color: var(--primary); font-weight: 600; padding: 4px 0;">
                        {{ t('emulator.paramsToggle') || 'Synthetic-data parameters' }}
                    </summary>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px; padding: 10px 4px 4px; font-size: 12px;">
                        <div v-for="(label, key) in {
                                tMean: 'T mean (°C)',
                                tAmplitudeAnnual: 'T annual amplitude (°C)',
                                tAmplitudeDiurnal: 'T diurnal amplitude (°C)',
                                rhMean: 'RH mean (%)',
                                rhAmplitudeAnnual: 'RH annual amplitude (%)',
                                rhAmplitudeDiurnal: 'RH diurnal amplitude (%)',
                                summerSpikeProbability: 'Summer spike probability',
                                summerSpikeMax: 'Summer spike max (%)'
                             }" :key="key"
                             style="display: flex; align-items: center; gap: 8px;">
                            <label style="flex: 1; color: var(--text-secondary);">{{ label }}</label>
                            <input type="number" step="0.01"
                                   :value="locals[row.sensor.gid].params[key]"
                                   @input="setParam(row.sensor.gid, key, $event.target.value)"
                                   style="width: 80px; padding: 3px 6px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); font-family: monospace; font-size: 11px;" />
                        </div>
                    </div>
                </details>

                <!-- Catchup row -->
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                    <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">{{ t('emulator.catchupLabel') || 'Backfill' }}</label>
                    <input type="number" min="1" max="365"
                           v-model.number="locals[row.sensor.gid].catchupDays"
                           style="width: 60px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); font-family: monospace; font-size: 12px;" />
                    <span style="font-size: 12px; color: var(--text-secondary);">{{ t('emulator.catchupUnit') || 'days @ 10-min cadence' }}</span>
                    <span style="flex: 1;"></span>
                    <button class="btn btn-sm" :disabled="busyByGid[row.sensor.gid]"
                            @click="runCatchup(row.sensor.gid)">
                        {{ busyByGid[row.sensor.gid] ? (t('emulator.catchupRunning') || 'Generating…') : (t('emulator.catchupRun') || '↺ Run catchup') }}
                    </button>
                </div>
            </div>
        </div>
    `
};
