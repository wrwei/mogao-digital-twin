/**
 * Pigment Analysis Panel
 * HSV-threshold pigment-class segmentation. The output map drives the
 * per-pigment Arrhenius extension of the chemical fading model.
 */
import { PigmentIdentifier } from '../ml/PigmentIdentifier.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'PigmentAnalysisPanel',
    props: {
        /** Original (current) RGBA pixel data from ModelViewer */
        pixelData: { type: Object, default: null }, // { data: Uint8ClampedArray, width, height }
    },
    emits: ['pigment-analyzed', 'display-mode-changed', 'busy-changed'],
    setup() {
        const { t, locale } = useI18n();
        return { t, locale };
    },
    data() {
        return {
            identifier: null,
            analyzing: false,
            pigmentMap: null,
            regionSummary: null,
            displayMode: 'current', // 'current' | 'pigment-map'
            error: null,
            // Monotonic counter; bumped whenever pixelData changes so in-flight
            // analyses can check whether they're still valid before mutating
            // component state (prevents stale results from a previous exhibit
            // clobbering the new one).
            _taskGeneration: 0,
        };
    },
    created() {
        this.identifier = new PigmentIdentifier();
    },
    beforeUnmount() {
        if (this.identifier) this.identifier.dispose();
    },
    methods: {
        async analyzePigments() {
            if (!this.pixelData) {
                this.error = this.t('pigmentAnalysis.errorNoPixelData');
                return;
            }
            const gen = this._taskGeneration;
            const pxWidth = this.pixelData.width;
            const pxHeight = this.pixelData.height;
            this.analyzing = true;
            this.error = null;
            this.$emit('busy-changed', true);
            try {
                const result = await this.identifier.identify(
                    this.pixelData.data, pxWidth, pxHeight
                );
                if (gen !== this._taskGeneration) return;
                this.pigmentMap = result.pigmentMap;
                this.regionSummary = result.regionSummary;
                this.$emit('pigment-analyzed', {
                    pigmentMap: result.pigmentMap,
                    regionSummary: result.regionSummary,
                    width: pxWidth,
                    height: pxHeight
                });
            } catch (err) {
                if (gen !== this._taskGeneration) return;
                console.error('Pigment analysis failed:', err);
                this.error = this.t('pigmentAnalysis.analysisFailed') + err.message;
            } finally {
                if (gen === this._taskGeneration) {
                    this.analyzing = false;
                    this.$emit('busy-changed', false);
                }
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
        busy() { return this.analyzing; }
    },
    watch: {
        /** Reset internal state when the underlying texture changes. */
        pixelData(newVal, oldVal) {
            if (newVal === oldVal) return;
            this._taskGeneration++;
            this.pigmentMap = null;
            this.regionSummary = null;
            this.displayMode = 'current';
            this.error = null;
            if (this.analyzing) {
                this.analyzing = false;
                this.$emit('busy-changed', false);
            }
        }
    },
    template: `
        <div class="pigment-panel" style="padding: 16px 20px; background: white; border-radius: 12px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative;">
            <!-- Loading overlay -->
            <div v-if="busy" style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); border-radius: 12px; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                <div class="pigment-spinner"></div>
                <span style="font-size: 13px; font-weight: 500; color: #555;">{{ t('pigmentAnalysis.identifying') }}</span>
            </div>

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 18px;">🎨</span>
                <span style="font-weight: 600; font-size: 14px;">{{ t('pigmentAnalysis.title') }}</span>
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                {{ error }}
                <button @click="error = null" style="float: right; background: none; border: none; cursor: pointer; color: #dc2626;">✕</button>
            </div>

            <!-- Action -->
            <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
                <button @click="analyzePigments" :disabled="busy || !pixelData"
                        class="btn btn-sm" style="background: #4f6ef7; color: white; border-color: #4f6ef7; font-size: 12px;">
                    {{ t('pigmentAnalysis.identifyBtn') }}
                </button>
            </div>

            <!-- Display mode toggle -->
            <div v-if="pigmentMap" style="display: flex; gap: 4px; margin-bottom: 14px; background: #f5f3f0; border-radius: 8px; padding: 3px;">
                <button @click="setDisplayMode('current')" :disabled="busy" class="btn btn-xs"
                        :style="displayMode === 'current' ? 'background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent;'">
                    {{ t('pigmentAnalysis.displayCurrent') }}
                </button>
                <button @click="setDisplayMode('pigment-map')" :disabled="busy" class="btn btn-xs"
                        :style="displayMode === 'pigment-map' ? 'background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent;'">
                    {{ t('pigmentAnalysis.displayPigmentMap') }}
                </button>
            </div>

            <!-- Region summary -->
            <div v-if="regionSummary" style="margin-top: 8px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                    {{ t('pigmentAnalysis.detectedPigments') }}
                </div>
                <div v-for="region in regionSummary" :key="region.pigmentName"
                     style="display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f0ece7; font-size: 12px;">
                    <div :style="{ width: '14px', height: '14px', borderRadius: '3px', background: rgbStyle(region.color), flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }"></div>
                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ locale === 'zh' ? (region.displayZh || region.displayName) : (region.displayEn || region.displayName) }}</span>
                    <span style="color: var(--text-secondary); font-weight: 600; min-width: 40px; text-align: right;">{{ region.percentage }}%</span>
                    <div :style="{ width: region.percentage + '%', maxWidth: '60px', height: '4px', borderRadius: '2px', background: rgbStyle(region.color) }"></div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="!pigmentMap && !analyzing" style="text-align: center; padding: 16px; color: var(--text-secondary); font-size: 12px; font-style: italic;">
                {{ t('pigmentAnalysis.emptyHint') }}
            </div>
        </div>
    `
};
