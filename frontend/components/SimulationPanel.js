/**
 * Simulation Panel Component
 * Manual component for environmental simulation
 * Allows users to configure temperature and relative humidity
 *
 * Calls backend deterioration API for scientific model calculations:
 *   - Chemical pigment fading (Arrhenius + first-order kinetics)
 *   - Michalski lifetime multiplier (Climate for Culture eLM)
 *   - VTT / Finnish mould growth model (Hukka & Viitanen 1999)
 *   - Salt crystallization pressure (Scherer 1999 / Steiger 2005)
 */
import { useI18n } from '../i18n.js';
import PigmentAnalysisPanel from './PigmentAnalysisPanel.js';
import { PIGMENT_DATABASE, PIGMENT_NAMES } from '../ml/PigmentDatabase.js';

/**
 * Unified preset catalog. Each entry declares the environmental conditions
 * plus which deterioration models it's intended to demonstrate. The UI uses
 * `models` to filter the dropdown per active tab so users only see presets
 * that produce meaningful output for the current model.
 */
const PRESET_CATALOG = {
    // Real-world heritage scenarios. Every real-world preset includes
    // 'mould' in its models array so users can observe whether conditions
    // cross the VTT critical-RH threshold (many won't — and that's the
    // intended teaching point: "see why these conditions prevent mould").
    oneYear:     { temp: 25, rh: 60,  years: 1,   light: 10,   rhAmplitude: 10, label: '1 Year',                          models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    tenYears:    { temp: 25, rh: 60,  years: 10,  light: 10,   rhAmplitude: 10, label: '10 Years',                        models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    museum:      { temp: 20, rh: 50,  years: 100, light: 0.15, rhAmplitude: 5,  label: 'Museum 100y',                     models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    poorStorage: { temp: 30, rh: 80,  years: 50,  light: 5,    rhAmplitude: 20, label: 'Poor Storage 50y',                models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    extreme:     { temp: 40, rh: 100, years: 10,  light: 30,   rhAmplitude: 30, label: 'Extreme 10y',                     models: ['chemical', 'lifetime', 'mould', 'fatigue'] },
    longTerm200: { temp: 20, rh: 50,  years: 200, light: 0.15, rhAmplitude: 5,  label: '200y Museum',                     models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    mogao200:    { temp: 13, rh: 35,  years: 200, light: 2,    rhAmplitude: 15, label: '200y Mogao (cold/dry)',           models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    tropical200: { temp: 28, rh: 75,  years: 200, light: 5,    rhAmplitude: 20, label: '200y Tropical (humid/warm)',      models: ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'] },
    // Model-dedicated demonstrations
    demoChemical: { temp: 25, rh: 50, years: 50,  light: 20,   rhAmplitude: 10, label: '⚗️ Light Exposure Test 50y',       models: ['chemical'] },
    demoLifetime: { temp: 5,  rh: 35, years: 200, light: 0,    rhAmplitude: 5,  label: '⏳ Cold Dry Archive 200y',          models: ['lifetime'] },
    demoMould:    { temp: 25, rh: 90, years: 10,  light: 1,    rhAmplitude: 5,  label: '🦠 Humid Mould Bloom 10y',          models: ['mould'] },
    demoSalt:     { temp: 20, rh: 45, years: 100, light: 0.15, rhAmplitude: 5,  label: '🧂 Salt Cycling Zone 100y',         models: ['salt'] },
    demoFatigue:  { temp: 20, rh: 50, years: 50,  light: 0.15, rhAmplitude: 30, label: '🧱 Large RH Swings 50y',             models: ['fatigue'] },
};

/** Map the dropdown's `activeTab` name to the model keys used in PRESET_CATALOG. */
const TAB_TO_MODEL = { chemical: 'chemical', lifetime: 'lifetime', mould: 'mould', salt: 'salt', fatigue: 'fatigue' };

export default {
    name: 'SimulationPanel',
    components: { PigmentAnalysisPanel },
    props: {
        entity: {
            type: Object,
            default: null
        },
        pixelData: {
            type: Object,
            default: null // { data: Uint8ClampedArray, width, height }
        },
        externalPigmentMap: {
            type: Object,
            default: null
        },
        externalRestoredTexture: {
            type: Object,
            default: null
        },
        externalPigmentDisplayMode: {
            type: String,
            default: null
        },
        textureProcessing: {
            type: Boolean,
            default: false
        }
    },
    emits: ['simulation-changed', 'reset-texture', 'busy-changed'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            temperature: 20, // Celsius
            humidity: 50,    // Percentage
            isSimulating: true,   // Always active
            isPlaying: false,    // Time progression play/pause
            temperatureUnit: 'C', // C or F
            simulationSpeed: 1.0, // Multiplier for time-based effects
            // Deterioration simulation parameters
            simDays: 0,      // Exposure time in days
            simMonths: 0,    // Exposure time in months
            simYears: 0,     // Exposure time in years
            simLight: 0,     // Light intensity in klux
            simRHAmplitude: 10, // RH cycle amplitude (%), drives hygro-mechanical fatigue
            // Mould growth tracking
            mouldIndex: 0,   // Running mould index (0-6)
            // Time progression
            simulationTimer: null,
            timeSeriesData: [],  // Historical data points
            chartInstance: null,
            maxDataPoints: 100,   // Limit chart data for performance
            isApplyingTexture: false,  // For notification
            // Model selection toggles
            enabledModels: {
                chemical: true,
                lifetime: true,
                mould: true,
                saltCryst: true,
                fatigue: true
            },
            // Active tab
            activeTab: 'chemical',
            // Selected preset (empty = no preset)
            selectedPreset: '',
            // Loading state during preset application (reset → apply → wait for texture)
            presetLoading: false,
            // Monotonic counter; bumped on every preset change so an earlier
            // in-flight onPresetChange knows it's been superseded and exits.
            _presetGeneration: 0,
            // Model configuration (expandable)
            showConfig: { chemical: false, lifetime: false, mould: false, saltCryst: false, fatigue: false },
            // Configurable model parameters (loaded from backend /deterioration/defaults)
            chemicalParams: { Ea_dark: 70000, Ea_light: 25000, k0_dark: 0.0001, k0_light: 0.001, q: 0.8, p: 0.9 },
            lifetimeParams: { Ea: 70000, n: 1.3, T0: 20, RH0: 50 },
            mouldParams: { growthCoeff: 0.13, declineRate: -0.128 },
            saltCrystParams: { Vm: 5.33e-5, DRH_ref: 84.2, DRH_slope: -0.17, T_ref: 25, tensileStrength: 3.0, cyclesPerYear: 120 },
            fatigueParams: { beta_diff: 5e-5, E: 2000, sigma_fail: 10.0, basquin_b: 6, cyclesPerYear: 365 },
            // Cached assessment results from backend API
            _assessmentResults: null,
            _assessDebounceTimer: null,
            // ML pigment analysis
            pigmentMap: null,
            perPigmentParams: null,
            restoredTexture: null,
            pigmentDisplayMode: 'current'
        };
    },
    computed: {
        temperatureK() {
            if (this.temperatureUnit === 'C') {
                return this.temperature + 273.15;
            } else {
                return (this.temperature - 32) * 5/9 + 273.15;
            }
        },
        temperatureCelsius() {
            if (this.temperatureUnit === 'C') return this.temperature;
            return (this.temperature - 32) * 5/9;
        },
        temperatureColor() {
            if (this.temperature < 10) return '#3b82f6';
            if (this.temperature < 20) return '#10b981';
            if (this.temperature < 25) return '#f59e0b';
            return '#ef4444';
        },
        humidityColor() {
            if (this.humidity < 30) return '#ef4444';
            if (this.humidity < 40) return '#f59e0b';
            if (this.humidity < 60) return '#10b981';
            if (this.humidity < 70) return '#f59e0b';
            return '#ef4444';
        },
        temperatureStatus() {
            if (this.temperature < 10) return this.t('simulation.status.tooCold');
            if (this.temperature < 18) return this.t('simulation.status.cold');
            if (this.temperature < 22) return this.t('simulation.status.optimal');
            if (this.temperature < 28) return this.t('simulation.status.warm');
            return this.t('simulation.status.tooHot');
        },
        lightColor() {
            if (this.simLight <= 0) return '#6b7280';       // Dark - gray
            if (this.simLight <= 0.2) return '#10b981';     // Museum - green
            if (this.simLight <= 5) return '#f59e0b';       // Moderate - orange
            return '#ef4444';                                // Excessive - red
        },
        lightStatus() {
            if (this.simLight <= 0) return this.t('simulation.status.dark') || 'Dark storage';
            if (this.simLight <= 0.2) return this.t('simulation.status.museum') || 'Museum level';
            if (this.simLight <= 5) return this.t('simulation.status.moderate') || 'Moderate exposure';
            return this.t('simulation.status.excessive') || 'Excessive';
        },
        humidityStatus() {
            if (this.humidity < 30) return this.t('simulation.status.tooDry');
            if (this.humidity < 40) return this.t('simulation.status.dry');
            if (this.humidity < 60) return this.t('simulation.status.optimal');
            if (this.humidity < 70) return this.t('simulation.status.humid');
            return this.t('simulation.status.tooHumid');
        },
        // ── Deterioration model results (cached from backend API) ────────────
        assessmentResults() {
            return this._assessmentResults || {
                chemical: { rateConstant: 0, degradationFactor: 1, scientificDegradation: 0, risk: 0, label: 'low', visualEffect: { fadeFactor: 1, type: 'chemical' } },
                lifetime: { multiplier: 1, label: 'longer', color: '#10b981' },
                mould: { mouldIndex: 0, rhCritical: 80, isAboveThreshold: false, risk: 0, label: 'low', growthRate: 0, visualEffect: { coverage: 0, intensity: 0, type: 'mould' } },
                saltCryst: { pressure_MPa: 0, DRH: 84.2, isCrystallizing: false, damageRatio: 0, cumulativeDamage: 0, risk: 0, label: 'safe', visualEffect: { spalling: 0, type: 'salt' } },
                fatigue: { stress_MPa: 0, cyclesToFailure: null, cyclesApplied: 0, cumulativeDamage: 0, crackDensity: 0, risk: 0, label: 'low', visualEffect: { crackDensity: 0, type: 'fatigue' } }
            };
        },
        lifetimeResult() {
            return this.assessmentResults.lifetime;
        },
        mouldResult() {
            return this.assessmentResults.mould;
        },
        chemicalResult() {
            return this.assessmentResults.chemical;
        },
        saltCrystResult() {
            return this.assessmentResults.saltCryst;
        },
        fatigueResult() {
            return this.assessmentResults.fatigue;
        },
        displayMouldIndex() {
            // Use assessment result (correct in both static and play modes)
            // During play, this.mouldIndex accumulator feeds into assessmentResults anyway
            return this.mouldResult.mouldIndex;
        },
        mouldStatusColor() {
            if (!this.mouldResult.isAboveThreshold && this.humidity < this.mouldResult.rhCritical - 5) return '#10b981';
            if (!this.mouldResult.isAboveThreshold) return '#f59e0b';
            return '#ef4444';
        },
        mouldStatusLabel() {
            if (!this.mouldResult.isAboveThreshold && this.humidity < this.mouldResult.rhCritical - 5) return this.t('simulation.mould.safe');
            if (!this.mouldResult.isAboveThreshold) return this.t('simulation.mould.warning');
            return this.t('simulation.mould.active');
        },
        busy() { return this.presetLoading || this.textureProcessing; },
        /** Presets whose `models` array includes the current activeTab. */
        availablePresets() {
            const model = TAB_TO_MODEL[this.activeTab] || this.activeTab;
            return Object.entries(PRESET_CATALOG)
                .filter(([, p]) => p.models.includes(model))
                .map(([key, p]) => {
                    const lightPart = p.light > 0 ? `, light=${p.light}` : '';
                    const ampPart = (model === 'fatigue' && p.rhAmplitude != null)
                        ? `, ±${p.rhAmplitude}%RH` : '';
                    return {
                        key,
                        label: p.label,
                        desc: `T=${p.temp}°C, RH=${p.rh}%${lightPart} klux${ampPart} · ${p.years}y`
                    };
                });
        }
    },
    watch: {
        busy(v) { this.$emit('busy-changed', v); },
        externalPigmentMap(val) {
            // Sync both directions: set on new value, clear on null (e.g. exhibit switch)
            this.pigmentMap = val || null;
            if (!val) this.perPigmentParams = null;
            this.emitSimulation();
        },
        externalRestoredTexture(val) {
            // Keep the restored pixels available for per-pigment lookup but do NOT
            // override the display mode — when the Simulation panel is active we
            // always want the simulation effect rendered, not the restored overlay.
            // Also clear on null so exhibit-switch resets propagate.
            this.restoredTexture = val || null;
        },
        // externalPigmentDisplayMode is intentionally not synced — the Simulation
        // panel always emits displayMode='current' so its effect wins over the
        // PigmentAnalysisPanel's overlay/restored modes.
        activeTab() {
            // Stop any running simulation and reset texture when switching models
            if (this.isPlaying) {
                this.isPlaying = false;
                this.stopTimeProgression();
            }
            this.simDays = 0;
            this.simMonths = 0;
            this.simYears = 0;
            this.mouldIndex = 0;
            this.selectedPreset = '';
            this.emitSimulation();
        },
        temperature() {
            // Manual environment change invalidates the play-mode accumulator:
            // growth rate depends on T, so the carried-over index is stale.
            if (!this.isPlaying) this.mouldIndex = 0;
            this.emitSimulation();
        },
        humidity() {
            if (!this.isPlaying) this.mouldIndex = 0;
            this.emitSimulation();
        },
        simDays() {
            // Only reset when the user is scrubbing manually — during play,
            // tickSimulation is mutating simDays every frame and we must
            // keep the accumulator intact so growth integrates over time.
            if (!this.isPlaying) this.mouldIndex = 0;
            this.emitSimulation();
        },
        simMonths() {
            if (!this.isPlaying) this.mouldIndex = 0;
            this.emitSimulation();
        },
        simYears() {
            if (!this.isPlaying) this.mouldIndex = 0;
            this.emitSimulation();
        },
        simLight() { this.emitSimulation(); },
        simRHAmplitude() { this.emitSimulation(); },
        enabledModels: {
            deep: true,
            handler() { this.emitSimulation(); }
        },
        chemicalParams: {
            deep: true,
            handler() { this.emitSimulation(); }
        },
        lifetimeParams: {
            deep: true,
            handler() { this.emitSimulation(); }
        },
        mouldParams: {
            deep: true,
            handler() { this.emitSimulation(); }
        },
        saltCrystParams: {
            deep: true,
            handler() { this.emitSimulation(); }
        },
        fatigueParams: {
            deep: true,
            handler() { this.emitSimulation(); }
        }
    },
    methods: {
        // Return cached rate constant from last assessment
        calculateRateConstant() {
            return this.assessmentResults.chemical.rateConstant;
        },

        getTotalDays() {
            return this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);
        },

        // Fetch assessment from backend API (debounced)
        fetchAssessment() {
            if (this._assessDebounceTimer) clearTimeout(this._assessDebounceTimer);
            this._assessDebounceTimer = setTimeout(() => this._doFetchAssessment(), 150);
        },

        async _doFetchAssessment() {
            try {
                const response = await window.api.deterioration.assess({
                    T_celsius: this.temperatureCelsius,
                    RH_percent: this.humidity,
                    light_klux: this.simLight,
                    totalDays: this.getTotalDays(),
                    prevMouldIndex: this.mouldIndex,
                    RH_amplitude: this.simRHAmplitude,
                    chemicalParams: this.chemicalParams,
                    lifetimeParams: this.lifetimeParams,
                    mouldParams: this.mouldParams,
                    saltCrystParams: this.saltCrystParams,
                    fatigueParams: this.fatigueParams
                });
                this._assessmentResults = response.data;
                // Re-emit with fresh backend results so ModelViewer renders
                // the correct texture (fixes stale-data bug on preset changes).
                this._emitCurrent();
            } catch (error) {
                console.error('Deterioration API error:', error);
            }
        },

        async loadDefaults() {
            try {
                const response = await window.api.deterioration.defaults();
                const d = response.data;
                this.chemicalParams = { ...d.chemical };
                this.lifetimeParams = { ...d.lifetime };
                this.mouldParams = { ...d.mould };
                this.saltCrystParams = { ...d.salt };
                if (d.fatigue) this.fatigueParams = { ...d.fatigue };
            } catch (error) {
                console.error('Failed to load deterioration defaults:', error);
            }
        },

        emitSimulation() {
            if (!this.isSimulating) return;
            this.fetchAssessment();
            this._emitCurrent();
        },

        _emitCurrent() {
            if (!this.isSimulating) return;
            const results = this.assessmentResults;
            const totalDays = this.getTotalDays();

            // Compute per-pigment Arrhenius when pigmentMap is available
            if (this.pigmentMap && this.enabledModels.chemical) {
                this._computePerPigmentParams(totalDays);
            }

            this.$emit('simulation-changed', {
                temperature: {
                    value: this.temperatureK,
                    unit: 'K',
                    celsius: this.temperatureCelsius
                },
                humidity: {
                    value: this.humidity,
                    unit: 'RH'
                },
                activeModel: this.activeTab,
                deterioration: {
                    // Legacy fields for backward compatibility with ModelViewer
                    days: this.simDays,
                    months: this.simMonths,
                    years: this.simYears,
                    lightIntensity: this.simLight,
                    totalDays: totalDays,
                    rateConstant: this.enabledModels.chemical ? results.chemical.rateConstant : 0,
                    degradationFactor: this.enabledModels.chemical ? results.chemical.degradationFactor : 1.0,
                    scientificDegradation: this.enabledModels.chemical ? results.chemical.scientificDegradation : 0,
                    // Per-model results (null when disabled)
                    chemical: this.enabledModels.chemical ? results.chemical : null,
                    lifetime: this.enabledModels.lifetime ? results.lifetime : null,
                    mould: this.enabledModels.mould ? results.mould : null,
                    saltCryst: this.enabledModels.saltCryst ? results.saltCryst : null,
                    fatigue: this.enabledModels.fatigue ? results.fatigue : null,
                    RH_amplitude: this.simRHAmplitude,
                    // ML pigment data
                    pigmentMap: this.pigmentMap,
                    perPigmentParams: this.perPigmentParams,
                    restoredTexture: this.restoredTexture,
                    // Always 'current' so the simulation effect is rendered —
                    // the PigmentAnalysisPanel controls overlays independently.
                    pigmentDisplayMode: 'current'
                },
                timestamp: Date.now(),
                speed: this.simulationSpeed
            });
        },

        // ── ML Pigment Integration ──────────────────────────────────
        _computePerPigmentParams(totalDays) {
            const R = 8.314;
            const T = this.temperatureCelsius + 273.15;
            const RH = this.humidity / 100;
            const light = this.simLight;
            const params = {};

            for (const name of PIGMENT_NAMES) {
                const p = PIGMENT_DATABASE[name];
                // Arrhenius rate constant per pigment
                const H2O = Math.pow(Math.abs(Math.log(1 - Math.min(RH, 0.999)) / (1.67 * T - 285.655)), 1 / (2.491 - 0.012 * T));
                const k_dark = p.k0_dark * Math.pow(Math.abs(H2O), p.q) * Math.exp(-p.Ea_dark / (R * T));
                const k_light = light > 0 ? p.k0_light * Math.pow(light, p.p) * Math.pow(Math.abs(H2O), p.q) * Math.exp(-p.Ea_light / (R * T)) : 0;
                const k = k_dark + k_light;
                const degradationFactor = Math.exp(-k * totalDays);
                params[p.id] = { degradationFactor, fadedRGB: p.fadedRGB, targetRGB: p.targetRGB };
            }
            this.perPigmentParams = params;
        },

        handlePigmentAnalyzed(result) {
            this.pigmentMap = result.pigmentMap;
            this.emitSimulation();
        },

        handleTextureRestored(result) {
            this.restoredTexture = result;
            this.pigmentDisplayMode = 'restored';
            this.emitSimulation();
        },

        handleDisplayModeChanged(mode) {
            this.pigmentDisplayMode = mode;
            this.emitSimulation();
        },

        toggleSimulation() {
            this.isSimulating = !this.isSimulating;
            if (this.isSimulating) {
                this.emitSimulation();
            }
        },

        resetDefaults() {
            this.temperature = 20;
            this.humidity = 50;
            this.simulationSpeed = 1.0;
            this.simDays = 0;
            this.simMonths = 0;
            this.simYears = 0;
            this.simLight = 0;
            this.mouldIndex = 0;
            this.selectedPreset = '';
        },

        resetModelParams(model) {
            // Re-fetch defaults from backend
            this.loadDefaults();
        },

        async onPresetChange(event) {
            const preset = event.target.value;
            if (!preset) return;

            // Bump the generation; any in-flight older run will see a
            // mismatch at its next checkpoint and exit cleanly.
            const gen = ++this._presetGeneration;
            const stillActive = () => gen === this._presetGeneration;

            this.presetLoading = true;
            try {
                // 1. Stop any running time progression
                if (this.isPlaying) {
                    this.isPlaying = false;
                    this.stopTimeProgression();
                }
                // 2. Reset the texture to original (via parent → ModelViewer)
                this.$emit('reset-texture');
                await this.$nextTick();
                if (!stillActive()) return;

                // 3. Apply preset parameters — watchers will trigger emitSimulation
                this.applyPreset(preset);

                // 4. Wait for the backend assessment to complete (debounce 150ms + API).
                //    _doFetchAssessment will re-emit with fresh data, triggering texture rerender.
                await new Promise(r => setTimeout(r, 500));
                if (!stillActive()) return;

                // 5. Wait for ModelViewer's isProcessing to clear (via textureProcessing prop).
                const start = Date.now();
                while (this.textureProcessing && Date.now() - start < 10000) {
                    await new Promise(r => setTimeout(r, 50));
                    if (!stillActive()) return;
                }

                // 6. Small grace period so the overlay doesn't flicker
                await new Promise(r => setTimeout(r, 100));
            } finally {
                // Only the latest generation may clear the loading flag —
                // older runs bailed out and must leave it for the winner.
                if (stillActive()) this.presetLoading = false;
            }
        },

        applyPreset(preset) {
            const p = PRESET_CATALOG[preset];
            if (p) {
                this.temperature = p.temp;
                this.humidity = p.rh;
                this.simDays = p.days || 0;
                this.simMonths = p.months || 0;
                this.simYears = p.years || 0;
                this.simLight = p.light;
                if (p.rhAmplitude != null) this.simRHAmplitude = p.rhAmplitude;
                this.mouldIndex = 0; // Reset mould on preset change
            }
        },

        convertTemperature() {
            if (this.temperatureUnit === 'C') {
                this.temperature = (this.temperature * 9/5) + 32;
                this.temperatureUnit = 'F';
            } else {
                this.temperature = (this.temperature - 32) * 5/9;
                this.temperatureUnit = 'C';
            }
        },

        // ── Time Progression ────────────────────────────────────────────
        toggleTimeProgression() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.startTimeProgression();
            } else {
                this.stopTimeProgression();
            }
        },

        startTimeProgression() {
            if (this.simulationTimer) return;
            this.simulationTimer = setInterval(() => {
                this.tickSimulation();
            }, 100);
            this.recordDataPoint();
        },

        stopTimeProgression() {
            if (this.simulationTimer) {
                clearInterval(this.simulationTimer);
                this.simulationTimer = null;
            }
        },

        tickSimulation() {
            const daysPerTick = (this.simulationSpeed * 1.0) / 10;
            this.simDays += daysPerTick;

            // Update mould index incrementally using cached growth rate from last API response
            if (this.enabledModels.mould && this._assessmentResults) {
                const growthRate = this._assessmentResults.mould.growthRate;
                this.mouldIndex = Math.max(0, Math.min(6, this.mouldIndex + growthRate * daysPerTick));
            }

            // Normalize days → months → years
            if (this.simDays >= 30.44) {
                const monthsToAdd = Math.floor(this.simDays / 30.44);
                this.simMonths += monthsToAdd;
                this.simDays -= monthsToAdd * 30.44;
            }
            if (this.simMonths >= 12) {
                const yearsToAdd = Math.floor(this.simMonths / 12);
                this.simYears += yearsToAdd;
                this.simMonths -= yearsToAdd * 12;
            }

            if (Math.random() < 0.1) {
                this.recordDataPoint();
            }
        },

        recordDataPoint() {
            const totalDays = this.getTotalDays();
            const results = this.assessmentResults;

            this.timeSeriesData.push({
                time: totalDays,
                temperature: this.temperatureCelsius,
                humidity: this.humidity,
                light: this.simLight,
                degradation: results.chemical.scientificDegradation,
                mouldIndex: this.mouldIndex
            });

            if (this.timeSeriesData.length > this.maxDataPoints) {
                this.timeSeriesData.shift();
            }
            this.updateChart();
        },

        // ── Chart.js ────────────────────────────────────────────────────
        initChart() {
            const canvas = this.$refs.timeSeriesCanvas;
            if (!canvas) return;

            this.chartInstance = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Temperature (°C)',
                            data: [],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            yAxisID: 'y',
                            tension: 0.4
                        },
                        {
                            label: 'Humidity (% RH)',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            yAxisID: 'y',
                            tension: 0.4
                        },
                        {
                            label: 'Light (klux)',
                            data: [],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            yAxisID: 'y1',
                            tension: 0.4
                        },
                        {
                            label: 'Degradation (%)',
                            data: [],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            yAxisID: 'y2',
                            tension: 0.4
                        },
                        {
                            label: 'Mould Index (0-6)',
                            data: [],
                            borderColor: '#059669',
                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                            yAxisID: 'y3',
                            tension: 0.4,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 12, font: { size: 10 } }
                        },
                        title: {
                            display: true,
                            text: 'Environmental Conditions Over Time',
                            font: { size: 12 }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Simulated Time (days)', font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        },
                        y: {
                            type: 'linear', display: true, position: 'left',
                            title: { display: true, text: 'Temp (°C) / Humidity (% RH)', font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        },
                        y1: {
                            type: 'linear', display: true, position: 'right',
                            title: { display: true, text: 'Light (klux)', font: { size: 10 } },
                            ticks: { font: { size: 9 } },
                            grid: { drawOnChartArea: false }
                        },
                        y2: { type: 'linear', display: false, position: 'right', max: 100 },
                        y3: { type: 'linear', display: false, position: 'right', min: 0, max: 6 }
                    }
                }
            });
        },

        updateChart() {
            if (!this.chartInstance) return;

            const labels = this.timeSeriesData.map(d => d.time.toFixed(0));
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = this.timeSeriesData.map(d => d.temperature);
            this.chartInstance.data.datasets[1].data = this.timeSeriesData.map(d => d.humidity);
            this.chartInstance.data.datasets[2].data = this.timeSeriesData.map(d => d.light);
            this.chartInstance.data.datasets[3].data = this.timeSeriesData.map(d => d.degradation);
            this.chartInstance.data.datasets[4].data = this.timeSeriesData.map(d => d.mouldIndex);

            this.chartInstance.update('none');
        },

        clearHistory() {
            this.timeSeriesData = [];
            this.updateChart();
        }
    },

    mounted() {
        // Pick up any pigment data already available from the Pigment Analysis panel.
        // We do NOT sync externalPigmentDisplayMode — simulation renders its own effect.
        if (this.externalPigmentMap) this.pigmentMap = this.externalPigmentMap;
        if (this.externalRestoredTexture) this.restoredTexture = this.externalRestoredTexture;
        this.loadDefaults();
        this.$nextTick(() => { this.initChart(); this.emitSimulation(); });
    },

    beforeUnmount() {
        this.stopTimeProgression();
        if (this._assessDebounceTimer) clearTimeout(this._assessDebounceTimer);
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    },

    template: `
        <div class="simulation-panel simulation-active" style="position: relative;">
            <!-- Loading overlay shown during preset application or texture processing -->
            <div v-if="busy" style="position: absolute; inset: 0; background: rgba(255,255,255,0.82); border-radius: 12px; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; pointer-events: all;">
                <div class="pigment-spinner"></div>
                <span style="font-size: 13px; font-weight: 500; color: #555;">
                    {{ presetLoading ? 'Applying preset…' : 'Rendering texture…' }}
                </span>
            </div>
            <div class="sim-header">
                <div class="sim-header-top">
                    <h3 class="sim-title">🧪 {{ t('simulation.title') }}</h3>
                </div>
                <div class="sim-controls">
                    <button @click="toggleTimeProgression" class="sim-play-btn" :class="{ playing: isPlaying }">
                        <span v-if="isPlaying">⏸</span><span v-else>▶</span>
                    </button>
                    <div class="sim-time-display">
                        <div class="sim-time-value">{{ (getTotalDays() / 365.25).toFixed(1) }} <small>years</small></div>
                        <div class="sim-time-sub">{{ getTotalDays().toFixed(0) }} days
                            <span v-if="isPlaying" class="sim-playing-dot">● {{ simulationSpeed.toFixed(0) }}×</span>
                        </div>
                    </div>
                    <div class="sim-speed-btns">
                        <button v-for="s in [1, 5, 10, 20]" :key="s"
                                class="sim-speed-btn" :class="{ active: simulationSpeed === s }"
                                @click="simulationSpeed = s">
                            ×{{ s }}
                        </button>
                    </div>
                    <button @click="resetDefaults" class="sim-reset-btn" title="Reset">↺</button>
                </div>
            </div>

            <div class="simulation-body">
                <!-- ── Models card ──────────────────────────────────── -->
                <div class="sim-card">
                    <div class="sim-card-title">Models</div>
                    <select class="preset-select" v-model="activeTab" style="margin-bottom: 14px;">
                        <option value="chemical">⚗️ Chemical Pigment Fading (Arrhenius + Paltakari–Karlsson)</option>
                        <option value="lifetime">⏳ Michalski Lifetime Multiplier (Climate for Culture eLM)</option>
                        <option value="mould">🦠 VTT / Finnish Mould Growth (Hukka &amp; Viitanen 1999)</option>
                        <option value="salt">🧂 Salt Crystallisation Pressure (Scherer 1999 / Steiger 2005)</option>
                        <option value="fatigue">🧱 Hygro-mechanical Fatigue (HERIe / Bratasz 2013)</option>
                    </select>

                <!-- ═══ CHEMICAL TAB ═══ -->
                <!-- ═══ CHEMICAL TAB ═══ -->
                <div v-if="activeTab === 'chemical'" class="sim-tab-content">
                    <!-- Controls: Temperature, Humidity, Light, Exposure -->
                    <div class="sim-tab-controls">
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">🌡️ {{ t('simulation.temperature') }}</span>
                                <span class="sim-compact-value" :style="{ color: temperatureColor }">{{ temperature.toFixed(1) }}°{{ temperatureUnit }}</span>
                            </div>
                            <input type="range" v-model.number="temperature" :min="temperatureUnit === 'C' ? -10 : 14" :max="temperatureUnit === 'C' ? 40 : 104" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💧 {{ t('simulation.humidity') }}</span>
                                <span class="sim-compact-value" :style="{ color: humidityColor }">{{ humidity.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="humidity" min="10" max="90" step="1" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💡 {{ t('simulation.light') }}</span>
                                <span class="sim-compact-value" :style="{ color: lightColor }">{{ simLight.toFixed(1) }} klux</span>
                            </div>
                            <input type="range" v-model.number="simLight" min="0" max="50" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">⏱️ Exposure</span>
                                <span class="sim-compact-value">{{ simYears }} yr</span>
                            </div>
                            <input type="range" v-model.number="simYears" min="0" max="200" step="1" class="simulation-slider" />
                        </div>
                    </div>
                    <!-- Result -->
                    <div class="sim-tab-result">
                        <div class="sim-result-main" :style="{ color: chemicalResult.label === 'low' ? '#10b981' : chemicalResult.label === 'moderate' ? '#eab308' : '#ef4444' }">
                            {{ chemicalResult.scientificDegradation.toFixed(1) }}%
                        </div>
                        <div class="sim-result-sub">k = {{ chemicalResult.rateConstant.toExponential(2) }} /day</div>
                        <span class="deterioration-badge" :style="{ background: chemicalResult.label === 'critical' ? '#ef4444' : chemicalResult.label === 'high' ? '#f59e0b' : chemicalResult.label === 'moderate' ? '#eab308' : '#10b981', color: 'white' }">{{ chemicalResult.label }}</span>
                    </div>
                    <!-- Params -->
                    <button class="config-toggle-btn" style="margin-top: 8px; width: 100%;" @click="showConfig.chemical = !showConfig.chemical">{{ showConfig.chemical ? '▼' : '▶' }} {{ t('simulation.params.configure') }}</button>
                    <div v-if="showConfig.chemical" class="param-config">
                        <div class="param-config-grid">
                            <div class="param-field"><label>{{ t('simulation.params.chemical.Ea_dark') }}</label><input type="number" v-model.number="chemicalParams.Ea_dark" step="1000" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.chemical.Ea_light') }}</label><input type="number" v-model.number="chemicalParams.Ea_light" step="1000" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.chemical.k0_dark') }}</label><input type="number" v-model.number="chemicalParams.k0_dark" step="0.00001" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.chemical.k0_light') }}</label><input type="number" v-model.number="chemicalParams.k0_light" step="0.0001" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.chemical.q') }}</label><input type="number" v-model.number="chemicalParams.q" step="0.1" min="0" max="2" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.chemical.p') }}</label><input type="number" v-model.number="chemicalParams.p" step="0.1" min="0" max="2" /></div>
                        </div>
                        <button class="param-reset-btn" @click="resetModelParams('chemical')">{{ t('simulation.params.resetDefaults') }}</button>
                    </div>
                </div>

                <!-- ═══ LIFETIME TAB ═══ -->
                <div v-if="activeTab === 'lifetime'" class="sim-tab-content">
                    <div class="sim-tab-controls">
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">🌡️ {{ t('simulation.temperature') }}</span>
                                <span class="sim-compact-value" :style="{ color: temperatureColor }">{{ temperature.toFixed(1) }}°{{ temperatureUnit }}</span>
                            </div>
                            <input type="range" v-model.number="temperature" :min="temperatureUnit === 'C' ? -10 : 14" :max="temperatureUnit === 'C' ? 40 : 104" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💧 {{ t('simulation.humidity') }}</span>
                                <span class="sim-compact-value" :style="{ color: humidityColor }">{{ humidity.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="humidity" min="10" max="90" step="1" class="simulation-slider" />
                        </div>
                    </div>
                    <div class="sim-tab-result">
                        <div class="sim-result-main" :style="{ color: lifetimeResult.color }">{{ lifetimeResult.multiplier.toFixed(2) }}×</div>
                        <div class="sim-result-sub" :style="{ color: lifetimeResult.color }">{{ lifetimeResult.label === 'longer' ? t('simulation.lifetime.longer') : t('simulation.lifetime.shorter') }}</div>
                        <div style="font-size: 10px; color: #888; margin-top: 4px;">{{ t('simulation.lifetime.reference') }}</div>
                    </div>
                    <button class="config-toggle-btn" style="margin-top: 8px; width: 100%;" @click="showConfig.lifetime = !showConfig.lifetime">{{ showConfig.lifetime ? '▼' : '▶' }} {{ t('simulation.params.configure') }}</button>
                    <div v-if="showConfig.lifetime" class="param-config">
                        <div class="param-config-grid">
                            <div class="param-field"><label>{{ t('simulation.params.lifetime.Ea') }}</label><input type="number" v-model.number="lifetimeParams.Ea" step="1000" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.lifetime.n') }}</label><input type="number" v-model.number="lifetimeParams.n" step="0.1" min="0" max="5" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.lifetime.T0') }}</label><input type="number" v-model.number="lifetimeParams.T0" step="1" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.lifetime.RH0') }}</label><input type="number" v-model.number="lifetimeParams.RH0" step="1" min="1" max="100" /></div>
                        </div>
                        <button class="param-reset-btn" @click="resetModelParams('lifetime')">{{ t('simulation.params.resetDefaults') }}</button>
                    </div>
                </div>

                <!-- ═══ MOULD TAB ═══ -->
                <div v-if="activeTab === 'mould'" class="sim-tab-content">
                    <div class="sim-tab-controls">
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">🌡️ {{ t('simulation.temperature') }}</span>
                                <span class="sim-compact-value" :style="{ color: temperatureColor }">{{ temperature.toFixed(1) }}°{{ temperatureUnit }}</span>
                            </div>
                            <input type="range" v-model.number="temperature" :min="temperatureUnit === 'C' ? -10 : 14" :max="temperatureUnit === 'C' ? 40 : 104" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💧 {{ t('simulation.humidity') }}</span>
                                <span class="sim-compact-value" :style="{ color: humidityColor }">{{ humidity.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="humidity" min="10" max="90" step="1" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">⏱️ Exposure</span>
                                <span class="sim-compact-value">{{ simYears }} yr</span>
                            </div>
                            <input type="range" v-model.number="simYears" min="0" max="200" step="1" class="simulation-slider" />
                        </div>
                    </div>
                    <div class="sim-tab-result">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                            <span>{{ t('simulation.mould.index') }}: <strong>{{ displayMouldIndex.toFixed(1) }}</strong> / 6</span>
                            <span style="color: #888;">{{ t('simulation.mould.scale.' + Math.min(6, Math.floor(displayMouldIndex))) }}</span>
                        </div>
                        <div class="mould-gauge-track">
                            <div class="mould-gauge-fill" :style="{ width: (displayMouldIndex / 6 * 100) + '%', background: displayMouldIndex < 2 ? '#10b981' : displayMouldIndex < 4 ? '#f59e0b' : '#ef4444' }"></div>
                            <div class="mould-gauge-labels"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 8px;">
                            {{ t('simulation.mould.threshold', { rh: mouldResult.rhCritical.toFixed(0) }) }}
                            <span v-if="mouldResult.isAboveThreshold" style="color: #ef4444; font-weight: 600;"> ({{ t('simulation.mould.exceeded') }})</span>
                        </div>
                        <span class="deterioration-badge" style="margin-top: 8px;" :style="{ background: mouldStatusColor, color: 'white' }">{{ mouldStatusLabel }}</span>
                    </div>
                    <button class="config-toggle-btn" style="margin-top: 8px; width: 100%;" @click="showConfig.mould = !showConfig.mould">{{ showConfig.mould ? '▼' : '▶' }} {{ t('simulation.params.configure') }}</button>
                    <div v-if="showConfig.mould" class="param-config">
                        <div class="param-config-grid">
                            <div class="param-field"><label>{{ t('simulation.params.mould.growthCoeff') }}</label><input type="number" v-model.number="mouldParams.growthCoeff" step="0.01" min="0" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.mould.declineRate') }}</label><input type="number" v-model.number="mouldParams.declineRate" step="0.01" max="0" /></div>
                        </div>
                        <button class="param-reset-btn" @click="resetModelParams('mould')">{{ t('simulation.params.resetDefaults') }}</button>
                    </div>
                </div>

                <!-- ═══ SALT TAB ═══ -->
                <div v-if="activeTab === 'salt'" class="sim-tab-content">
                    <div class="sim-tab-controls">
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">🌡️ {{ t('simulation.temperature') }}</span>
                                <span class="sim-compact-value" :style="{ color: temperatureColor }">{{ temperature.toFixed(1) }}°{{ temperatureUnit }}</span>
                            </div>
                            <input type="range" v-model.number="temperature" :min="temperatureUnit === 'C' ? -10 : 14" :max="temperatureUnit === 'C' ? 40 : 104" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💧 {{ t('simulation.humidity') }}</span>
                                <span class="sim-compact-value" :style="{ color: humidityColor }">{{ humidity.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="humidity" min="10" max="90" step="1" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">⏱️ Exposure</span>
                                <span class="sim-compact-value">{{ simYears }} yr</span>
                            </div>
                            <input type="range" v-model.number="simYears" min="0" max="200" step="1" class="simulation-slider" />
                        </div>
                    </div>
                    <div class="sim-tab-result">
                        <div class="sim-result-main" :style="{ color: saltCrystResult.damageRatio >= 1.5 ? '#ef4444' : saltCrystResult.damageRatio >= 0.5 ? '#f59e0b' : '#10b981' }">
                            {{ saltCrystResult.pressure_MPa.toFixed(1) }} MPa
                        </div>
                        <div class="sim-result-sub">{{ t('simulation.saltCryst.pressure') }}</div>
                        <div style="margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                                <span>{{ t('simulation.saltCryst.damageRatio') }}: <strong>{{ saltCrystResult.damageRatio.toFixed(2) }}×</strong></span>
                                <span style="color: #888;">{{ t('simulation.saltCryst.ofTensile') }}</span>
                            </div>
                            <div class="salt-damage-track">
                                <div class="salt-damage-fill" :style="{ width: Math.min(100, saltCrystResult.damageRatio / 4 * 100) + '%', background: saltCrystResult.damageRatio < 0.5 ? '#10b981' : saltCrystResult.damageRatio < 1.5 ? '#f59e0b' : '#ef4444' }"></div>
                            </div>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 8px;">
                            {{ t('simulation.saltCryst.threshold', { drh: saltCrystResult.DRH.toFixed(0) }) }}
                            <span v-if="saltCrystResult.isCrystallizing" style="color: #ef4444; font-weight: 600;"> ({{ t('simulation.saltCryst.crystallizing') }})</span>
                            <span v-else style="color: #10b981; font-weight: 600;"> ({{ t('simulation.saltCryst.dissolved') }})</span>
                        </div>
                        <span class="deterioration-badge" style="margin-top: 8px;" :style="{ background: saltCrystResult.label === 'critical' ? '#ef4444' : saltCrystResult.label === 'high' ? '#f59e0b' : saltCrystResult.label === 'moderate' ? '#eab308' : '#10b981', color: 'white' }">{{ saltCrystResult.label }}</span>
                        <div class="salt-note">
                            <strong>ℹ️ Note:</strong> This value is the <em>instantaneous</em> crystallisation pressure from Correns' equation (P = RT/V<sub>m</sub> · ln(DRH/RH)). Pressure is highest when RH ≪ DRH because supersaturation drives crystal growth against pore walls. <strong>Real heritage damage requires RH cycling</strong> across the DRH threshold (dissolution ⇄ recrystallisation events), which this steady-state model does not capture. A constantly dry environment shows high static pressure but little ongoing damage; a fluctuating one near DRH is far more destructive in practice.
                        </div>
                    </div>
                    <button class="config-toggle-btn" style="margin-top: 8px; width: 100%;" @click="showConfig.saltCryst = !showConfig.saltCryst">{{ showConfig.saltCryst ? '▼' : '▶' }} {{ t('simulation.params.configure') }}</button>
                    <div v-if="showConfig.saltCryst" class="param-config">
                        <div class="param-config-grid">
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.Vm') }}</label><input type="number" v-model.number="saltCrystParams.Vm" step="0.00001" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.DRH_ref') }}</label><input type="number" v-model.number="saltCrystParams.DRH_ref" step="0.1" min="0" max="100" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.DRH_slope') }}</label><input type="number" v-model.number="saltCrystParams.DRH_slope" step="0.01" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.tensileStrength') }}</label><input type="number" v-model.number="saltCrystParams.tensileStrength" step="0.5" min="0.1" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.cyclesPerYear') }}</label><input type="number" v-model.number="saltCrystParams.cyclesPerYear" step="10" min="1" /></div>
                            <div class="param-field"><label>{{ t('simulation.params.saltCryst.T_ref') }}</label><input type="number" v-model.number="saltCrystParams.T_ref" step="1" /></div>
                        </div>
                        <button class="param-reset-btn" @click="resetModelParams('saltCryst')">{{ t('simulation.params.resetDefaults') }}</button>
                    </div>
                </div>

                <!-- ═══ HYGRO-MECHANICAL FATIGUE TAB ═══ -->
                <div v-if="activeTab === 'fatigue'" class="sim-tab-content">
                    <div class="sim-tab-controls">
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">🌡️ Temperature</span>
                                <span class="sim-compact-value">{{ temperature.toFixed(1) }}°{{ temperatureUnit }}</span>
                            </div>
                            <input type="range" v-model.number="temperature" :min="temperatureUnit === 'C' ? -10 : 14" :max="temperatureUnit === 'C' ? 40 : 104" step="0.5" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">💧 Mean RH</span>
                                <span class="sim-compact-value">{{ humidity.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="humidity" min="10" max="90" step="1" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">📈 RH Cycle Amplitude (±)</span>
                                <span class="sim-compact-value">{{ simRHAmplitude.toFixed(0) }}%</span>
                            </div>
                            <input type="range" v-model.number="simRHAmplitude" min="0" max="40" step="1" class="simulation-slider" />
                        </div>
                        <div class="sim-compact-control">
                            <div class="sim-compact-control-header">
                                <span class="sim-compact-label">⏱️ Exposure</span>
                                <span class="sim-compact-value">{{ simYears }} yr</span>
                            </div>
                            <input type="range" v-model.number="simYears" min="0" max="200" step="1" class="simulation-slider" />
                        </div>
                    </div>
                    <div class="sim-tab-result">
                        <div class="sim-result-main" :style="{ color: fatigueResult.label === 'critical' ? '#ef4444' : fatigueResult.label === 'high' ? '#f59e0b' : fatigueResult.label === 'moderate' ? '#eab308' : '#10b981' }">
                            D = {{ fatigueResult.cumulativeDamage.toFixed(2) }}
                        </div>
                        <div class="sim-result-sub">Cumulative fatigue damage (Miner's rule)</div>
                        <div style="margin-top: 8px; font-size: 11px; color: #666;">
                            <div>Stress: <strong>{{ fatigueResult.stress_MPa.toFixed(3) }} MPa</strong></div>
                            <div>Cycles applied: <strong>{{ fatigueResult.cyclesApplied.toLocaleString() }}</strong></div>
                            <div v-if="fatigueResult.cyclesToFailure">Cycles to failure: <strong>{{ fatigueResult.cyclesToFailure.toLocaleString() }}</strong></div>
                        </div>
                        <span class="deterioration-badge" style="margin-top: 8px;" :style="{ background: fatigueResult.label === 'critical' ? '#ef4444' : fatigueResult.label === 'high' ? '#f59e0b' : fatigueResult.label === 'moderate' ? '#eab308' : '#10b981', color: 'white' }">{{ fatigueResult.label }}</span>
                        <div class="salt-note" style="margin-top: 12px;">
                            <strong>ℹ️ Note:</strong> Damage D = 1 indicates first-crack onset; D ≥ 2 widespread cracking; D ≥ 3 severe flaking. Stress is driven by the RH cycle amplitude — even moderate RH swings can accumulate damage over decades. Buffer caves against daily/seasonal humidity swings to suppress this mechanism.
                        </div>
                    </div>
                    <button class="config-toggle-btn" style="margin-top: 8px; width: 100%;" @click="showConfig.fatigue = !showConfig.fatigue">{{ showConfig.fatigue ? '▼' : '▶' }} Params</button>
                    <div v-if="showConfig.fatigue" class="param-config">
                        <div class="param-config-grid">
                            <div class="param-field"><label>β_diff (/%RH)</label><input type="number" v-model.number="fatigueParams.beta_diff" step="0.0001" min="0" /></div>
                            <div class="param-field"><label>E (MPa)</label><input type="number" v-model.number="fatigueParams.E" step="100" min="1" /></div>
                            <div class="param-field"><label>σ_fail (MPa)</label><input type="number" v-model.number="fatigueParams.sigma_fail" step="0.5" min="0.1" /></div>
                            <div class="param-field"><label>Basquin b</label><input type="number" v-model.number="fatigueParams.basquin_b" step="0.5" min="1" max="20" /></div>
                            <div class="param-field"><label>Cycles / year</label><input type="number" v-model.number="fatigueParams.cyclesPerYear" step="1" min="1" /></div>
                        </div>
                        <button class="param-reset-btn" @click="resetModelParams('fatigue')">Reset defaults</button>
                    </div>
                </div>

                </div>
                <!-- ── /Models card ─────────────────────────────────── -->

                <!-- ── Advanced card ────────────────────────────────── -->
                <div class="sim-card">
                    <div class="sim-card-title">Advanced</div>

                    <!-- Quick Presets -->
                    <div class="control-group" style="margin-bottom: 16px;">
                        <label class="control-label" style="font-weight: 600; margin-bottom: 8px; display: block;">📊 Quick Presets:</label>
                        <select class="preset-select" v-model="selectedPreset" :disabled="busy" @change="onPresetChange($event)">
                            <option value="" disabled>Choose a preset…</option>
                            <option v-for="p in availablePresets" :key="p.key" :value="p.key">{{ p.label }} — {{ p.desc }}</option>
                        </select>
                    </div>

                    <!-- Exposure Time Control -->
                    <div class="simulation-control" style="margin-bottom: 16px;">
                        <div class="control-header">
                            <label class="control-label" style="font-weight: 600;">
                                ⏱️ Exposure Time
                            </label>
                            <div class="control-value-display">
                                {{ simYears }} years
                                <small style="font-weight: normal; color: #888;">
                                    ({{ Math.floor(getTotalDays() / 30.44) }} months / {{ getTotalDays().toFixed(0) }} days)
                                </small>
                            </div>
                        </div>
                        <input type="range" v-model.number="simYears"
                               min="0" max="200" step="1"
                               class="simulation-slider"
                               :disabled="false" />
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px;">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                            <span>200 years</span>
                        </div>
                    </div>

                    <!-- Simulation Speed -->
                    <div class="simulation-control" style="margin-top: 16px;">
                        <div class="control-header">
                            <label class="control-label">
                                ⚡ {{ t('simulation.speed') }}
                            </label>
                            <div class="control-value-display">
                                {{ simulationSpeed.toFixed(1) }}x
                                <small style="font-weight: normal; color: #888;">
                                    ({{ (simulationSpeed * 1).toFixed(0) }} days/sec)
                                </small>
                            </div>
                        </div>
                        <input
                            type="range"
                            v-model.number="simulationSpeed"
                            min="0.1"
                            max="20.0"
                            step="0.5"
                            class="simulation-slider"
                            :disabled="false"
                        />
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px;">
                            <span>0.1× (slow)</span>
                            <span>1× (1 day/sec)</span>
                            <span>20× (~1 year/18sec)</span>
                        </div>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
                            <button @click="simulationSpeed = 0.5" class="btn btn-xs" :disabled="false">0.5×</button>
                            <button @click="simulationSpeed = 1.0" class="btn btn-xs" :disabled="false">1×</button>
                            <button @click="simulationSpeed = 5.0" class="btn btn-xs" :disabled="false">5×</button>
                            <button @click="simulationSpeed = 10.0" class="btn btn-xs" :disabled="false">10×</button>
                            <button @click="simulationSpeed = 20.0" class="btn btn-xs" :disabled="false">20×</button>
                        </div>
                    </div>

                    <!-- Scientific Metrics -->
                    <div class="simulation-info" style="margin-top: 16px;">
                        <p><strong>⚗️ Scientific Metrics</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 12px; line-height: 1.6;">
                            <li><strong>Rate constant:</strong> {{ calculateRateConstant(temperatureCelsius, humidity, simLight).toExponential(3) }} /day</li>
                            <li><strong>Scientific degradation:</strong> {{ chemicalResult.scientificDegradation.toFixed(1) }}%</li>
                            <li><strong>Visual amplification:</strong> 10× for demonstration</li>
                            <li><strong>Color remaining:</strong> {{ (chemicalResult.degradationFactor * 100).toFixed(1) }}%</li>
                            <li><strong>Kelvin temperature:</strong> {{ temperatureK.toFixed(2) }} K</li>
                            <li><strong>Lifetime multiplier:</strong> {{ lifetimeResult.multiplier.toFixed(3) }}×</li>
                            <li><strong>Mould index:</strong> {{ displayMouldIndex.toFixed(2) }} / 6 (RH_crit: {{ mouldResult.rhCritical }}%)</li>
                            <li><strong>Salt pressure:</strong> {{ saltCrystResult.pressure_MPa.toFixed(2) }} MPa (DRH: {{ saltCrystResult.DRH }}%, ratio: {{ saltCrystResult.damageRatio }}×)</li>
                        </ul>
                    </div>

                    <!-- Time Series Chart -->
                    <div v-if="timeSeriesData.length > 0" class="simulation-chart" style="margin-top: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <p style="margin: 0; font-weight: 600; font-size: 12px;">📈 Environmental History</p>
                            <button @click="clearHistory" class="btn btn-xs" style="font-size: 10px;">Clear</button>
                        </div>
                        <div style="position: relative; height: 200px; background: white; border-radius: 8px; padding: 8px;">
                            <canvas ref="timeSeriesCanvas"></canvas>
                        </div>
                        <p style="font-size: 10px; color: #888; margin-top: 4px; text-align: center;">
                            {{ timeSeriesData.length }} data points
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `
};
