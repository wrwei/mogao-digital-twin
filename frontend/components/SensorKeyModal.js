/**
 * SensorKeyModal — per-sensor API key view + rotate, with copyable
 * ingestion-endpoint snippets.
 *
 * Why rotate rather than reveal: the plaintext key is bcrypt-hashed on
 * the way in and is not stored, so it cannot be re-displayed after
 * registration. Rotating issues a fresh key and invalidates the old one —
 * surfaced here as the "show a copyable key again" affordance.
 *
 * Self-contained state (rotatedKey, copyFlashes) so the parent only needs
 * to bind `:sensor` and listen for `@close`. Mirrors the pattern already
 * used inside LiveDataPanel's per-sensor expander.
 */
import { useI18n } from '../i18n.js';
import ModalDialog from './ModalDialog.js';

export default {
    name: 'SensorKeyModal',
    components: { ModalDialog },
    inject: ['$confirm'],
    props: {
        sensor: { type: Object, default: null }     // null = closed
    },
    emits: ['close', 'rotated'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            rotatedKey: null,       // plaintext key from a fresh rotation, or null
            rotating: false,
            error: null,
            copyFlashes: {}         // { [flashKey]: true } for 1.5s after copy
        };
    },
    computed: {
        apiBaseUrl() {
            return (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:8008';
        },
        prefix() { return this.sensor && this.sensor.apiKeyPrefix; },
        keyForDisplay() {
            // After a rotation, show the real key; otherwise show the prefix
            // template so admins can see what the key shape looks like.
            if (this.rotatedKey) return this.rotatedKey;
            if (this.prefix)     return `${this.prefix}.<secret-only-shown-after-rotation>`;
            return '<key>';
        },
        endpointSamples()      { return `${this.apiBaseUrl}/telemetry/samples`; },
        endpointSamplesBatch() { return `${this.apiBaseUrl}/telemetry/samples/batch`; },
        endpointSamplesCSV()   { return `${this.apiBaseUrl}/telemetry/samples/upload`; },
        endpointSnapshot()     { return `${this.apiBaseUrl}/snapshots/ingest`; },
        isCamera() {
            return !!this.sensor
                && Array.isArray(this.sensor.channels)
                && this.sensor.channels.includes('image');
        },
        curlExample() {
            if (this.isCamera) {
                return `curl -X POST "${this.endpointSnapshot}" \\\n  -H "X-Sensor-Key: ${this.keyForDisplay}" \\\n  -F "frame=@./demo.jpg" \\\n  -F "capturedAt=2026-05-21T10:00:00Z"`;
            }
            return `curl -X POST "${this.endpointSamplesBatch}" \\\n  -H "X-Sensor-Key: ${this.keyForDisplay}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"samples":[{"timestamp":"2026-05-21T10:00:00Z","temperature":13.2,"humidity":37.4}]}'`;
        }
    },
    watch: {
        sensor(newVal) {
            // Reset the rotation result whenever the modal is reopened or
            // switched to a different sensor, so a stale key from one sensor
            // never bleeds into the view of another.
            this.rotatedKey = null;
            this.error = null;
            this.copyFlashes = {};
        }
    },
    methods: {
        async copy(text, flashKey) {
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
        async rotate() {
            if (!this.sensor) return;
            const _ok = await this.$confirm({
                message: this.t('sensorKey.rotateConfirm')
                    || 'This invalidates the current API key. Any device using the old key will stop being able to push data until reconfigured. Continue?',
                danger: true
            });
            if (!_ok) return;
            this.rotating = true;
            this.error = null;
            try {
                const res = await window.api.sensors.rotateKey(this.sensor.gid);
                this.rotatedKey = res.data.apiKey;
                this.$emit('rotated', { gid: this.sensor.gid, prefix: res.data.sensor?.apiKeyPrefix });
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.rotating = false;
            }
        }
    },
    template: `
        <modal-dialog :show="!!sensor"
                      :title="sensor ? ('🔑 ' + (sensor.name || sensor.gid)) : ''"
                      wide
                      @close="$emit('close')">
            <div v-if="sensor">
                <!-- Key block -->
                <div :style="(rotatedKey ? 'background: #ecfdf5; border-color: #a7f3d0;' : 'background: #f5f3f0;') + ' border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 12px; margin-bottom: 14px;'">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary);">
                            {{ rotatedKey ? (t('sensorKey.newKey') || 'New API key — store this now') : (t('sensorKey.keyPrefix') || 'API key prefix') }}
                        </span>
                        <button class="btn btn-xs" @click="copy(keyForDisplay, 'key')" :disabled="!rotatedKey && !prefix">
                            {{ copyFlashes.key ? '✓' : (t('sensorKey.copy') || 'Copy') }}
                        </button>
                    </div>
                    <code style="display: block; background: white; padding: 8px 10px; border-radius: 4px; word-break: break-all; user-select: all; font-size: 12px;">{{ keyForDisplay }}</code>
                    <p v-if="!rotatedKey" style="margin: 8px 0 0; font-size: 11px; color: var(--text-secondary); line-height: 1.45;">
                        {{ t('sensorKey.bcryptNote') || 'The secret portion of the key is stored as a bcrypt hash and cannot be recovered. To obtain a copyable key, rotate it below — the previous key will be invalidated.' }}
                    </p>
                    <p v-else style="margin: 8px 0 0; font-size: 11px; color: #065f46; line-height: 1.45;">
                        {{ t('sensorKey.newKeyHint') || 'This key will not be shown again. Copy and store it now; any device still using the previous key will need to be updated.' }}
                    </p>
                </div>

                <!-- Rotate action -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="btn btn-sm" @click="rotate" :disabled="rotating">
                        {{ rotating ? (t('sensorKey.rotating') || 'Rotating…') : (rotatedKey ? (t('sensorKey.rotateAgain') || 'Rotate again') : (t('sensorKey.rotate') || '🔄 Rotate API key')) }}
                    </button>
                    <span v-if="error" style="color: #b91c1c; font-size: 12px; align-self: center;">{{ error }}</span>
                </div>

                <!-- Endpoint reference -->
                <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">
                        {{ t('sensorKey.endpoints') || 'Ingestion endpoints' }}
                    </div>
                    <div v-if="!isCamera" style="display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: center; font-size: 12px; margin-bottom: 10px;">
                        <span style="color: var(--text-secondary);">Single</span>
                        <code style="font-size: 11px; word-break: break-all;">POST {{ endpointSamples }}</code>
                        <button class="btn btn-xs" @click="copy(endpointSamples, 'e1')">{{ copyFlashes.e1 ? '✓' : (t('sensorKey.copy') || 'Copy') }}</button>
                        <span style="color: var(--text-secondary);">Batch</span>
                        <code style="font-size: 11px; word-break: break-all;">POST {{ endpointSamplesBatch }}</code>
                        <button class="btn btn-xs" @click="copy(endpointSamplesBatch, 'e2')">{{ copyFlashes.e2 ? '✓' : (t('sensorKey.copy') || 'Copy') }}</button>
                        <span style="color: var(--text-secondary);">CSV</span>
                        <code style="font-size: 11px; word-break: break-all;">POST {{ endpointSamplesCSV }}</code>
                        <button class="btn btn-xs" @click="copy(endpointSamplesCSV, 'e3')">{{ copyFlashes.e3 ? '✓' : (t('sensorKey.copy') || 'Copy') }}</button>
                    </div>
                    <div v-else style="display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: center; font-size: 12px; margin-bottom: 10px;">
                        <span style="color: var(--text-secondary);">Snapshot</span>
                        <code style="font-size: 11px; word-break: break-all;">POST {{ endpointSnapshot }}</code>
                        <button class="btn btn-xs" @click="copy(endpointSnapshot, 'es')">{{ copyFlashes.es ? '✓' : (t('sensorKey.copy') || 'Copy') }}</button>
                    </div>
                    <div style="position: relative; background: #0f172a; color: #e2e8f0; border-radius: 6px; padding: 10px 12px; font-family: monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all;">
                        <button class="btn btn-xs" @click="copy(curlExample, 'curl')" style="position: absolute; top: 6px; right: 6px; padding: 1px 6px; background: #334155; color: white; border-color: #475569;">
                            {{ copyFlashes.curl ? '✓' : (t('sensorKey.copy') || 'Copy') }}
                        </button>{{ curlExample }}</div>
                </div>
            </div>
        </modal-dialog>
    `
};
