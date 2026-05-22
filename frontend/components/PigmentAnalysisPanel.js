/**
 * Pigment Analysis Panel
 * HSV-threshold pigment-class segmentation. The output map drives the
 * per-pigment Arrhenius extension of the chemical fading model.
 *
 * Results are memoised server-side per artefact (see /pigment-analyses):
 * when the panel mounts (or the entity changes), it tries to hydrate from
 * the cache so a returning user sees the analysis card and the simulation
 * card immediately. Re-running the classifier overwrites the cache.
 */
import { identifyPigments } from '../pigment/PigmentAnalysis.js';
import * as Sim from '../services/SimulationEngine.js';
import { useI18n } from '../i18n.js';
import { PIGMENT_DATABASE, PIGMENT_NAMES } from '../pigment/PigmentDatabase.js';

// Texture URL doesn't change frequently for a given artefact; extracting the
// UUID filename is sufficient to detect "is this the same texture as when
// the cache was written?" without hashing the bytes.
function textureFingerprint(reference) {
    if (!reference) return null;
    const url = reference.textureLocation || '';
    const slash = url.lastIndexOf('/');
    return slash === -1 ? url : url.slice(slash + 1);
}

// Re-derive the regionSummary the panel renders from a server-side summary
// (which only carries id / name / count / percent — colours are looked up
// locally from PIGMENT_DATABASE so the panel doesn't rely on the backend
// for visual styling).
function hydrateRegionSummary(serverSummary) {
    if (!Array.isArray(serverSummary)) return null;
    return serverSummary.map(r => {
        const dbEntry = (r.pigmentName && PIGMENT_DATABASE[r.pigmentName]) || null;
        return {
            ...r,
            color: r.color || (dbEntry ? dbEntry.targetRGB : [128, 128, 128])
        };
    });
}

export default {
    name: 'PigmentAnalysisPanel',
    props: {
        /** Original (current) RGBA pixel data from ModelViewer */
        pixelData: { type: Object, default: null }, // { data: Uint8ClampedArray, width, height }
        /** The artefact this analysis belongs to (gid + reference.textureLocation). */
        entity:    { type: Object, default: null }
    },
    emits: ['busy-changed'],
    setup() {
        const { t, locale } = useI18n();
        return { t, locale };
    },
    data() {
        return {
            analyzing: false,
            hydrating: false,             // briefly true while loading the cached map
            displayMode: 'current', // 'current' | 'pigment-map'
            error: null,
            cachedAt: null,               // ISO date string of last persisted analysis
            // Monotonic counter; bumped whenever pixelData changes so in-flight
            // analyses can check whether they're still valid before mutating
            // component state (prevents stale results from a previous exhibit
            // clobbering the new one).
            _taskGeneration: 0,
        };
    },
    mounted() {
        this._tryHydrate();
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
                const result = await identifyPigments(
                    this.pixelData.data, pxWidth, pxHeight
                );
                if (gen !== this._taskGeneration) return;
                // Sim is the single source of truth for the analysis output —
                // the panel's pigmentMap / regionSummary computeds read it back.
                Sim.setPigmentAnalysisResult({
                    pigmentMap: result.pigmentMap,
                    regionSummary: result.regionSummary
                });
                // Persist to the backend so the next visit hydrates without
                // re-running the classifier. Failure is non-blocking — the
                // user still has a working analysis for this session.
                this._persist(result, pxWidth, pxHeight).catch(err => {
                    console.warn('Failed to persist pigment analysis:', err);
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

        async _persist(result, width, height) {
            if (!this.entity || !this.entity.gid) return;
            const fingerprint = textureFingerprint(this.entity.reference);
            const res = await window.api.pigmentAnalyses.save(
                this.entity.gid,
                {
                    regionSummary: result.regionSummary,
                    pigmentNames: PIGMENT_NAMES,
                    mapWidth: width,
                    mapHeight: height,
                    textureHash: fingerprint
                },
                result.pigmentMap
            );
            this.cachedAt = res?.data?.updatedAt || new Date().toISOString();
        },

        async _tryHydrate() {
            if (!this.entity || !this.entity.gid) return;
            // If Sim already holds the analysis (e.g. user just unmounted and
            // remounted this panel via a tab switch within the same exhibit),
            // skip the backend round-trip entirely — the computeds will
            // already reflect the in-memory state.
            if (Sim.pigmentMap.value) return;
            const gen = this._taskGeneration;
            this.hydrating = true;
            this.error = null;
            try {
                const meta = (await window.api.pigmentAnalyses.get(this.entity.gid)).data;
                // Texture-change invalidation: if the texture URL today doesn't
                // match what was hashed at analysis time, ignore the cache and
                // let the user re-run.
                const fingerprint = textureFingerprint(this.entity && this.entity.reference);
                if (meta.textureHash && fingerprint && meta.textureHash !== fingerprint) {
                    return;
                }
                const { bytes } = await window.api.pigmentAnalyses.fetchMap(this.entity.gid);
                if (gen !== this._taskGeneration) return;
                this.cachedAt = meta.updatedAt || meta.createdAt || null;
                Sim.setPigmentAnalysisResult({
                    pigmentMap: bytes,
                    regionSummary: meta.regionSummary
                });
            } catch (err) {
                if (err.status === 404 || err.response?.status === 404) return; // none on file — expected
                console.warn('Failed to hydrate pigment analysis:', err);
            } finally {
                if (gen === this._taskGeneration) this.hydrating = false;
            }
        },

        setDisplayMode(mode) {
            this.displayMode = mode;
            Sim.setPigmentDisplayMode(mode);
        },

        rgbStyle(rgb) {
            return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        }
    },
    computed: {
        busy() { return this.analyzing || this.hydrating; },
        /** Bridge SimulationEngine's refs into Options-API reactivity so the
         *  panel's template survives tab-switch remounts: when this panel
         *  unmounts (e.g. user switches to Environment Monitoring) and
         *  re-mounts on return, the in-memory analysis in Sim is preserved
         *  and the card auto-fills from these computeds without a backend
         *  round-trip. */
        pigmentMap()    { return Sim.pigmentMap.value; },
        regionSummary() {
            const raw = Sim.pigmentRegionSummary.value;
            return raw ? hydrateRegionSummary(raw) : null;
        }
    },
    watch: {
        /** Reset internal state when the underlying texture changes. */
        pixelData(newVal, oldVal) {
            if (newVal === oldVal) return;
            this._taskGeneration++;
            this.displayMode = 'current';
            this.error = null;
            // Sim.setPigmentMap(null) clears pigmentMap + pigmentRegionSummary
            // + perPigmentParams in one go; the panel's computeds reflect that.
            Sim.setPigmentMap(null);
            Sim.setPigmentDisplayMode('current');
            if (this.analyzing) {
                this.analyzing = false;
                this.$emit('busy-changed', false);
            }
        },
        /** Re-hydrate when the artefact changes (drill-in to a different exhibit). */
        entity(newVal, oldVal) {
            if (!newVal || (oldVal && newVal.gid === oldVal.gid)) return;
            this._taskGeneration++;
            this.displayMode = 'current';
            this.error = null;
            this.cachedAt = null;
            this._tryHydrate();
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
                <button @click="error = null" :aria-label="t('common.close')" style="float: right; background: none; border: none; cursor: pointer; color: var(--severity-high-bg);">✕</button>
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
