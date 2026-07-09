/**
 * Simulation Panel
 * UI for environmental simulation: sliders bind to SimulationEngine state,
 * results render from engine.assessmentResults. Chart rendering and the
 * °C/°F unit toggle live here; deterioration state, the assess API,
 * presets, playback, and the time series have moved to
 * frontend/services/SimulationEngine.js. ModelViewer reads
 * SimulationEngine.renderCommand directly — no event chain through this
 * component.
 */
import { useI18n } from '../i18n.js';
import * as Sim from '../services/SimulationEngine.js';

const { ref, reactive, computed, watch, onMounted, onBeforeUnmount, toRefs, nextTick } = Vue;

export default {
    name: 'SimulationPanel',
    props: {
        entity: { type: Object, default: null },
        pixelData: { type: Object, default: null },
        textureProcessing: { type: Boolean, default: false }
    },
    emits: ['reset-texture', 'busy-changed'],
    setup(props, { emit }) {
        const { t } = useI18n();

        // ── UI-only state (not in engine) ─────────────────────────────────
        const temperatureUnit = ref('C');
        const showConfig = reactive({ chemical: false, lifetime: false, mould: false, saltCryst: false, fatigue: false });
        const timeSeriesCanvas = ref(null);
        let chartInstance = null;

        // ── Engine bindings exposed to the template ───────────────────────
        const { temperature, humidity, simLight, simRHAmplitude } = toRefs(Sim.env);
        const { days: simDays, months: simMonths, years: simYears } = toRefs(Sim.exposure);

        // Reactive children of modelParams — template uses dotted access (chemicalParams.Ea_dark)
        const chemicalParams  = Sim.modelParams.chemical;
        const lifetimeParams  = Sim.modelParams.lifetime;
        const mouldParams     = Sim.modelParams.mould;
        const saltCrystParams = Sim.modelParams.saltCryst;
        const fatigueParams   = Sim.modelParams.fatigue;

        const enabledModels  = Sim.enabledModels;
        const activeTab      = Sim.activeTab;
        const selectedPreset = Sim.selectedPreset;
        const presetLoading  = Sim.presetLoading;

        const assessmentResults = Sim.assessmentResults;
        const isPlaying         = Sim.isPlaying;
        const simulationSpeed   = Sim.simulationSpeed;
        const history           = Sim.history;
        const availablePresets  = Sim.availablePresets;

        // ── UI-derived computeds (°C/°F, status labels, colours) ──────────
        const temperatureK = computed(() => {
            if (temperatureUnit.value === 'C') return temperature.value + 273.15;
            return (temperature.value - 32) * 5/9 + 273.15;
        });
        const temperatureCelsius = computed(() => {
            if (temperatureUnit.value === 'C') return temperature.value;
            return (temperature.value - 32) * 5/9;
        });
        const temperatureColor = computed(() => {
            const T = temperature.value;
            if (T < 10) return '#3b82f6';
            if (T < 20) return '#10b981';
            if (T < 25) return '#f59e0b';
            return '#ef4444';
        });
        const humidityColor = computed(() => {
            const H = humidity.value;
            if (H < 30) return '#ef4444';
            if (H < 40) return '#f59e0b';
            if (H < 60) return '#10b981';
            if (H < 70) return '#f59e0b';
            return '#ef4444';
        });
        const temperatureStatus = computed(() => {
            const T = temperature.value;
            if (T < 10) return t('simulation.status.tooCold');
            if (T < 18) return t('simulation.status.cold');
            if (T < 22) return t('simulation.status.optimal');
            if (T < 28) return t('simulation.status.warm');
            return t('simulation.status.tooHot');
        });
        const lightColor = computed(() => {
            const L = simLight.value;
            if (L <= 0) return '#6b7280';
            if (L <= 0.2) return '#10b981';
            if (L <= 5) return '#f59e0b';
            return '#ef4444';
        });
        const lightStatus = computed(() => {
            const L = simLight.value;
            if (L <= 0) return t('simulation.status.dark') || 'Dark storage';
            if (L <= 0.2) return t('simulation.status.museum') || 'Museum level';
            if (L <= 5) return t('simulation.status.moderate') || 'Moderate exposure';
            return t('simulation.status.excessive') || 'Excessive';
        });
        const humidityStatus = computed(() => {
            const H = humidity.value;
            if (H < 30) return t('simulation.status.tooDry');
            if (H < 40) return t('simulation.status.dry');
            if (H < 60) return t('simulation.status.optimal');
            if (H < 70) return t('simulation.status.humid');
            return t('simulation.status.tooHumid');
        });

        // ── Per-model result aliases ──────────────────────────────────────
        const chemicalResult    = computed(() => assessmentResults.value.chemical);
        const lifetimeResult    = computed(() => assessmentResults.value.lifetime);
        const mouldResult       = computed(() => assessmentResults.value.mould);
        const saltCrystResult   = computed(() => assessmentResults.value.saltCryst);
        const fatigueResult     = computed(() => assessmentResults.value.fatigue);
        const displayMouldIndex = computed(() => mouldResult.value.mouldIndex);
        const mouldStatusColor = computed(() => {
            const r = mouldResult.value;
            if (!r.isAboveThreshold && humidity.value < r.rhCritical - 5) return '#10b981';
            if (!r.isAboveThreshold) return '#f59e0b';
            return '#ef4444';
        });
        const mouldStatusLabel = computed(() => {
            const r = mouldResult.value;
            if (!r.isAboveThreshold && humidity.value < r.rhCritical - 5) return t('simulation.mould.safe');
            if (!r.isAboveThreshold) return t('simulation.mould.warning');
            return t('simulation.mould.active');
        });

        // ── Composite risk (paper Eq. composite) ──────────────────────────
        const COMPOSITE_LABELS = {
            chemical: 'Chemical fading', lifetime: 'Lifetime multiplier',
            mould: 'Mould growth', salt: 'Salt crystallisation', fatigue: 'Hygro-mech. fatigue'
        };
        const compositeResult = computed(() =>
            assessmentResults.value.composite || { value: 0, dominant: 'chemical', components: {} });
        const compositeColor = computed(() => {
            const v = compositeResult.value.value;
            if (v >= 0.6) return '#ef4444';   // red — high
            if (v >= 0.3) return '#f59e0b';   // amber — moderate
            return '#10b981';                 // green — low
        });
        const compositeBand = computed(() => {
            const v = compositeResult.value.value;
            if (v >= 0.6) return t('simulation.composite.high');
            if (v >= 0.3) return t('simulation.composite.moderate');
            return t('simulation.composite.low');
        });
        const compositeDominantLabel = computed(() =>
            COMPOSITE_LABELS[compositeResult.value.dominant] || compositeResult.value.dominant);
        const compositeRows = computed(() => {
            const c = compositeResult.value.components || {};
            const dom = compositeResult.value.dominant;
            return ['chemical', 'lifetime', 'mould', 'salt', 'fatigue'].map(k => ({
                key: k, label: COMPOSITE_LABELS[k], value: c[k] || 0, dominant: k === dom
            }));
        });
        // Per-zone spatial composite (Stage 1): base / torso / face.
        const compositeZones = computed(() => (Sim.compositeField.value || []).map(z => ({
            id: z.id,
            name: z.name,
            RH_local: z.RH_local,
            saltAvailability: z.saltAvailability,
            value: z.composite ? z.composite.value : 0,
            dominant: z.composite ? (COMPOSITE_LABELS[z.composite.dominant] || z.composite.dominant) : '',
            color: z.composite && z.composite.value >= 0.6 ? '#ef4444'
                 : z.composite && z.composite.value >= 0.3 ? '#f59e0b' : '#10b981'
        })));

        // ── Busy state ────────────────────────────────────────────────────
        const busy = computed(() => presetLoading.value || props.textureProcessing);
        watch(busy, v => emit('busy-changed', v));

        // ── Methods used from the template ────────────────────────────────
        function getTotalDays() { return Sim.totalDays.value; }
        function calculateRateConstant() { return assessmentResults.value.chemical.rateConstant; }

        function convertTemperature() {
            if (temperatureUnit.value === 'C') {
                temperature.value = (temperature.value * 9/5) + 32;
                temperatureUnit.value = 'F';
            } else {
                temperature.value = (temperature.value - 32) * 5/9;
                temperatureUnit.value = 'C';
            }
        }

        function clearHistory() {
            Sim.clearHistory();
            updateChart();
        }

        function toggleTimeProgression() { Sim.togglePlayback(); }

        function resetDefaults() {
            Sim.resetDefaults();
            temperatureUnit.value = 'C';
        }

        function resetModelParams(_modelName) { Sim.loadDefaults(); }

        async function onPresetChange(event) {
            const key = event.target.value;
            await Sim.applyPresetWithCancellation(key, {
                onResetTexture: () => emit('reset-texture'),
                isTextureProcessing: () => props.textureProcessing
            });
        }

        // Re-apply the currently-selected preset. Native <select> @change
        // doesn't fire when the user picks the same value twice, so picking
        // the same preset to "retry" after a transient state issue would
        // silently no-op. This handler bypasses that.
        async function reapplyPreset() {
            const key = selectedPreset.value;
            if (!key) return;
            await Sim.applyPresetWithCancellation(key, {
                onResetTexture: () => emit('reset-texture'),
                isTextureProcessing: () => props.textureProcessing
            });
        }

        function applyPreset(key) { Sim.applyPreset(key); }
        function toggleSimulation() { /* always-active in current UI */ }

        // ── Chart.js (DOM-coupled, stays in the panel) ───────────────────
        function initChart() {
            const canvas = timeSeriesCanvas.value;
            if (!canvas) return;
            chartInstance = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'Temperature (°C)',  data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', yAxisID: 'y',  tension: 0.4 },
                        { label: 'Humidity (% RH)',   data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', yAxisID: 'y',  tension: 0.4 },
                        { label: 'Light (klux)',      data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', yAxisID: 'y1', tension: 0.4 },
                        { label: 'Degradation (%)',   data: [], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', yAxisID: 'y2', tension: 0.4 },
                        { label: 'Mould Index (0-6)', data: [], borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', yAxisID: 'y3', tension: 0.4, borderDash: [5, 5] }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
                        title:  { display: true, text: 'Environmental Conditions Over Time', font: { size: 12 } }
                    },
                    scales: {
                        x:  { title: { display: true, text: 'Simulated Time (days)', font: { size: 10 } }, ticks: { font: { size: 9 } } },
                        y:  { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temp (°C) / Humidity (% RH)', font: { size: 10 } }, ticks: { font: { size: 9 } } },
                        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Light (klux)', font: { size: 10 } }, ticks: { font: { size: 9 } }, grid: { drawOnChartArea: false } },
                        y2: { type: 'linear', display: false, position: 'right', max: 100 },
                        y3: { type: 'linear', display: false, position: 'right', min: 0, max: 6 }
                    }
                }
            });
        }

        function updateChart() {
            if (!chartInstance) return;
            const series = history.value;
            chartInstance.data.labels = series.map(d => d.time.toFixed(0));
            chartInstance.data.datasets[0].data = series.map(d => d.temperature);
            chartInstance.data.datasets[1].data = series.map(d => d.humidity);
            chartInstance.data.datasets[2].data = series.map(d => d.light);
            chartInstance.data.datasets[3].data = series.map(d => d.degradation);
            chartInstance.data.datasets[4].data = series.map(d => d.mouldIndex);
            chartInstance.update('none');
        }

        watch(history, updateChart, { deep: true });

        // ── Lifecycle ─────────────────────────────────────────────────────
        onMounted(() => {
            Sim.loadDefaults();
            nextTick(initChart);
        });

        onBeforeUnmount(() => {
            Sim.stopPlayback();
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
        });

        return {
            t,
            // UI-only state
            temperatureUnit, showConfig, timeSeriesCanvas,
            // Engine bindings
            temperature, humidity, simLight, simRHAmplitude,
            simDays, simMonths, simYears,
            chemicalParams, lifetimeParams, mouldParams, saltCrystParams, fatigueParams,
            enabledModels, activeTab, selectedPreset, presetLoading,
            assessmentResults, isPlaying, simulationSpeed, availablePresets,
            // Computeds
            temperatureK, temperatureCelsius, temperatureColor, humidityColor,
            temperatureStatus, lightColor, lightStatus, humidityStatus,
            chemicalResult, lifetimeResult, mouldResult, saltCrystResult, fatigueResult,
            displayMouldIndex, mouldStatusColor, mouldStatusLabel, busy,
            compositeResult, compositeColor, compositeBand, compositeDominantLabel, compositeRows, compositeZones,
            // Template references engine.history as timeSeriesData (legacy name)
            timeSeriesData: history,
            // Methods
            getTotalDays, calculateRateConstant, convertTemperature,
            toggleTimeProgression, resetDefaults, resetModelParams,
            onPresetChange, reapplyPreset, applyPreset, toggleSimulation, clearHistory
        };
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
                        <option value="composite">🎯 Composite Risk (max of all five models)</option>
                    </select>

                <!-- ═══ CHEMICAL TAB ═══ -->
                <div v-if="activeTab === 'chemical'" class="sim-tab-content">
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
                    <div class="sim-tab-result">
                        <div class="sim-result-main" :style="{ color: chemicalResult.label === 'low' ? '#10b981' : chemicalResult.label === 'moderate' ? '#eab308' : '#ef4444' }">
                            {{ chemicalResult.scientificDegradation.toFixed(1) }}%
                        </div>
                        <div class="sim-result-sub">k = {{ chemicalResult.rateConstant.toExponential(2) }} /day</div>
                        <span class="deterioration-badge" :style="{ background: chemicalResult.label === 'critical' ? '#ef4444' : chemicalResult.label === 'high' ? '#f59e0b' : chemicalResult.label === 'moderate' ? '#eab308' : '#10b981', color: 'white' }">{{ chemicalResult.label }}</span>
                    </div>
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

                <!-- ═══ COMPOSITE TAB ═══ -->
                <div v-if="activeTab === 'composite'" class="sim-tab-content">
                    <div class="composite-summary" :style="{ borderLeft: '5px solid ' + compositeColor }">
                        <div class="composite-value" :style="{ color: compositeColor }">
                            {{ compositeResult.value.toFixed(2) }}
                        </div>
                        <div class="composite-meta">
                            <div class="composite-band">{{ compositeBand }}</div>
                            <div class="composite-dominant">Dominant: <strong>{{ compositeDominantLabel }}</strong></div>
                        </div>
                    </div>
                    <div class="composite-breakdown">
                        <div v-for="row in compositeRows" :key="row.key" class="composite-row">
                            <span class="composite-row-label" :class="{ 'is-dominant': row.dominant }">{{ row.label }}</span>
                            <span class="composite-bar-track">
                                <span class="composite-bar-fill"
                                      :style="{ width: (row.value * 100).toFixed(0) + '%', background: row.dominant ? compositeColor : '#9aa0a6' }"></span>
                            </span>
                            <span class="composite-row-value">{{ row.value.toFixed(2) }}</span>
                        </div>
                    </div>
                    <div v-if="compositeZones.length" class="composite-zones">
                        <div class="composite-zones-title">{{ t('simulation.composite.zonesTitle') }}</div>
                        <div v-for="z in compositeZones" :key="z.id" class="composite-zone-row">
                            <span class="composite-zone-name">{{ z.name }}</span>
                            <span class="composite-zone-badge" :style="{ background: z.color }">{{ z.value.toFixed(2) }}</span>
                            <span class="composite-zone-meta">RH {{ z.RH_local }}% · {{ z.dominant }}</span>
                        </div>
                        <p class="composite-note">{{ t('simulation.composite.zonesNote') }}</p>
                    </div>
                    <p class="composite-note">
                        {{ t('simulation.composite.note') }}
                    </p>
                </div>

                </div>
                <!-- ── /Models card ─────────────────────────────────── -->

                <!-- ── Advanced card ────────────────────────────────── -->
                <div class="sim-card">
                    <div class="sim-card-title">Advanced</div>

                    <!-- Quick Presets -->
                    <div class="control-group" style="margin-bottom: 16px;">
                        <label class="control-label" style="font-weight: 600; margin-bottom: 8px; display: block;">📊 Quick Presets:</label>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <select class="preset-select" v-model="selectedPreset" :disabled="busy" @change="onPresetChange($event)" style="flex: 1;">
                                <option value="" disabled>Choose a preset…</option>
                                <option v-for="p in availablePresets" :key="p.key" :value="p.key">{{ p.label }} — {{ p.desc }}</option>
                            </select>
                            <button class="btn btn-sm" :disabled="busy || !selectedPreset"
                                    @click="reapplyPreset"
                                    title="Re-apply the selected preset (re-runs the assessment + render)">
                                ↻
                            </button>
                        </div>
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
