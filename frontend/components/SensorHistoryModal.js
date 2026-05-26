/**
 * SensorHistoryModal — per-sensor historical data viewer.
 *
 * Two variants driven by sensor.channels:
 *   - channel includes 'image'    → camera: reverse-chronological thumbnail grid
 *   - otherwise                   → climate: scrollable sample table
 *
 * Both share the same date-range selector. The camera variant also opens a
 * lightbox on click, mirroring SnapshotsPanel's behaviour.
 */
import { useI18n } from '../i18n.js';
import ModalDialog from './ModalDialog.js';

const RANGE_MS = { '24h': 864e5, '7d': 7*864e5, '30d': 30*864e5, '90d': 90*864e5 };

export default {
    name: 'SensorHistoryModal',
    components: { ModalDialog },
    props: {
        sensor: { type: Object, default: null }     // null = closed
    },
    emits: ['close', 'cleared'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            loading: false,
            error: null,
            range: '7d',                            // 24h | 7d | 30d | 90d | all
            samples: [],                            // climate variant
            summary: null,                          // climate variant
            snapshots: [],                          // camera variant
            lightbox: null,                         // camera variant
            clearing: false                         // 'clear all samples' in flight
        };
    },
    computed: {
        isCamera() {
            return !!this.sensor
                && Array.isArray(this.sensor.channels)
                && this.sensor.channels.includes('image');
        },
        fromIso() {
            if (this.range === 'all') return null;
            const ms = RANGE_MS[this.range] || RANGE_MS['7d'];
            return new Date(Date.now() - ms).toISOString();
        }
    },
    watch: {
        sensor(newVal) {
            // Modal opened or sensor changed — clear and re-fetch.
            this.samples = [];
            this.summary = null;
            this.snapshots = [];
            this.lightbox = null;
            this.error = null;
            if (newVal) this.fetch();
        }
    },
    methods: {
        async fetch() {
            if (!this.sensor) return;
            this.loading = true;
            this.error = null;
            try {
                if (this.isCamera) {
                    const opts = { limit: 200 };
                    if (this.fromIso) opts.from = this.fromIso;
                    const { data } = await window.api.sensors.snapshots(this.sensor.gid, opts);
                    this.snapshots = data.snapshots || [];
                } else {
                    const opts = { interval: this.range === '24h' ? 'raw' : 'hourly', limit: 5000 };
                    if (this.fromIso) opts.from = this.fromIso;
                    const { data } = await window.api.sensors.samples(this.sensor.gid, opts);
                    this.samples = data.samples || [];
                    this.summary = data.summary || null;
                }
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },
        setRange(r) { this.range = r; this.fetch(); },
        async clearAll() {
            if (!this.sensor) return;
            const total = this.sensor.status?.samplesTotal ?? this.summary?.count;
            const totalLabel = total != null ? total.toLocaleString() : 'all';
            const ok = window.confirm(
                `Permanently delete ${totalLabel} sample(s) from "${this.sensor.name || this.sensor.gid}"?\n\n` +
                `The sensor record and its API key will be kept; only the historical samples are removed. ` +
                `This cannot be undone.`
            );
            if (!ok) return;
            this.clearing = true;
            this.error = null;
            try {
                const { data } = await window.api.sensors.clearSamples(this.sensor.gid);
                this.samples = [];
                this.summary = null;
                this.$emit('cleared', { gid: this.sensor.gid, samplesDeleted: data.samplesDeleted });
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.clearing = false;
            }
        },
        imageUrl(gid) { return window.api.snapshots.imageUrl(gid); },
        openLightbox(snap) { this.lightbox = snap; },
        closeLightbox() { this.lightbox = null; },
        formatTime(iso) { try { return new Date(iso).toLocaleString(); } catch (_) { return iso; } },
        formatNum(v, digits = 1) {
            if (v === null || v === undefined || Number.isNaN(v)) return '—';
            return Number(v).toFixed(digits);
        }
    },
    template: `
        <modal-dialog :show="!!sensor"
                      :title="sensor ? ((isCamera ? '📷' : '📊') + ' ' + (sensor.name || sensor.gid)) : ''"
                      wide
                      @close="$emit('close')">
            <div v-if="sensor">
                <!-- Range selector -->
                <div class="tool-buttons-bar" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                    <button v-for="r in ['24h','7d','30d','90d','all']" :key="r"
                            class="tool-btn"
                            :class="{ active: range === r }"
                            @click="setRange(r)">
                        {{ t('sensorHistory.range' + r) || r }}
                    </button>
                    <span style="flex: 1;"></span>
                    <button class="btn btn-sm" @click="fetch" :disabled="loading">{{ t('sensorHistory.refresh') || '↻ Refresh' }}</button>
                </div>

                <div v-if="loading" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
                    {{ t('sensorHistory.loading') || 'Loading…' }}
                </div>

                <div v-else-if="error" style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #b91c1c; font-size: 12px;">
                    {{ error }}
                </div>

                <!-- ── Climate variant ─────────────────────────────────────── -->
                <template v-else-if="!isCamera">
                    <div v-if="summary" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; font-size: 12px;">
                        <div style="background: #f5f3f0; padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">{{ t('sensorHistory.count') || 'Samples' }}</div>
                            <div style="font-weight: 700;">{{ summary.count.toLocaleString() }}</div>
                        </div>
                        <div style="background: #f5f3f0; padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">T (°C)</div>
                            <div style="font-weight: 700;">{{ formatNum(summary.temperature.mean) }} · {{ formatNum(summary.temperature.min) }}–{{ formatNum(summary.temperature.max) }}</div>
                        </div>
                        <div style="background: #f5f3f0; padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">RH (%)</div>
                            <div style="font-weight: 700;">{{ formatNum(summary.humidity.mean) }} · {{ formatNum(summary.humidity.min) }}–{{ formatNum(summary.humidity.max) }}</div>
                        </div>
                        <div style="background: #f5f3f0; padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">{{ t('sensorHistory.daysCovered') || 'Days' }}</div>
                            <div style="font-weight: 700;">{{ summary.daysCovered }}</div>
                        </div>
                    </div>

                    <div v-if="samples.length === 0" style="padding: 24px; text-align: center; color: var(--text-secondary); font-style: italic; font-size: 13px;">
                        {{ t('sensorHistory.noSamples') || 'No samples in this range.' }}
                    </div>
                    <div v-else style="max-height: 60vh; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead style="position: sticky; top: 0; background: #f5f5f5; border-bottom: 2px solid #e5e5e5;">
                                <tr>
                                    <th style="text-align: left; padding: 6px 10px;">{{ t('sensorHistory.timestamp') || 'Timestamp' }}</th>
                                    <th style="text-align: right; padding: 6px 10px;">T (°C)</th>
                                    <th style="text-align: right; padding: 6px 10px;">RH (%)</th>
                                    <th style="text-align: right; padding: 6px 10px;">{{ t('sensorHistory.light') || 'Light (klux)' }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(s, idx) in samples" :key="idx" :style="idx % 2 ? '' : 'background: #fafafa;'">
                                    <td style="padding: 4px 10px;">{{ formatTime(s.timestamp) }}</td>
                                    <td style="padding: 4px 10px; text-align: right;">{{ formatNum(s.temperature) }}</td>
                                    <td style="padding: 4px 10px; text-align: right;">{{ formatNum(s.humidity) }}</td>
                                    <td style="padding: 4px 10px; text-align: right;">{{ formatNum(s.lightKlux, 2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Danger zone: wipe-all -->
                    <div style="margin-top: 18px; padding: 12px; border: 1px solid var(--severity-high-bg, #fca5a5); background: var(--severity-high-soft, #fef2f2); border-radius: 6px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div style="font-size: 12px; color: var(--severity-high-soft-fg, #7f1d1d);">
                                <strong>Danger zone.</strong>
                                Permanently delete every sample for this sensor (the sensor record + API key are kept).
                                Useful when swapping in a new CSV profile.
                            </div>
                            <button class="btn btn-sm" :disabled="clearing"
                                    @click="clearAll"
                                    style="background: #b91c1c; color: white; flex-shrink: 0;">
                                {{ clearing ? 'Clearing…' : 'Clear all samples' }}
                            </button>
                        </div>
                    </div>
                </template>

                <!-- ── Camera variant ──────────────────────────────────────── -->
                <template v-else>
                    <div v-if="snapshots.length === 0" style="padding: 24px; text-align: center; color: var(--text-secondary); font-style: italic; font-size: 13px;">
                        {{ t('sensorHistory.noSnapshots') || 'No snapshots in this range.' }}
                    </div>
                    <div v-else style="max-height: 60vh; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
                        <div v-for="snap in snapshots" :key="snap.gid"
                             style="cursor: pointer; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; background: #f5f3f0;"
                             @click="openLightbox(snap)">
                            <img :src="imageUrl(snap.gid)" :alt="snap.gid" loading="lazy"
                                 style="width: 100%; height: 100px; object-fit: cover; display: block;" />
                            <div style="padding: 4px 6px; font-size: 10px; color: var(--text-secondary); background: white;">
                                {{ formatTime(snap.capturedAt) }}
                            </div>
                        </div>
                    </div>
                    <div v-if="lightbox" @click="closeLightbox"
                         style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 40px;">
                        <div style="max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">
                            <img :src="imageUrl(lightbox.gid)" :alt="lightbox.gid"
                                 style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 6px;" />
                            <div style="margin-top: 12px; color: white; font-size: 13px;">{{ formatTime(lightbox.capturedAt) }}</div>
                        </div>
                    </div>
                </template>
            </div>
        </modal-dialog>
    `
};
