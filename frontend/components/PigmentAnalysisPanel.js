/**
 * Pigment Analysis Panel
 * ML-powered pigment identification and colour restoration controls.
 */
import { PigmentIdentifier } from '../ml/PigmentIdentifier.js';
import { PigmentRestorer } from '../ml/PigmentRestorer.js';
import { PIGMENT_DATABASE, PIGMENT_NAMES } from '../ml/PigmentDatabase.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'PigmentAnalysisPanel',
    props: {
        /** Original (current) RGBA pixel data from ModelViewer */
        pixelData: { type: Object, default: null }, // { data: Uint8ClampedArray, width, height }
    },
    emits: ['pigment-analyzed', 'texture-restored', 'display-mode-changed', 'busy-changed'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            identifier: null,
            restorer: null,
            analyzing: false,
            restoring: false,
            pigmentMap: null,
            regionSummary: null,
            restoredPixels: null,
            restorationStrength: 0.65,
            displayMode: 'current', // 'current' | 'restored' | 'pigment-map'
            error: null,
        };
    },
    created() {
        this.identifier = new PigmentIdentifier();
        this.restorer = new PigmentRestorer();
    },
    beforeUnmount() {
        if (this.identifier) this.identifier.dispose();
        if (this.restorer) this.restorer.dispose();
    },
    methods: {
        async analyzePigments() {
            if (!this.pixelData) {
                this.error = 'No texture pixel data available. Load a model with a texture first.';
                return;
            }
            this.analyzing = true;
            this.error = null;
            this.$emit('busy-changed', true);
            try {
                const result = await this.identifier.identify(
                    this.pixelData.data,
                    this.pixelData.width,
                    this.pixelData.height
                );
                this.pigmentMap = result.pigmentMap;
                this.regionSummary = result.regionSummary;
                this.$emit('pigment-analyzed', {
                    pigmentMap: result.pigmentMap,
                    regionSummary: result.regionSummary,
                    width: this.pixelData.width,
                    height: this.pixelData.height
                });
            } catch (err) {
                console.error('Pigment analysis failed:', err);
                this.error = 'Analysis failed: ' + err.message;
            } finally {
                this.analyzing = false;
                this.$emit('busy-changed', false);
            }
        },

        async restoreColors() {
            if (!this.pixelData) {
                this.error = 'No texture data available.';
                return;
            }
            this.restoring = true;
            this.error = null;
            this.$emit('busy-changed', true);
            try {
                const result = await this.restorer.restore(
                    this.pixelData.data,
                    this.pixelData.width,
                    this.pixelData.height,
                    this.pigmentMap,
                    this.restorationStrength
                );
                this.restoredPixels = result.restoredPixels;
                this.$emit('texture-restored', {
                    restoredPixels: result.restoredPixels,
                    width: result.width,
                    height: result.height
                });
                this.setDisplayMode('restored');
            } catch (err) {
                console.error('Colour restoration failed:', err);
                this.error = 'Restoration failed: ' + err.message;
            } finally {
                this.restoring = false;
                this.$emit('busy-changed', false);
            }
        },

        setDisplayMode(mode) {
            this.displayMode = mode;
            this.$emit('display-mode-changed', mode);
        },

        rgbStyle(rgb) {
            return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        }
    },
    computed: {
        busy() { return this.analyzing || this.restoring; }
    },
    template: `
        <div class="pigment-panel" style="padding: 16px 20px; background: white; border-radius: 12px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative;">
            <!-- Loading overlay -->
            <div v-if="busy" style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); border-radius: 12px; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                <div class="pigment-spinner"></div>
                <span style="font-size: 13px; font-weight: 500; color: #555;">{{ analyzing ? 'Identifying pigments...' : 'Restoring colours...' }}</span>
            </div>

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 18px;">🎨</span>
                <span style="font-weight: 600; font-size: 14px;">Pigment Analysis</span>
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                {{ error }}
                <button @click="error = null" style="float: right; background: none; border: none; cursor: pointer; color: #dc2626;">✕</button>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
                <button @click="analyzePigments" :disabled="busy || !pixelData"
                        class="btn btn-sm" style="background: #4f6ef7; color: white; border-color: #4f6ef7; font-size: 12px;">
                    Identify Pigments
                </button>
                <button @click="restoreColors" :disabled="busy || !pixelData"
                        class="btn btn-sm" style="background: #10b981; color: white; border-color: #10b981; font-size: 12px;">
                    Restore Colours
                </button>
            </div>

            <!-- Display mode toggle -->
            <div v-if="pigmentMap || restoredPixels" style="display: flex; gap: 4px; margin-bottom: 14px; background: #f5f3f0; border-radius: 8px; padding: 3px;">
                <button @click="setDisplayMode('current')" :disabled="busy" class="btn btn-xs"
                        :style="displayMode === 'current' ? 'background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent;'">
                    Current
                </button>
                <button v-if="pigmentMap" @click="setDisplayMode('pigment-map')" :disabled="busy" class="btn btn-xs"
                        :style="displayMode === 'pigment-map' ? 'background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent;'">
                    Pigment Map
                </button>
                <button v-if="restoredPixels" @click="setDisplayMode('restored')" :disabled="busy" class="btn btn-xs"
                        :style="displayMode === 'restored' ? 'background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent;'">
                    Restored
                </button>
            </div>

            <!-- Restoration strength slider -->
            <div v-if="pigmentMap" style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
                    <span>Restoration Strength</span>
                    <span style="font-weight: 600;">{{ Math.round(restorationStrength * 100) }}%</span>
                </div>
                <input type="range" v-model.number="restorationStrength" min="0" max="1" step="0.05"
                       :disabled="busy" style="width: 100%; accent-color: #10b981;" />
            </div>

            <!-- Region summary -->
            <div v-if="regionSummary" style="margin-top: 8px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                    Detected Pigments
                </div>
                <div v-for="region in regionSummary" :key="region.pigmentName"
                     style="display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f0ece7; font-size: 12px;">
                    <div :style="{ width: '14px', height: '14px', borderRadius: '3px', background: rgbStyle(region.color), flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }"></div>
                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ region.displayName }}</span>
                    <span style="color: var(--text-secondary); font-weight: 600; min-width: 40px; text-align: right;">{{ region.percentage }}%</span>
                    <div :style="{ width: region.percentage + '%', maxWidth: '60px', height: '4px', borderRadius: '2px', background: rgbStyle(region.color) }"></div>
                </div>
            </div>

            <!-- Mode indicator -->
            <div v-if="!pigmentMap && !analyzing" style="text-align: center; padding: 16px; color: var(--text-secondary); font-size: 12px; font-style: italic;">
                Click "Identify Pigments" to analyse the texture
            </div>
        </div>
    `
};
