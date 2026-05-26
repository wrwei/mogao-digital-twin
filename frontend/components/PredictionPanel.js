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
import StatusBadge from './StatusBadge.js';

export default {
    name: 'PredictionPanel',
    components: { StatusBadge },
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
        },
        // Rule-based conservation recommendations (Bizot Green Protocol +
        // common conservation-science targets). Each rec is keyed to a model
        // so the worst-ETA model gets surfaced first; "ok" items are still
        // shown so the user knows what's holding the line.
        recommendations() {
            const c = this.result?.climateSummary;
            if (!c) return [];
            const status = this.modelStatus;
            const etaYears = (eta) => {
                if (typeof eta !== 'string') return Infinity;
                const m = eta.match(/in\s+([\d.]+)\s*y/);
                return m ? parseFloat(m[1]) : Infinity;
            };
            const worst = status
                .filter(m => m.eta && m.eta !== 'crossed')
                .map(m => ({ key: m.key, years: etaYears(m.eta) }))
                .sort((a, b) => a.years - b.years)[0];

            const recs = [];
            const f1 = v => (v != null ? v.toFixed(1) : '—');
            const pct = v => (v != null ? Math.round(v * 100) : '—');

            // ── Mean T (Arrhenius lever — chemical fading + lifetime) ────
            const targetTHigh = 22, targetTLow = 16;
            if (c.T?.mean != null) {
                if (c.T.mean > targetTHigh) {
                    recs.push({
                        level: 'warn', model: 'equivYears',
                        title: `Lower mean T below ${targetTHigh}°C`,
                        current: `${f1(c.T.mean)}°C`,
                        action: `Chemical aging roughly doubles every +10°C (Arrhenius). Drop the HVAC setpoint or improve thermal mass.`
                    });
                } else if (c.T.mean < targetTLow) {
                    recs.push({
                        level: 'info', model: 'equivYears',
                        title: `T is cooler than the Bizot band (${targetTLow}–${targetTHigh}°C)`,
                        current: `${f1(c.T.mean)}°C`,
                        action: `Cool conditions slow chemical decay — keep them, but ensure RH doesn't drift up as T drops.`
                    });
                } else {
                    recs.push({
                        level: 'ok', model: 'equivYears',
                        title: 'Mean T within target',
                        current: `${f1(c.T.mean)}°C (target ${targetTLow}–${targetTHigh}°C)`,
                        action: 'Hold the current setpoint.'
                    });
                }
            }

            // ── Mean RH (Bizot 40–60 %) ──────────────────────────────────
            const rhLow = 40, rhHigh = 60;
            if (c.RH?.mean != null) {
                if (c.RH.mean > rhHigh) {
                    recs.push({
                        level: 'warn', model: 'mouldIndex',
                        title: `Reduce mean RH below ${rhHigh}%`,
                        current: `${f1(c.RH.mean)}%`,
                        action: `Above ~65% the VTT mould model engages. Add desiccation or improve ventilation.`
                    });
                } else if (c.RH.mean < rhLow) {
                    recs.push({
                        level: 'warn', model: 'fatigueDamage',
                        title: `Raise mean RH to at least ${rhLow}%`,
                        current: `${f1(c.RH.mean)}%`,
                        action: `Sustained <40% RH embrittles organic binders. Add a humidifier or passive water reservoir.`
                    });
                } else {
                    recs.push({
                        level: 'ok', model: 'mouldIndex',
                        title: 'Mean RH within Bizot band',
                        current: `${f1(c.RH.mean)}% (target ${rhLow}–${rhHigh}%)`,
                        action: 'Maintain.'
                    });
                }
            }

            // ── Daily RH amplitude (fatigue lever) ───────────────────────
            const dRHTarget = 5;
            if (c.deltaRH?.mean != null) {
                if (c.deltaRH.mean > dRHTarget) {
                    recs.push({
                        level: 'warn', model: 'fatigueDamage',
                        title: `Dampen daily ΔRH below ${dRHTarget}%`,
                        current: `mean ${f1(c.deltaRH.mean)}% / day, peak ${f1(c.deltaRH.max)}%`,
                        action: `Hygro-mechanical fatigue is driven by daily RH swing. Add passive RH-buffering (silica/Art Sorb) or tighten the HVAC deadband.`
                    });
                } else {
                    recs.push({
                        level: 'ok', model: 'fatigueDamage',
                        title: 'Daily RH swing within target',
                        current: `${f1(c.deltaRH.mean)}% / day (target <${dRHTarget}%)`,
                        action: 'Buffering is doing its job.'
                    });
                }
            }

            // ── Salt cycling (DRH-band crossings) ────────────────────────
            if (c.pctDaysDRHCrossing != null) {
                const p = c.pctDaysDRHCrossing;
                if (p > 0.05) {
                    recs.push({
                        level: 'warn', model: 'saltCumulative',
                        title: `Keep RH bounded away from the 65–80% DRH band`,
                        current: `${pct(p)}% of days crossed`,
                        action: `Soluble salts crystallise/deliquesce across ~65–80% RH. Pick a setpoint clearly below (≤60%) or above (≥85%) the band; don't let daily swings straddle it.`
                    });
                } else {
                    recs.push({
                        level: 'ok', model: 'saltCumulative',
                        title: 'RH stays clear of the DRH band',
                        current: `${pct(p)}% of days crossed`,
                        action: 'No salt cycling pressure.'
                    });
                }
            }

            // Pull the worst-ETA model's rec to the front so the user sees
            // the most urgent lever first; ties broken by original order.
            if (worst) {
                recs.sort((a, b) => {
                    const aPri = (a.model === worst.key && a.level === 'warn') ? -1 : 0;
                    const bPri = (b.model === worst.key && b.level === 'warn') ? -1 : 0;
                    return aPri - bPri;
                });
            }
            return recs;
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

        /** Map a (current / threshold) ratio onto the shared severity-token
         *  level used by StatusCard. */
        tierLevel(current, threshold) {
            if (threshold == null) return 'neutral';
            const frac = current / threshold;
            if (frac >= 1)    return 'critical';
            if (frac >= 0.66) return 'high';
            if (frac >= 0.33) return 'medium';
            return 'ok';
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
            // Wrap in Vue.markRaw — see LiveDataPanel.drawChart for the
            // rationale. Without it Chart.js + Vue 3's reactive proxy enter
            // a circular toRaw recursion.
            this.chart = Vue.markRaw(new Chart(canvas, {
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
            }));
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
                <span style="font-size: 13px; font-weight: 500; color: #555;">{{ t('prediction.runningReplay') }}</span>
            </div>

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 18px;">🔮</span>
                <span style="font-weight: 600; font-size: 14px;">{{ t('prediction.title') }}</span>
                <span v-if="historicalDays > 0" style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                    {{ t('prediction.historyDuration', { days: historicalDays, years: historicalYears }) }}
                </span>
            </div>

            <!-- No sensors / no data -->
            <div v-if="!loading && !hasSensors" style="background: var(--severity-medium-soft); border-left: 3px solid var(--severity-medium-bg); padding: 10px 12px; border-radius: 6px; font-size: 12px; color: var(--severity-medium-soft-fg);">
                {{ t('prediction.noSensors') }}
            </div>
            <div v-else-if="!loading && historicalDays === 0" style="background: var(--severity-medium-soft); border-left: 3px solid var(--severity-medium-bg); padding: 10px 12px; border-radius: 6px; font-size: 12px; color: var(--severity-medium-soft-fg);">
                {{ t('prediction.noSamples') }}
            </div>

            <!-- Error -->
            <div v-if="error" style="background: var(--severity-high-soft); border: 1px solid var(--severity-high-bg); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 12px; color: var(--severity-high-soft-fg);">
                {{ error }}
            </div>

            <!-- Per-model status cards (severity-token-driven accent) -->
            <div v-if="cum" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 14px;">
                <div v-for="m in modelStatus" :key="m.key"
                     class="status-card"
                     :data-level="tierLevel(m.current, m.threshold)">
                    <div class="status-card-title">{{ m.icon }} {{ m.label }}</div>
                    <div class="status-card-value">
                        <span>{{ fmtNum(m.current) }}</span>
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 400;">{{ m.unit }}</span>
                    </div>
                    <div v-if="m.threshold != null" class="status-card-meta">
                        {{ t('prediction.ofThreshold', { threshold: fmtNum(m.threshold) }) }}
                    </div>
                    <div v-if="m.eta" style="margin-top: 4px;">
                        <status-badge v-if="m.eta === 'crossed'" level="critical" variant="solid" label="already crossed" icon="⚠"></status-badge>
                        <status-badge v-else level="medium" variant="soft" :label="'ETA: ' + m.eta"></status-badge>
                    </div>
                </div>
            </div>

            <!-- Conservation actions -->
            <div v-if="cum && recommendations.length" style="background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 600;">
                    <span>🛠</span>
                    <span>Conservation actions</span>
                    <span style="font-size: 10px; color: var(--text-secondary); font-weight: 400; margin-left: auto;">
                        Targets:
                        <a href="https://en.wikipedia.org/wiki/Bizot_Group"
                           target="_blank" rel="noopener"
                           style="color: inherit; text-decoration: underline;">Bizot Green Protocol (2014)</a>
                    </span>
                </div>
                <div v-for="(r, idx) in recommendations" :key="idx"
                     :style="{
                        display: 'grid',
                        gridTemplateColumns: '20px 1fr',
                        gap: '8px',
                        padding: '8px 10px',
                        marginBottom: '6px',
                        borderRadius: '6px',
                        background: r.level === 'warn' ? 'var(--severity-high-soft, #fef2f2)'
                                  : r.level === 'info' ? 'var(--severity-medium-soft, #fffbeb)'
                                  : 'var(--severity-low-soft, #f0fdf4)',
                        borderLeft: '3px solid ' + (r.level === 'warn' ? '#dc2626' : r.level === 'info' ? '#d97706' : '#16a34a'),
                        fontSize: '12px'
                     }">
                    <div style="font-size: 14px;">{{ r.level === 'warn' ? '⚠' : r.level === 'info' ? 'ℹ' : '✓' }}</div>
                    <div>
                        <div style="font-weight: 600;">{{ r.title }}</div>
                        <div style="color: var(--text-secondary); margin: 2px 0;">Currently {{ r.current }}.</div>
                        <div>{{ r.action }}</div>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div v-if="cum" style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px; font-size: 12px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" v-model="withForecast" :disabled="busy" />
                    {{ t('prediction.forecastForward') }}
                </label>
                <div v-if="withForecast">
                    <label style="display: block; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">{{ t('prediction.horizon') }}</label>
                    <select v-model.number="forecastMaxYears" :disabled="busy" class="preset-select" style="padding: 4px 8px; font-size: 12px;" @change="refresh">
                        <option :value="10">{{ t('prediction.years10') }}</option>
                        <option :value="50">{{ t('prediction.years50') }}</option>
                        <option :value="200">{{ t('prediction.years200') }}</option>
                    </select>
                </div>
                <button @click="refresh" class="btn btn-xs" :disabled="busy" style="align-self: flex-end;">{{ t('prediction.refresh') }}</button>
                <button @click="exportReport" class="btn btn-xs" :disabled="busy || !cum" style="align-self: flex-end;" title="Export this prediction (tables + chart) as PDF">{{ t('prediction.exportPdf') }}</button>
            </div>

            <!-- Chart -->
            <div v-if="cum" style="position: relative; height: 220px; background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
                <canvas ref="chartCanvas"></canvas>
            </div>

            <!-- Methodology note -->
            <div v-if="cum" style="background: var(--severity-medium-soft); border-left: 3px solid var(--severity-medium-bg); border-radius: 6px; padding: 8px 12px; font-size: 11px; color: var(--severity-medium-soft-fg);">
                <strong>ℹ Method:</strong> historical replay integrates the five models day-by-day through the
                actual monitored T/RH/ΔRH record. Forecast (dashed) projects forward by looping the most recent
                year of climate — a defensible baseline when no external climate forecast is available.
                Thresholds: ΔE*=5, mould=3/6, D=1, salt-cum=1.
            </div>
        </div>
    `
};
