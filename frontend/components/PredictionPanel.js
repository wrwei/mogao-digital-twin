/**
 * Prediction Panel
 * Historical replay + threshold-crossing forecast for the current artifact.
 *
 * Wires to GET /exhibits/:gid/deterioration/replay?forecast=true
 * and renders:
 *   - Summary cards: cumulative damage state per model
 *   - Threshold status grid: current value / threshold / ETA
 *   - Trajectory chart: each model's cumulative state over time, plus
 *     the forward-projected continuation
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'PredictionPanel',
    props: {
        entity: { type: Object, default: null }
    },
    emits: ['busy-changed'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            loading: false,
            error: null,
            result: null,                 // server response
            withForecast: true,
            forecastMaxYears: 50,
            chart: null
        };
    },
    computed: {
        busy() { return this.loading; },
        cum()  { return this.result?.cumulative || null; },
        crossed() { return this.result?.thresholdsCrossed || null; },
        forecast() { return this.result?.forecast || null; },
        historicalDays() { return this.result?.historicalDays || 0; },
        historicalYears() { return (this.historicalDays / 365.25).toFixed(2); },
        thresholds() { return this.result?.thresholds || {}; },
        hasSensors() { return (this.result?.sensors || []).length > 0; },
        // Per-model current status
        modelStatus() {
            if (!this.cum) return [];
            const t = this.thresholds;
            const etaDays = this.forecast?.etaDays || {};
            const fmtEta = d => {
                if (d == null) return null;
                const fromStart = d - this.historicalDays;
                if (fromStart < 0) return 'crossed';
                const years = fromStart / 365.25;
                if (years < 1) return `in ${Math.round(fromStart)} days`;
                return `in ${years.toFixed(1)} y`;
            };
            return [
                {
                    key: 'chemicalDeltaE',
                    label: 'Chemical fading',
                    icon: '⚗️',
                    current: this.cum.chemicalDeltaE,
                    unit: 'ΔE*',
                    threshold: t.chemicalDeltaE,
                    eta: fmtEta(etaDays.chemicalDeltaE),
                    color: '#f59e0b'
                },
                {
                    key: 'mouldIndex',
                    label: 'Mould index',
                    icon: '🦠',
                    current: this.cum.mouldIndexFinal,
                    unit: '/ 6',
                    threshold: t.mouldIndex,
                    eta: fmtEta(etaDays.mouldIndex),
                    color: '#10b981'
                },
                {
                    key: 'fatigueDamage',
                    label: 'Fatigue damage',
                    icon: '🧱',
                    current: this.cum.fatigueDamage,
                    unit: 'D',
                    threshold: t.fatigueDamage,
                    eta: fmtEta(etaDays.fatigueDamage),
                    color: '#8b5a3c'
                },
                {
                    key: 'saltCumulative',
                    label: 'Salt cumulative',
                    icon: '🧂',
                    current: this.cum.saltCumulative,
                    unit: '',
                    threshold: t.saltCumulative,
                    eta: fmtEta(etaDays.saltCumulative),
                    color: '#64748b'
                },
                {
                    key: 'equivYears',
                    label: 'Lifetime consumed',
                    icon: '⏳',
                    current: this.cum.equivYears,
                    unit: 'ref-y',
                    threshold: null,
                    eta: null,
                    color: '#3b82f6'
                }
            ];
        }
    },
    watch: {
        entity() { this.refresh(); },
        withForecast() { this.refresh(); },
        busy(v) { this.$emit('busy-changed', v); }
    },
    mounted() { this.refresh(); },
    beforeUnmount() {
        if (this.chart) { this.chart.destroy(); this.chart = null; }
    },
    methods: {
        async refresh() {
            if (!this.entity?.gid) return;
            this.loading = true;
            this.error = null;
            try {
                const params = {
                    forecast: this.withForecast ? 'true' : 'false',
                    maxYears: this.forecastMaxYears
                };
                const res = await window.api.exhibits.replayDeterioration(this.entity.gid, params);
                this.result = res.data;
                this.$nextTick(() => this.drawChart());
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },

        fmtNum(n, digits = 3) {
            if (n == null || isNaN(n)) return '—';
            if (Math.abs(n) < 1e-3 && n !== 0) return n.toExponential(2);
            return n.toFixed(digits);
        },

        tierColor(current, threshold) {
            if (threshold == null) return '#6b7280';
            const frac = current / threshold;
            if (frac >= 1) return '#ef4444';
            if (frac >= 0.66) return '#f59e0b';
            if (frac >= 0.33) return '#eab308';
            return '#10b981';
        },

        drawChart() {
            const canvas = this.$refs.chartCanvas;
            if (!canvas || !this.result?.trajectory) return;

            const hist = this.result.trajectory;
            const proj = this.forecast?.projection || [];
            const all = [...hist, ...proj];
            const labels = all.map(p => p.date);
            // Normalise everything to a 0-1 "fraction of threshold" scale
            const t = this.thresholds;
            const chemFrac = all.map(p => (p.cum?.chemicalDeltaE ?? 0) / t.chemicalDeltaE);
            const mouldFrac = all.map(p => (p.cum?.mouldIndex ?? 0) / t.mouldIndex);
            const fatFrac = all.map(p => (p.cum?.fatigueDamage ?? 0) / t.fatigueDamage);
            const saltFrac = all.map(p => (p.cum?.saltCumulative ?? 0) / t.saltCumulative);

            // Mark the boundary between history and forecast
            const historyEnd = hist.length;

            const makeDataset = (label, data, color, dashed) => ({
                label,
                data,
                borderColor: color,
                backgroundColor: color + '22',
                tension: 0.2,
                pointRadius: 0,
                borderWidth: 1.7,
                borderDash: dashed ? [4, 3] : undefined
            });

            const datasets = [
                makeDataset('⚗️ Chemical',  chemFrac,  '#f59e0b', false),
                makeDataset('🦠 Mould',      mouldFrac, '#10b981', false),
                makeDataset('🧱 Fatigue',    fatFrac,   '#8b5a3c', false),
                makeDataset('🧂 Salt',       saltFrac,  '#64748b', false)
            ];

            if (this.chart) {
                this.chart.data.labels = labels;
                this.chart.data.datasets.forEach((ds, i) => { ds.data = datasets[i].data; });
                this.chart.options.plugins.annotation = this._annotations(historyEnd);
                this.chart.update('none');
                return;
            }
            this.chart = new Chart(canvas, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
                        tooltip: { enabled: true }
                    },
                    scales: {
                        x: { display: true, ticks: { maxTicksLimit: 8, font: { size: 10 } }, grid: { display: false } },
                        y: {
                            title: { display: true, text: 'Fraction of threshold', font: { size: 11 } },
                            min: 0,
                            suggestedMax: 1.2,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });
        },

        _annotations(historyEnd) { return {}; },

        exportReport() {
            const jsPDF = window.jspdf && window.jspdf.jsPDF;
            if (!jsPDF) {
                alert('PDF library not loaded — reload the page and try again.');
                return;
            }
            if (!this.result) return;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            let y = 48;
            const name = this.entity?.name || this.entity?.gid || '—';
            doc.setFontSize(16).setFont(undefined, 'bold');
            doc.text(`Prediction report — ${name}`, 40, y); y += 22;
            doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(100);
            doc.text(`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, 40, y); y += 14;
            doc.text(`Monitored history: ${this.historicalDays} days (${this.historicalYears} y) · Forecast horizon: ${this.withForecast ? this.forecastMaxYears + ' y (climate-repeat)' : 'off'}`, 40, y); y += 18;
            doc.setTextColor(0);

            // Current cumulative table
            const rows = this.modelStatus.map(m => [
                m.label,
                this.fmtNum(m.current) + (m.unit ? ' ' + m.unit : ''),
                m.threshold != null ? this.fmtNum(m.threshold) : '—',
                m.eta || '—'
            ]);
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Model', 'Current', 'Threshold', 'ETA']],
                    body: rows, startY: y, theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [92, 61, 46] }
                });
                y = doc.lastAutoTable.finalY + 16;
            }

            // Trajectory chart image
            const canvas = this.$refs.chartCanvas;
            if (canvas) {
                try {
                    const img = canvas.toDataURL('image/png');
                    const imgW = W - 80;
                    const imgH = imgW * canvas.height / canvas.width;
                    if (y + imgH > H - 60) { doc.addPage(); y = 48; }
                    doc.setFontSize(11).setFont(undefined, 'bold');
                    doc.text('Trajectory (fraction of threshold)', 40, y); y += 14;
                    doc.addImage(img, 'PNG', 40, y, imgW, imgH);
                    y += imgH + 10;
                } catch (_) { /* chart export best-effort */ }
            }

            // Methodology note
            if (y > H - 100) { doc.addPage(); y = 48; }
            doc.setFontSize(9).setFont(undefined, 'italic').setTextColor(90);
            const note = 'Method: historical replay integrates five deterioration models day-by-day through the ' +
                'monitored T/RH/DeltaRH record. Forecast projects forward by looping the most recent year of ' +
                'climate. Thresholds: chemical DeltaE*=5, mould index=3/6, fatigue D=1, salt-cum=1.';
            const noteLines = doc.splitTextToSize(note, W - 80);
            for (const ln of noteLines) { doc.text(ln, 40, y); y += 11; }

            const safeName = (this.entity?.gid || 'artifact').replace(/[^a-z0-9_-]/gi, '_');
            doc.save(`prediction-${safeName}.pdf`);
        }
    },
    template: `
        <div class="prediction-panel" style="padding: 16px 20px; background: white; border-radius: 12px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative;">

            <!-- Loading overlay -->
            <div v-if="busy" style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); border-radius: 12px; z-index: 20; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div class="pigment-spinner"></div>
                <span style="font-size: 13px; font-weight: 500; color: #555;">Running replay…</span>
            </div>

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 18px;">🔮</span>
                <span style="font-weight: 600; font-size: 14px;">Prediction</span>
                <span v-if="historicalDays > 0" style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                    {{ historicalDays }} days ({{ historicalYears }} y) of monitored history
                </span>
            </div>

            <!-- No sensors / no data -->
            <div v-if="!loading && !hasSensors" style="background: #fff8e8; border-left: 3px solid #f59e0b; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #5c4a1a;">
                No sensors linked to this artifact. Link one in the Live Data panel to enable prediction.
            </div>
            <div v-else-if="!loading && historicalDays === 0" style="background: #fff8e8; border-left: 3px solid #f59e0b; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #5c4a1a;">
                No sensor samples ingested yet for this artifact.
            </div>

            <!-- Error -->
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: #dc2626;">
                {{ error }}
            </div>

            <!-- Status cards -->
            <div v-if="cum" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 14px;">
                <div v-for="m in modelStatus" :key="m.key"
                     :style="{ background: '#fafafa', borderRadius: '8px', padding: '10px', borderLeft: '4px solid ' + tierColor(m.current, m.threshold) }">
                    <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                        {{ m.icon }} {{ m.label }}
                    </div>
                    <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">
                        {{ fmtNum(m.current) }}
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 400;">{{ m.unit }}</span>
                    </div>
                    <div v-if="m.threshold != null" style="font-size: 10px; color: var(--text-secondary);">
                        of {{ fmtNum(m.threshold) }} threshold
                    </div>
                    <div v-if="m.eta" style="font-size: 10px; margin-top: 3px; font-weight: 600;" :style="{ color: m.eta === 'crossed' ? '#dc2626' : '#f59e0b' }">
                        {{ m.eta === 'crossed' ? '⚠ already crossed' : 'ETA: ' + m.eta }}
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div v-if="cum" style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px; font-size: 12px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" v-model="withForecast" :disabled="busy" />
                    Forecast forward (climate-repeat)
                </label>
                <div v-if="withForecast">
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Horizon</label>
                    <select v-model.number="forecastMaxYears" :disabled="busy" class="preset-select" style="padding: 4px 8px; font-size: 12px;" @change="refresh">
                        <option :value="10">10 years</option>
                        <option :value="50">50 years</option>
                        <option :value="200">200 years</option>
                    </select>
                </div>
                <button @click="refresh" class="btn btn-xs" :disabled="busy" style="align-self: flex-end;">↻ Refresh</button>
                <button @click="exportReport" class="btn btn-xs" :disabled="busy || !cum" style="align-self: flex-end;" title="Export this prediction (tables + chart) as PDF">📄 Export PDF</button>
            </div>

            <!-- Chart -->
            <div v-if="cum" style="position: relative; height: 220px; background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
                <canvas ref="chartCanvas"></canvas>
            </div>

            <!-- Methodology note -->
            <div v-if="cum" style="background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #5c4a1a;">
                <strong>ℹ Method:</strong> historical replay integrates the five models day-by-day through the
                actual monitored T/RH/ΔRH record. Forecast (dashed) projects forward by looping the most recent
                year of climate — a defensible baseline when no external climate forecast is available.
                Thresholds: ΔE*=5, mould=3/6, D=1, salt-cum=1.
            </div>
        </div>
    `
};
