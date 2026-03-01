/**
 * Simulation Panel Component
 * Manual component for environmental simulation
 * Allows users to configure temperature and relative humidity
 *
 * Uses DeteriorationEngine for scientific model calculations:
 *   - Chemical pigment fading (Arrhenius + first-order kinetics)
 *   - Michalski lifetime multiplier (Climate for Culture eLM)
 *   - VTT / Finnish mould growth model (Hukka & Viitanen 1999)
 *   - Salt crystallization pressure (Scherer 1999 / Steiger 2005)
 */
import { useI18n } from '../i18n.js';
import * as Engine from '../deterioration/DeteriorationEngine.js';

export default {
    name: 'SimulationPanel',
    props: {
        entity: {
            type: Object,
            default: null
        }
    },
    emits: ['simulation-changed'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            temperature: 20, // Celsius
            humidity: 50,    // Percentage
            isSimulating: false,
            isPlaying: false,    // Time progression play/pause
            showAdvanced: false,
            temperatureUnit: 'C', // C or F
            simulationSpeed: 1.0, // Multiplier for time-based effects
            // Deterioration simulation parameters
            simDays: 0,      // Exposure time in days
            simMonths: 0,    // Exposure time in months
            simYears: 0,     // Exposure time in years
            simLight: 0,     // Light intensity in klux
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
                saltCryst: true
            },
            // Model configuration (expandable)
            showConfig: { chemical: false, lifetime: false, mould: false, saltCryst: false },
            // Configurable model parameters (initialized from engine defaults)
            chemicalParams: { ...Engine.CHEMICAL_DEFAULTS },
            lifetimeParams: { ...Engine.LIFETIME_DEFAULTS },
            mouldParams: { ...Engine.MOULD_DEFAULTS },
            saltCrystParams: { ...Engine.SALT_DEFAULTS }
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
        humidityStatus() {
            if (this.humidity < 30) return this.t('simulation.status.tooDry');
            if (this.humidity < 40) return this.t('simulation.status.dry');
            if (this.humidity < 60) return this.t('simulation.status.optimal');
            if (this.humidity < 70) return this.t('simulation.status.humid');
            return this.t('simulation.status.tooHumid');
        },
        // ── Deterioration model results (computed, reactive) ────────────
        assessmentResults() {
            return Engine.assess({
                T_celsius: this.temperatureCelsius,
                RH_percent: this.humidity,
                light_klux: this.simLight,
                totalDays: this.getTotalDays(),
                prevMouldIndex: this.mouldIndex,
                chemicalParams: this.chemicalParams,
                lifetimeParams: this.lifetimeParams,
                mouldParams: this.mouldParams,
                saltCrystParams: this.saltCrystParams
            });
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
        }
    },
    watch: {
        temperature() { this.emitSimulation(); },
        humidity() { this.emitSimulation(); },
        simDays() { this.emitSimulation(); },
        simMonths() { this.emitSimulation(); },
        simYears() { this.emitSimulation(); },
        simLight() { this.emitSimulation(); },
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
        }
    },
    methods: {
        // Keep inline versions for template expressions that call them directly
        calculateRateConstant(T_celsius, RH_percent, light_klux) {
            return Engine.calculateRateConstant(T_celsius, RH_percent, light_klux, this.chemicalParams);
        },

        getTotalDays() {
            return this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);
        },

        emitSimulation() {
            if (!this.isSimulating) return;

            const results = this.assessmentResults;
            const totalDays = this.getTotalDays();

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
                    saltCryst: this.enabledModels.saltCryst ? results.saltCryst : null
                },
                timestamp: Date.now(),
                speed: this.simulationSpeed
            });
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
        },

        resetModelParams(model) {
            if (model === 'chemical') this.chemicalParams = { ...Engine.CHEMICAL_DEFAULTS };
            else if (model === 'lifetime') this.lifetimeParams = { ...Engine.LIFETIME_DEFAULTS };
            else if (model === 'mould') this.mouldParams = { ...Engine.MOULD_DEFAULTS };
            else if (model === 'saltCryst') this.saltCrystParams = { ...Engine.SALT_DEFAULTS };
        },

        applyPreset(preset) {
            const presets = {
                museum: { temp: 20, rh: 50, days: 0, months: 0, years: 100, light: 0.15 },
                oneYear: { temp: 25, rh: 60, days: 0, months: 0, years: 1, light: 10 },
                tenYears: { temp: 25, rh: 60, days: 0, months: 0, years: 10, light: 10 },
                poorStorage: { temp: 30, rh: 80, days: 0, months: 0, years: 50, light: 5 },
                extreme: { temp: 40, rh: 100, days: 0, months: 0, years: 10, light: 30 }
            };
            const p = presets[preset];
            if (p) {
                this.temperature = p.temp;
                this.humidity = p.rh;
                this.simDays = p.days;
                this.simMonths = p.months;
                this.simYears = p.years;
                this.simLight = p.light;
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

            // Update mould index incrementally (only if mould model enabled)
            if (this.enabledModels.mould) {
                const mouldResult = Engine.mouldGrowth(this.temperatureCelsius, this.humidity, 0, this.mouldIndex, this.mouldParams);
                this.mouldIndex = Math.max(0, Math.min(6, this.mouldIndex + mouldResult.growthRate * daysPerTick));
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
        this.$nextTick(() => { this.initChart(); });
    },

    beforeUnmount() {
        this.stopTimeProgression();
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    },

    template: `
        <div class="simulation-panel" :class="{ 'simulation-active': isSimulating }">
            <div class="simulation-header">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <h3 class="simulation-title">🧪 {{ t('simulation.title') }}</h3>
                    <button
                        @click="toggleSimulation"
                        class="btn btn-sm"
                        :class="isSimulating ? 'btn-danger' : 'btn-primary'">
                        {{ isSimulating ? t('simulation.stop') : t('simulation.start') }}
                    </button>
                    <button
                        @click="toggleTimeProgression"
                        class="btn btn-sm"
                        :class="isPlaying ? 'btn-warning' : 'btn-outline'"
                        :disabled="!isSimulating"
                        :title="isPlaying ? 'Pause time progression' : 'Play time progression'">
                        {{ isPlaying ? '⏸️ Pause' : '▶️ Play' }}
                    </button>
                    <button @click="resetDefaults" class="btn btn-sm btn-outline">
                        🔄 {{ t('simulation.reset') }}
                    </button>
                </div>
                <div v-if="isSimulating" style="font-size: 11px; color: #666; margin-top: 8px;">
                    ⏱️ Simulated: {{ getTotalDays().toFixed(1) }} days ({{ (getTotalDays() / 365.25).toFixed(2) }} years)
                    <span v-if="isPlaying" style="color: #f59e0b;"> ● PLAYING {{ simulationSpeed.toFixed(1) }}×</span>
                </div>
                <button @click="showAdvanced = !showAdvanced" class="btn btn-sm btn-outline">
                    {{ showAdvanced ? '▼' : '▶' }} {{ t('simulation.advanced') }}
                </button>
            </div>

            <div class="simulation-body">
                <!-- ── Deterioration Models Card ─────────────────────── -->
                <div v-if="isSimulating" class="deterioration-card" style="margin-top: 0;">
                    <div class="deterioration-card-header">
                        <span>📐 {{ t('simulation.modelsCard.title') }}</span>
                        <span style="font-size: 10px; color: #888; font-weight: normal;">
                            {{ [enabledModels.chemical, enabledModels.lifetime, enabledModels.mould, enabledModels.saltCryst].filter(Boolean).length }} / 4
                        </span>
                    </div>
                    <div class="deterioration-card-body" style="padding: 8px 12px;">
                        <label class="model-toggle-label" style="margin-bottom: 6px;">
                            <input type="checkbox" v-model="enabledModels.chemical" />
                            {{ t('simulation.models.chemical') }}
                        </label>
                        <label class="model-toggle-label" style="margin-bottom: 6px;">
                            <input type="checkbox" v-model="enabledModels.lifetime" />
                            {{ t('simulation.models.lifetime') }}
                        </label>
                        <label class="model-toggle-label" style="margin-bottom: 6px;">
                            <input type="checkbox" v-model="enabledModels.mould" />
                            {{ t('simulation.models.mould') }}
                        </label>
                        <label class="model-toggle-label">
                            <input type="checkbox" v-model="enabledModels.saltCryst" />
                            {{ t('simulation.models.saltCryst') }}
                        </label>
                    </div>
                </div>

                <!-- Temperature Control -->
                <div class="simulation-control">
                    <div class="control-header">
                        <label class="control-label">
                            🌡️ {{ t('simulation.temperature') }}
                            <span class="control-unit" @click="convertTemperature" style="cursor: pointer;" :title="t('simulation.clickToConvert')">
                                (°{{ temperatureUnit }})
                            </span>
                        </label>
                        <div class="control-value-display" :style="{ color: temperatureColor }">
                            {{ temperature.toFixed(1) }}°{{ temperatureUnit }}
                        </div>
                    </div>
                    <input
                        type="range"
                        v-model.number="temperature"
                        :min="temperatureUnit === 'C' ? -10 : 14"
                        :max="temperatureUnit === 'C' ? 40 : 104"
                        step="0.5"
                        class="simulation-slider"
                        :style="{ '--slider-color': temperatureColor }"
                        :disabled="!isSimulating"
                    />
                    <div class="control-status" :style="{ color: temperatureColor }">
                        {{ temperatureStatus }}
                    </div>
                </div>

                <!-- Humidity Control -->
                <div class="simulation-control">
                    <div class="control-header">
                        <label class="control-label">
                            💧 {{ t('simulation.humidity') }}
                            <span class="control-unit">(% RH)</span>
                        </label>
                        <div class="control-value-display" :style="{ color: humidityColor }">
                            {{ humidity.toFixed(0) }}%
                        </div>
                    </div>
                    <input
                        type="range"
                        v-model.number="humidity"
                        min="10"
                        max="90"
                        step="1"
                        class="simulation-slider"
                        :style="{ '--slider-color': humidityColor }"
                        :disabled="!isSimulating"
                    />
                    <div class="control-status" :style="{ color: humidityColor }">
                        {{ humidityStatus }}
                    </div>
                </div>

                <!-- ── Chemical Fading Card ──────────────────────────────── -->
                <div v-if="isSimulating && enabledModels.chemical" class="deterioration-card">
                    <div class="deterioration-card-header">
                        <span>⚗️ {{ t('simulation.models.chemical') }}</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="deterioration-badge" :style="{
                                background: chemicalResult.label === 'critical' ? '#ef4444' : chemicalResult.label === 'high' ? '#f59e0b' : chemicalResult.label === 'moderate' ? '#eab308' : '#10b981',
                                color: 'white'
                            }">{{ chemicalResult.label }}</span>
                            <button class="config-toggle-btn" @click="showConfig.chemical = !showConfig.chemical">
                                {{ t('simulation.params.configure') }}
                            </button>
                        </div>
                    </div>
                    <div class="deterioration-card-body" style="text-align: center;">
                        <div style="font-size: 22px; font-weight: 700; line-height: 1.2;"
                             :style="{ color: chemicalResult.label === 'low' ? '#10b981' : chemicalResult.label === 'moderate' ? '#eab308' : '#ef4444' }">
                            {{ chemicalResult.scientificDegradation.toFixed(1) }}%
                        </div>
                        <div style="font-size: 11px; color: #888; margin-top: 2px;">
                            k = {{ chemicalResult.rateConstant.toExponential(2) }} /day
                        </div>
                        <!-- Config Section -->
                        <div v-if="showConfig.chemical" class="param-config">
                            <div class="param-config-grid">
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.Ea_dark') }}</label>
                                    <input type="number" v-model.number="chemicalParams.Ea_dark" step="1000" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.Ea_light') }}</label>
                                    <input type="number" v-model.number="chemicalParams.Ea_light" step="1000" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.k0_dark') }}</label>
                                    <input type="number" v-model.number="chemicalParams.k0_dark" step="0.00001" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.k0_light') }}</label>
                                    <input type="number" v-model.number="chemicalParams.k0_light" step="0.0001" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.q') }}</label>
                                    <input type="number" v-model.number="chemicalParams.q" step="0.1" min="0" max="2" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.chemical.p') }}</label>
                                    <input type="number" v-model.number="chemicalParams.p" step="0.1" min="0" max="2" />
                                </div>
                            </div>
                            <button class="param-reset-btn" @click="resetModelParams('chemical')">{{ t('simulation.params.resetDefaults') }}</button>
                        </div>
                    </div>
                </div>

                <!-- ── Lifetime Multiplier Card ────────────────────────── -->
                <div v-if="isSimulating && enabledModels.lifetime" class="deterioration-card">
                    <div class="deterioration-card-header">
                        <span>⏳ {{ t('simulation.models.lifetime') }}</span>
                        <button class="config-toggle-btn" @click="showConfig.lifetime = !showConfig.lifetime">
                            {{ t('simulation.params.configure') }}
                        </button>
                    </div>
                    <div class="deterioration-card-body" style="text-align: center;">
                        <div class="lifetime-value" :style="{ color: lifetimeResult.color }">
                            {{ lifetimeResult.multiplier.toFixed(2) }}×
                        </div>
                        <div class="lifetime-label" :style="{ color: lifetimeResult.color }">
                            {{ lifetimeResult.label === 'longer' ? t('simulation.lifetime.longer') : t('simulation.lifetime.shorter') }}
                        </div>
                        <div style="font-size: 10px; color: #888; margin-top: 4px;">
                            {{ t('simulation.lifetime.reference') }}
                        </div>
                        <!-- Config Section -->
                        <div v-if="showConfig.lifetime" class="param-config">
                            <div class="param-config-grid">
                                <div class="param-field">
                                    <label>{{ t('simulation.params.lifetime.Ea') }}</label>
                                    <input type="number" v-model.number="lifetimeParams.Ea" step="1000" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.lifetime.n') }}</label>
                                    <input type="number" v-model.number="lifetimeParams.n" step="0.1" min="0" max="5" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.lifetime.T0') }}</label>
                                    <input type="number" v-model.number="lifetimeParams.T0" step="1" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.lifetime.RH0') }}</label>
                                    <input type="number" v-model.number="lifetimeParams.RH0" step="1" min="1" max="100" />
                                </div>
                            </div>
                            <button class="param-reset-btn" @click="resetModelParams('lifetime')">{{ t('simulation.params.resetDefaults') }}</button>
                        </div>
                    </div>
                </div>

                <!-- ── Mould Risk Card ─────────────────────────────────── -->
                <div v-if="isSimulating && enabledModels.mould" class="deterioration-card">
                    <div class="deterioration-card-header">
                        <span>🦠 {{ t('simulation.models.mould') }}</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="deterioration-badge" :style="{ background: mouldStatusColor, color: 'white' }">
                                {{ mouldStatusLabel }}
                            </span>
                            <button class="config-toggle-btn" @click="showConfig.mould = !showConfig.mould">
                                {{ t('simulation.params.configure') }}
                            </button>
                        </div>
                    </div>
                    <div class="deterioration-card-body">
                        <!-- Mould Index Gauge (0-6) -->
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                                <span>{{ t('simulation.mould.index') }}: <strong>{{ displayMouldIndex.toFixed(1) }}</strong> / 6</span>
                                <span style="color: #888;">{{ t('simulation.mould.scale.' + Math.min(6, Math.floor(displayMouldIndex))) }}</span>
                            </div>
                            <div class="mould-gauge-track">
                                <div
                                    class="mould-gauge-fill"
                                    :style="{
                                        width: (displayMouldIndex / 6 * 100) + '%',
                                        background: displayMouldIndex < 2 ? '#10b981' : displayMouldIndex < 4 ? '#f59e0b' : '#ef4444'
                                    }">
                                </div>
                                <div class="mould-gauge-labels">
                                    <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                                </div>
                            </div>
                        </div>
                        <!-- Threshold Info -->
                        <div style="font-size: 11px; color: #666;">
                            {{ t('simulation.mould.threshold', { rh: mouldResult.rhCritical.toFixed(0) }) }}
                            <span v-if="mouldResult.isAboveThreshold" style="color: #ef4444; font-weight: 600;">
                                ({{ t('simulation.mould.exceeded') }})
                            </span>
                        </div>
                        <!-- Config Section -->
                        <div v-if="showConfig.mould" class="param-config">
                            <div class="param-config-grid">
                                <div class="param-field">
                                    <label>{{ t('simulation.params.mould.growthCoeff') }}</label>
                                    <input type="number" v-model.number="mouldParams.growthCoeff" step="0.01" min="0" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.mould.declineRate') }}</label>
                                    <input type="number" v-model.number="mouldParams.declineRate" step="0.01" max="0" />
                                </div>
                            </div>
                            <button class="param-reset-btn" @click="resetModelParams('mould')">{{ t('simulation.params.resetDefaults') }}</button>
                        </div>
                    </div>
                </div>

                <!-- ── Salt Crystallization Card ────────────────────── -->
                <div v-if="isSimulating && enabledModels.saltCryst" class="deterioration-card">
                    <div class="deterioration-card-header">
                        <span>🧂 {{ t('simulation.models.saltCryst') }}</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="deterioration-badge" :style="{
                                background: saltCrystResult.label === 'critical' ? '#ef4444' : saltCrystResult.label === 'high' ? '#f59e0b' : saltCrystResult.label === 'moderate' ? '#eab308' : '#10b981',
                                color: 'white'
                            }">{{ saltCrystResult.label }}</span>
                            <button class="config-toggle-btn" @click="showConfig.saltCryst = !showConfig.saltCryst">
                                {{ t('simulation.params.configure') }}
                            </button>
                        </div>
                    </div>
                    <div class="deterioration-card-body">
                        <!-- Pressure display -->
                        <div style="text-align: center; margin-bottom: 8px;">
                            <div style="font-size: 22px; font-weight: 700; line-height: 1.2;"
                                 :style="{ color: saltCrystResult.damageRatio >= 1.5 ? '#ef4444' : saltCrystResult.damageRatio >= 0.5 ? '#f59e0b' : '#10b981' }">
                                {{ saltCrystResult.pressure_MPa.toFixed(1) }} MPa
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 2px;">
                                {{ t('simulation.saltCryst.pressure') }}
                            </div>
                        </div>
                        <!-- Damage gauge -->
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                                <span>{{ t('simulation.saltCryst.damageRatio') }}: <strong>{{ saltCrystResult.damageRatio.toFixed(2) }}×</strong></span>
                                <span style="color: #888;">{{ t('simulation.saltCryst.ofTensile') }}</span>
                            </div>
                            <div class="salt-damage-track">
                                <div class="salt-damage-fill" :style="{
                                    width: Math.min(100, saltCrystResult.damageRatio / 4 * 100) + '%',
                                    background: saltCrystResult.damageRatio < 0.5 ? '#10b981' : saltCrystResult.damageRatio < 1.5 ? '#f59e0b' : '#ef4444'
                                }"></div>
                            </div>
                        </div>
                        <!-- Threshold info -->
                        <div style="font-size: 11px; color: #666;">
                            {{ t('simulation.saltCryst.threshold', { drh: saltCrystResult.DRH.toFixed(0) }) }}
                            <span v-if="saltCrystResult.isCrystallizing" style="color: #ef4444; font-weight: 600;">
                                ({{ t('simulation.saltCryst.crystallizing') }})
                            </span>
                            <span v-else style="color: #10b981; font-weight: 600;">
                                ({{ t('simulation.saltCryst.dissolved') }})
                            </span>
                        </div>
                        <!-- Config Section -->
                        <div v-if="showConfig.saltCryst" class="param-config">
                            <div class="param-config-grid">
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.Vm') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.Vm" step="0.00001" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.DRH_ref') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.DRH_ref" step="0.1" min="0" max="100" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.DRH_slope') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.DRH_slope" step="0.01" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.tensileStrength') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.tensileStrength" step="0.5" min="0.1" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.cyclesPerYear') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.cyclesPerYear" step="10" min="1" />
                                </div>
                                <div class="param-field">
                                    <label>{{ t('simulation.params.saltCryst.T_ref') }}</label>
                                    <input type="number" v-model.number="saltCrystParams.T_ref" step="1" />
                                </div>
                            </div>
                            <button class="param-reset-btn" @click="resetModelParams('saltCryst')">{{ t('simulation.params.resetDefaults') }}</button>
                        </div>
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div v-if="showAdvanced" class="simulation-advanced">
                    <hr style="margin: 16px 0; border: none; border-top: 1px solid #e0e0e0;" />

                    <!-- Quick Presets -->
                    <div class="control-group" style="margin-bottom: 16px;">
                        <label class="control-label" style="font-weight: 600; margin-bottom: 8px; display: block;">📊 Quick Presets:</label>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button @click="applyPreset('museum')" class="btn btn-xs" :disabled="!isSimulating">Museum (100y)</button>
                            <button @click="applyPreset('oneYear')" class="btn btn-xs" :disabled="!isSimulating">1 Year</button>
                            <button @click="applyPreset('tenYears')" class="btn btn-xs" :disabled="!isSimulating">10 Years</button>
                            <button @click="applyPreset('poorStorage')" class="btn btn-xs" :disabled="!isSimulating">Poor Storage</button>
                            <button @click="applyPreset('extreme')" class="btn btn-xs" :disabled="!isSimulating">Extreme</button>
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
                               :disabled="!isSimulating" />
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px;">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                            <span>200 years</span>
                        </div>
                    </div>

                    <!-- Light Intensity -->
                    <div class="simulation-control">
                        <div class="control-header">
                            <label class="control-label">
                                💡 Light Intensity
                            </label>
                            <div class="control-value-display">
                                {{ simLight.toFixed(1) }} klux
                            </div>
                        </div>
                        <input
                            type="range"
                            v-model.number="simLight"
                            min="0"
                            max="50"
                            step="0.5"
                            class="simulation-slider"
                            :disabled="!isSimulating"
                        />
                        <div class="control-status" style="font-size: 11px; font-style: italic;">
                            0 = dark, 0.05-0.2 = museum, 10+ = excessive
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
                            :disabled="!isSimulating"
                        />
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px;">
                            <span>0.1× (slow)</span>
                            <span>1× (1 day/sec)</span>
                            <span>20× (~1 year/18sec)</span>
                        </div>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
                            <button @click="simulationSpeed = 0.5" class="btn btn-xs" :disabled="!isSimulating">0.5×</button>
                            <button @click="simulationSpeed = 1.0" class="btn btn-xs" :disabled="!isSimulating">1×</button>
                            <button @click="simulationSpeed = 5.0" class="btn btn-xs" :disabled="!isSimulating">5×</button>
                            <button @click="simulationSpeed = 10.0" class="btn btn-xs" :disabled="!isSimulating">10×</button>
                            <button @click="simulationSpeed = 20.0" class="btn btn-xs" :disabled="!isSimulating">20×</button>
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
