/**
 * Simulation Panel Component
 * Manual component for environmental simulation
 * Allows users to configure temperature and relative humidity
 */
import { useI18n } from '../i18n.js';

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
            // Time progression
            simulationTimer: null,
            timeSeriesData: [],  // Historical data points
            chartInstance: null,
            maxDataPoints: 100,   // Limit chart data for performance
            isApplyingTexture: false  // For notification
        };
    },
    computed: {
        temperatureK() {
            // Convert to Kelvin for storage
            if (this.temperatureUnit === 'C') {
                return this.temperature + 273.15;
            } else {
                return (this.temperature - 32) * 5/9 + 273.15;
            }
        },
        temperatureColor() {
            // Visual feedback based on temperature
            if (this.temperature < 10) return '#3b82f6'; // Cold - blue
            if (this.temperature < 20) return '#10b981'; // Cool - green
            if (this.temperature < 25) return '#f59e0b'; // Warm - orange
            return '#ef4444'; // Hot - red
        },
        humidityColor() {
            // Visual feedback based on humidity
            if (this.humidity < 30) return '#ef4444'; // Too dry - red
            if (this.humidity < 40) return '#f59e0b'; // Dry - orange
            if (this.humidity < 60) return '#10b981'; // Optimal - green
            if (this.humidity < 70) return '#f59e0b'; // Humid - orange
            return '#ef4444'; // Too humid - red
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
        }
    },
    watch: {
        temperature(newVal) {
            this.emitSimulation();
        },
        humidity(newVal) {
            this.emitSimulation();
        },
        simDays() { this.emitSimulation(); },
        simMonths() { this.emitSimulation(); },
        simYears() { this.emitSimulation(); },
        simLight() { this.emitSimulation(); }
    },
    methods: {
        /**
         * Strlič dose-response framework: Calculate moisture content
         */
        calculateMoistureContent(RH_fraction, T_kelvin) {
            const RH_safe = Math.min(Math.max(RH_fraction, 0.01), 0.999);
            const numerator = Math.log(1 - RH_safe);
            const denominator = 1.67 * T_kelvin - 285.655;
            const base = Math.abs(numerator / denominator);
            const exponent = 1 / (2.491 - 0.012 * T_kelvin);
            return Math.pow(base, exponent);
        },

        /**
         * Calculate degradation rate constant
         */
        calculateRateConstant(T_celsius, RH_percent, light_klux) {
            const T_kelvin = T_celsius + 273.15;
            const RH_fraction = RH_percent / 100.0;
            const R = 8.314;
            const Ea_dark = 70000;
            const Ea_light = 25000;
            const k0_dark = 0.0001;
            const k0_light = 0.001;
            const q = 0.8;
            const p = 0.9;

            const H2O = this.calculateMoistureContent(RH_fraction, T_kelvin);
            const k_dark = k0_dark * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_dark / (R * T_kelvin));
            const k_light = light_klux > 0
                ? k0_light * Math.pow(light_klux, p) * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_light / (R * T_kelvin))
                : 0;

            return k_dark + k_light;
        },

        /**
         * Get total exposure time in days
         */
        getTotalDays() {
            return this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);
        },

        emitSimulation() {
            if (!this.isSimulating) return;

            const rateConstant = this.calculateRateConstant(this.temperature, this.humidity, this.simLight);
            const totalDays = this.getTotalDays();
            const degradationFactor = Math.exp(-rateConstant * totalDays);

            this.$emit('simulation-changed', {
                temperature: {
                    value: this.temperatureK,
                    unit: 'K',
                    celsius: this.temperature
                },
                humidity: {
                    value: this.humidity,
                    unit: 'RH'
                },
                deterioration: {
                    days: this.simDays,
                    months: this.simMonths,
                    years: this.simYears,
                    lightIntensity: this.simLight,
                    totalDays: totalDays,
                    rateConstant: rateConstant,
                    degradationFactor: degradationFactor,
                    scientificDegradation: (1 - degradationFactor) * 100
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
        },

        /**
         * Apply preset scenario
         */
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
            }
        },
        convertTemperature() {
            if (this.temperatureUnit === 'C') {
                // Convert to Fahrenheit
                this.temperature = (this.temperature * 9/5) + 32;
                this.temperatureUnit = 'F';
            } else {
                // Convert to Celsius
                this.temperature = (this.temperature - 32) * 5/9;
                this.temperatureUnit = 'C';
            }
        },

        /**
         * Time Progression System
         */
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

            // Tick every 100ms (10 times per second)
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
            // Increment time based on simulation speed
            // 1 day of simulation per second at 1× speed
            const daysPerTick = (this.simulationSpeed * 1.0) / 10; // 0.1 days per tick at 1× speed

            this.simDays += daysPerTick;

            // Normalize days into months/years
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

            // Record data every second (10 ticks)
            if (Math.random() < 0.1) {
                this.recordDataPoint();
            }
        },

        recordDataPoint() {
            const totalDays = this.getTotalDays();
            const rateConstant = this.calculateRateConstant(this.temperature, this.humidity, this.simLight);
            const degradationFactor = Math.exp(-rateConstant * totalDays);

            const dataPoint = {
                time: totalDays,
                temperature: this.temperature,
                humidity: this.humidity,
                light: this.simLight,
                degradation: (1 - degradationFactor) * 100
            };

            this.timeSeriesData.push(dataPoint);

            // Limit data points for performance
            if (this.timeSeriesData.length > this.maxDataPoints) {
                this.timeSeriesData.shift();
            }

            this.updateChart();
        },

        /**
         * Chart.js Integration
         */
        initChart() {
            const canvas = this.$refs.timeSeriesCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            this.chartInstance = new Chart(ctx, {
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
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                font: { size: 10 }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Environmental Conditions Over Time',
                            font: { size: 12 }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Simulated Time (days)',
                                font: { size: 10 }
                            },
                            ticks: { font: { size: 9 } }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Temp (°C) / Humidity (% RH)',
                                font: { size: 10 }
                            },
                            ticks: { font: { size: 9 } }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Light (klux)',
                                font: { size: 10 }
                            },
                            ticks: { font: { size: 9 } },
                            grid: {
                                drawOnChartArea: false
                            }
                        },
                        y2: {
                            type: 'linear',
                            display: false,
                            position: 'right',
                            max: 100
                        }
                    }
                }
            });
        },

        updateChart() {
            if (!this.chartInstance) return;

            const labels = this.timeSeriesData.map(d => d.time.toFixed(0));
            const tempData = this.timeSeriesData.map(d => d.temperature);
            const humidityData = this.timeSeriesData.map(d => d.humidity);
            const lightData = this.timeSeriesData.map(d => d.light);
            const degradationData = this.timeSeriesData.map(d => d.degradation);

            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = tempData;
            this.chartInstance.data.datasets[1].data = humidityData;
            this.chartInstance.data.datasets[2].data = lightData;
            this.chartInstance.data.datasets[3].data = degradationData;

            this.chartInstance.update('none'); // No animation for performance
        },

        clearHistory() {
            this.timeSeriesData = [];
            this.updateChart();
        }
    },

    mounted() {
        // Initialize Chart.js
        this.$nextTick(() => {
            this.initChart();
        });
    },

    beforeUnmount() {
        // Cleanup
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

                    <!-- Exposure Time Controls -->
                    <div class="control-group" style="margin-bottom: 16px;">
                        <label class="control-label" style="font-weight: 600;">
                            ⏱️ Exposure Time: {{ getTotalDays().toFixed(0) }} days
                            <small style="font-weight: normal;">({{ (getTotalDays() / 365.25).toFixed(1) }} years)</small>
                        </label>

                        <label class="control-label" style="font-size: 12px; margin-top: 8px; font-weight: normal;">
                            Days: {{ simDays }}
                            <input type="range" v-model.number="simDays"
                                   min="0" max="365" step="1"
                                   class="simulation-slider"
                                   :disabled="!isSimulating" />
                        </label>

                        <label class="control-label" style="font-size: 12px; font-weight: normal;">
                            Months: {{ simMonths }}
                            <input type="range" v-model.number="simMonths"
                                   min="0" max="24" step="1"
                                   class="simulation-slider"
                                   :disabled="!isSimulating" />
                        </label>

                        <label class="control-label" style="font-size: 12px; font-weight: normal;">
                            Years: {{ simYears }}
                            <input type="range" v-model.number="simYears"
                                   min="0" max="200" step="5"
                                   class="simulation-slider"
                                   :disabled="!isSimulating" />
                        </label>
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
                            <li><strong>Rate constant:</strong> {{ calculateRateConstant(temperature, humidity, simLight).toExponential(3) }} /day</li>
                            <li><strong>Scientific degradation:</strong> {{ (100 * (1 - Math.exp(-calculateRateConstant(temperature, humidity, simLight) * getTotalDays()))).toFixed(1) }}%</li>
                            <li><strong>Visual amplification:</strong> 10× for demonstration</li>
                            <li><strong>Color remaining:</strong> {{ (100 * Math.exp(-calculateRateConstant(temperature, humidity, simLight) * getTotalDays())).toFixed(1) }}%</li>
                            <li><strong>Kelvin temperature:</strong> {{ temperatureK.toFixed(2) }} K</li>
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
