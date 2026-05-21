/**
 * SimulationEngine — module-level singleton owning deterioration simulation state.
 *
 * Owns:
 *   - Environment & exposure (T, RH, light, RH-amplitude, days/months/years)
 *   - Per-model parameter blocks (chemical / lifetime / mould / saltCryst / fatigue)
 *   - Enabled-model flags, the active model tab, the preset registry
 *   - The cached assessment from POST /deterioration/assess (debounced)
 *   - The mould-index accumulator (integrates during playback, resets on
 *     manual env changes)
 *   - Pigment segmentation: pigmentMap, perPigmentParams, displayMode
 *   - Playback (isPlaying, simulationSpeed, the tick loop)
 *   - Time-series history (for chart rendering by the UI)
 *
 * Behaviour:
 *   - Watches its own reactive state; schedules /deterioration/assess
 *     (debounced 150 ms) on any change to env, exposure, model params,
 *     enabledModels, or activeTab.
 *   - Manual env / exposure changes reset the mouldIndex accumulator
 *     (during playback the accumulator is load-bearing — only the
 *     paused/scrubbing case resets).
 *   - Exposes a `renderCommand` computed that ModelViewer can consume
 *     to drive its `_apply*Effect` methods.
 *
 * State is Vue-reactive so components bind directly (v-model, watchers,
 * template interpolation). Methods are exported as named functions.
 */

import { computePerPigmentParams } from '../pigment/PigmentAnalysis.js';

const { reactive, ref, computed, watch } = Vue;

// ── Preset catalog ──────────────────────────────────────────────────────────
export const PRESET_CATALOG = {
    oneYear:     { temp: 25, rh: 60,  years: 1,   light: 10,   rhAmplitude: 10, label: '1 Year',                      models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    tenYears:    { temp: 25, rh: 60,  years: 10,  light: 10,   rhAmplitude: 10, label: '10 Years',                    models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    museum:      { temp: 20, rh: 50,  years: 100, light: 0.15, rhAmplitude: 5,  label: 'Museum 100y',                 models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    poorStorage: { temp: 30, rh: 80,  years: 50,  light: 5,    rhAmplitude: 20, label: 'Poor Storage 50y',            models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    extreme:     { temp: 40, rh: 100, years: 10,  light: 30,   rhAmplitude: 30, label: 'Extreme 10y',                 models: ['chemical', 'lifetime', 'mould', 'fatigue'] },
    longTerm200: { temp: 20, rh: 50,  years: 200, light: 0.15, rhAmplitude: 5,  label: '200y Museum',                 models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    mogao200:    { temp: 13, rh: 35,  years: 200, light: 2,    rhAmplitude: 15, label: '200y Mogao (cold/dry)',       models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    tropical200: { temp: 28, rh: 75,  years: 200, light: 5,    rhAmplitude: 20, label: '200y Tropical (humid/warm)',  models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    demoChemical: { temp: 25, rh: 50, years: 50,  light: 20,   rhAmplitude: 10, label: '⚗️ Light Exposure Test 50y',   models: ['chemical'] },
    demoLifetime: { temp: 5,  rh: 35, years: 200, light: 0,    rhAmplitude: 5,  label: '⏳ Cold Dry Archive 200y',      models: ['lifetime'] },
    demoMould:    { temp: 25, rh: 90, years: 10,  light: 1,    rhAmplitude: 5,  label: '🦠 Humid Mould Bloom 10y',      models: ['mould'] },
    demoSalt:     { temp: 20, rh: 45, years: 100, light: 0.15, rhAmplitude: 5,  label: '🧂 Salt Cycling Zone 100y',     models: ['salt'] },
    demoFatigue:  { temp: 20, rh: 50, years: 50,  light: 0.15, rhAmplitude: 30, label: '🧱 Large RH Swings 50y',         models: ['fatigue'] }
};

const TAB_TO_MODEL = { chemical: 'chemical', lifetime: 'lifetime', mould: 'mould', salt: 'salt', fatigue: 'fatigue' };

function defaultResults() {
    return {
        chemical: { rateConstant: 0, degradationFactor: 1, scientificDegradation: 0, risk: 0, label: 'low', visualEffect: { fadeFactor: 1, type: 'chemical' } },
        lifetime: { multiplier: 1, label: 'longer', color: '#10b981' },
        mould: { mouldIndex: 0, rhCritical: 80, isAboveThreshold: false, risk: 0, label: 'low', growthRate: 0, visualEffect: { coverage: 0, intensity: 0, type: 'mould' } },
        saltCryst: { pressure_MPa: 0, DRH: 84.2, isCrystallizing: false, damageRatio: 0, cumulativeDamage: 0, risk: 0, label: 'safe', visualEffect: { spalling: 0, type: 'salt' } },
        fatigue: { stress_MPa: 0, cyclesToFailure: null, cyclesApplied: 0, cumulativeDamage: 0, crackDensity: 0, risk: 0, label: 'low', visualEffect: { crackDensity: 0, type: 'fatigue' } }
    };
}

// ── Reactive state ──────────────────────────────────────────────────────────
export const env = reactive({
    temperature: 20,
    humidity: 50,
    simLight: 0,
    simRHAmplitude: 10
});

export const exposure = reactive({
    days: 0,
    months: 0,
    years: 0
});

export const modelParams = reactive({
    chemical:  { Ea_dark: 70000, Ea_light: 25000, k0_dark: 0.0001, k0_light: 0.001, q: 0.8, p: 0.9 },
    lifetime:  { Ea: 70000, n: 1.3, T0: 20, RH0: 50 },
    mould:     { growthCoeff: 0.13, declineRate: -0.128 },
    saltCryst: { Vm: 5.33e-5, DRH_ref: 84.2, DRH_slope: -0.17, T_ref: 25, tensileStrength: 3.0, cyclesPerYear: 120 },
    fatigue:   { beta_diff: 5e-5, E: 2000, sigma_fail: 10.0, basquin_b: 6, cyclesPerYear: 365 }
});

export const enabledModels = reactive({
    chemical: true, lifetime: true, mould: true, saltCryst: true, fatigue: true
});

export const activeTab = ref('chemical');
export const selectedPreset = ref('');
export const presetLoading = ref(false);
const _presetGeneration = ref(0);

export const assessmentResults = ref(defaultResults());
export const mouldIndex = ref(0);
export const pigmentMap = ref(null);
export const pigmentRegionSummary = ref(null);
export const perPigmentParams = ref(null);
export const pigmentDisplayMode = ref('current');

export const isPlaying = ref(false);
export const simulationSpeed = ref(1.0);
let _simulationTimer = null;

export const history = ref([]);
const MAX_HISTORY = 100;

// ── Computeds ───────────────────────────────────────────────────────────────
export const totalDays = computed(() =>
    exposure.days + exposure.months * 30.44 + exposure.years * 365.25
);

export const availablePresets = computed(() => {
    const model = TAB_TO_MODEL[activeTab.value] || activeTab.value;
    return Object.entries(PRESET_CATALOG)
        .filter(([, p]) => p.models.includes(model))
        .map(([key, p]) => {
            const lightPart = p.light > 0 ? `, light=${p.light}` : '';
            const ampPart = (model === 'fatigue' && p.rhAmplitude != null) ? `, ±${p.rhAmplitude}%RH` : '';
            return { key, label: p.label, desc: `T=${p.temp}°C, RH=${p.rh}%${lightPart} klux${ampPart} · ${p.years}y` };
        });
});

// Normalised payload that ModelViewer can route via a single switch.
// Returned shape covers every `_apply*Effect` ModelViewer dispatches.
export const renderCommand = computed(() => {
    if (totalDays.value === 0 && pigmentDisplayMode.value === 'current') {
        return { mode: 'reset' };
    }
    if (pigmentDisplayMode.value === 'pigment-map' && pigmentMap.value) {
        return { mode: 'pigment-overlay', pigmentMap: pigmentMap.value };
    }
    const r = assessmentResults.value;
    const tab = activeTab.value;
    if (tab === 'chemical') {
        return {
            mode: 'chemical-fade',
            pigmentMap: pigmentMap.value,
            perPigmentParams: perPigmentParams.value,
            degradationFactor: enabledModels.chemical ? r.chemical.degradationFactor : 1.0
        };
    }
    if (tab === 'mould' && enabledModels.mould)        return { mode: 'mould',    mould:    r.mould };
    if (tab === 'salt'  && enabledModels.saltCryst)    return { mode: 'salt',     salt:     r.saltCryst };
    if (tab === 'lifetime' && enabledModels.lifetime)  return { mode: 'lifetime', lifetime: r.lifetime, totalDays: totalDays.value };
    if (tab === 'fatigue'  && enabledModels.fatigue)   return { mode: 'fatigue',  fatigue:  r.fatigue };
    return { mode: 'chemical-fade', pigmentMap: null, perPigmentParams: null, degradationFactor: 1.0 };
});

// ── Backend API ─────────────────────────────────────────────────────────────
let _assessDebounceTimer = null;

function _scheduleAssessment() {
    if (_assessDebounceTimer) clearTimeout(_assessDebounceTimer);
    _assessDebounceTimer = setTimeout(_runAssessment, 150);
}

async function _runAssessment() {
    try {
        const response = await window.api.deterioration.assess({
            T_celsius: env.temperature,
            RH_percent: env.humidity,
            light_klux: env.simLight,
            totalDays: totalDays.value,
            prevMouldIndex: mouldIndex.value,
            RH_amplitude: env.simRHAmplitude,
            chemicalParams: modelParams.chemical,
            lifetimeParams: modelParams.lifetime,
            mouldParams: modelParams.mould,
            saltCrystParams: modelParams.saltCryst,
            fatigueParams: modelParams.fatigue
        });
        assessmentResults.value = response.data;

        if (pigmentMap.value && enabledModels.chemical) {
            perPigmentParams.value = computePerPigmentParams({
                T_celsius: env.temperature,
                RH_percent: env.humidity,
                light_klux: env.simLight,
                totalDays: totalDays.value
            });
        }
    } catch (err) {
        console.error('Deterioration API error:', err);
    }
}

export async function loadDefaults() {
    try {
        const response = await window.api.deterioration.defaults();
        const d = response.data;
        Object.assign(modelParams.chemical,  d.chemical);
        Object.assign(modelParams.lifetime,  d.lifetime);
        Object.assign(modelParams.mould,     d.mould);
        Object.assign(modelParams.saltCryst, d.salt);
        if (d.fatigue) Object.assign(modelParams.fatigue, d.fatigue);
    } catch (err) {
        console.error('Failed to load deterioration defaults:', err);
    }
}

// ── Presets ─────────────────────────────────────────────────────────────────
export function applyPreset(key) {
    const p = PRESET_CATALOG[key];
    if (!p) return;
    env.temperature = p.temp;
    env.humidity = p.rh;
    exposure.days = p.days || 0;
    exposure.months = p.months || 0;
    exposure.years = p.years || 0;
    env.simLight = p.light;
    if (p.rhAmplitude != null) env.simRHAmplitude = p.rhAmplitude;
    mouldIndex.value = 0;
}

/**
 * Apply a preset with generation-tracked cancellation. Each call bumps a
 * monotonic counter; older in-flight applications exit at their next
 * `stillActive()` checkpoint so a fast-clicking user doesn't end up with
 * an interleaved final state.
 *
 * Callbacks let the UI reset the texture and wait for it to finish processing.
 */
export async function applyPresetWithCancellation(key, { onResetTexture, isTextureProcessing } = {}) {
    if (!key) return;
    const gen = ++_presetGeneration.value;
    const stillActive = () => gen === _presetGeneration.value;

    presetLoading.value = true;
    try {
        if (isPlaying.value) stopPlayback();
        if (onResetTexture) onResetTexture();
        await new Promise(r => setTimeout(r, 0));
        if (!stillActive()) return;

        applyPreset(key);

        await new Promise(r => setTimeout(r, 500));
        if (!stillActive()) return;

        const start = Date.now();
        while (isTextureProcessing && isTextureProcessing() && Date.now() - start < 10000) {
            await new Promise(r => setTimeout(r, 50));
            if (!stillActive()) return;
        }

        await new Promise(r => setTimeout(r, 100));
    } finally {
        if (stillActive()) presetLoading.value = false;
    }
}

// ── Playback ────────────────────────────────────────────────────────────────
export function startPlayback() {
    if (_simulationTimer) return;
    isPlaying.value = true;
    _simulationTimer = setInterval(_tick, 100);
    _recordHistoryPoint();
}

export function stopPlayback() {
    if (_simulationTimer) {
        clearInterval(_simulationTimer);
        _simulationTimer = null;
    }
    isPlaying.value = false;
}

export function togglePlayback() {
    if (isPlaying.value) stopPlayback();
    else startPlayback();
}

function _tick() {
    const daysPerTick = (simulationSpeed.value * 1.0) / 10;
    exposure.days += daysPerTick;

    if (enabledModels.mould && assessmentResults.value) {
        const growthRate = assessmentResults.value.mould.growthRate;
        mouldIndex.value = Math.max(0, Math.min(6, mouldIndex.value + growthRate * daysPerTick));
    }

    if (exposure.days >= 30.44) {
        const monthsToAdd = Math.floor(exposure.days / 30.44);
        exposure.months += monthsToAdd;
        exposure.days -= monthsToAdd * 30.44;
    }
    if (exposure.months >= 12) {
        const yearsToAdd = Math.floor(exposure.months / 12);
        exposure.years += yearsToAdd;
        exposure.months -= yearsToAdd * 12;
    }

    if (Math.random() < 0.1) _recordHistoryPoint();
}

// ── History ─────────────────────────────────────────────────────────────────
function _recordHistoryPoint() {
    const r = assessmentResults.value;
    history.value.push({
        time: totalDays.value,
        temperature: env.temperature,
        humidity: env.humidity,
        light: env.simLight,
        degradation: r.chemical.scientificDegradation,
        mouldIndex: mouldIndex.value
    });
    if (history.value.length > MAX_HISTORY) history.value.shift();
}

export function clearHistory() {
    history.value = [];
}

// ── Pigment integration ─────────────────────────────────────────────────────
export function setPigmentMap(map) {
    pigmentMap.value = map;
    if (!map) {
        perPigmentParams.value = null;
        pigmentRegionSummary.value = null;
    }
    _scheduleAssessment();
}

/** Set both the segmentation map and the per-region summary from an identifier result. */
export function setPigmentAnalysisResult({ pigmentMap: map, regionSummary }) {
    pigmentMap.value = map || null;
    pigmentRegionSummary.value = regionSummary || null;
    if (!map) perPigmentParams.value = null;
    _scheduleAssessment();
}

export function setPigmentDisplayMode(mode) {
    pigmentDisplayMode.value = mode;
}

// ── Reset ───────────────────────────────────────────────────────────────────
export function resetDefaults() {
    env.temperature = 20;
    env.humidity = 50;
    env.simLight = 0;
    env.simRHAmplitude = 10;
    exposure.days = 0;
    exposure.months = 0;
    exposure.years = 0;
    simulationSpeed.value = 1.0;
    mouldIndex.value = 0;
    selectedPreset.value = '';
}

// ── Watchers ────────────────────────────────────────────────────────────────
// Manual env / exposure changes reset the accumulator when not playing.
// During playback, _tick() owns the mouldIndex integration and we must
// leave the running value alone.
watch(() => [env.temperature, env.humidity], () => {
    if (!isPlaying.value) mouldIndex.value = 0;
    _scheduleAssessment();
});

watch(() => [exposure.days, exposure.months, exposure.years], () => {
    if (!isPlaying.value) mouldIndex.value = 0;
    _scheduleAssessment();
});

watch(() => env.simLight, _scheduleAssessment);
watch(() => env.simRHAmplitude, _scheduleAssessment);

watch(activeTab, () => {
    if (isPlaying.value) stopPlayback();
    exposure.days = 0; exposure.months = 0; exposure.years = 0;
    mouldIndex.value = 0;
    selectedPreset.value = '';
    _scheduleAssessment();
});

watch(enabledModels, _scheduleAssessment, { deep: true });
watch(modelParams,   _scheduleAssessment, { deep: true });
