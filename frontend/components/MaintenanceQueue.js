/**
 * Maintenance Queue (admin/conservator-only)
 *
 * Fleet-wide composite triage view. Each row is a heritage artifact scored
 * on: current cumulative damage, ETA to any threshold crossing, active
 * sensor anomalies, days since last inspection, and conservation status.
 *
 * Phase 4 of the Predictive Analytics Plan.
 */
import { useI18n } from '../i18n.js';
import StatusBadge from './StatusBadge.js';
import StatusCard from './StatusCard.js';

export default {
    name: 'MaintenanceQueue',
    components: { StatusBadge, StatusCard },
    emits: ['drill-in'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            rows: [],
            loading: false,
            error: null,
            expandedGid: null,
            tierFilter: 'all',   // all | critical | high | medium | low
            search: ''
        };
    },
    computed: {
        stats() {
            const counts = { critical: 0, high: 0, medium: 0, low: 0 };
            let anomalies = 0;
            for (const r of this.rows) {
                counts[r.priorityTier] = (counts[r.priorityTier] || 0) + 1;
                anomalies += r.anomalies || 0;
            }
            return { total: this.rows.length, counts, anomalies };
        },
        filtered() {
            const q = this.search.trim().toLowerCase();
            return this.rows.filter(r => {
                if (this.tierFilter !== 'all' && r.priorityTier !== this.tierFilter) return false;
                if (!q) return true;
                return (r.name || '').toLowerCase().includes(q)
                    || (r.gid || '').toLowerCase().includes(q)
                    || (r.type || '').toLowerCase().includes(q);
            });
        }
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            this.error = null;
            try {
                const res = await window.api.maintenance.queue();
                this.rows = res.data;
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
            }
        },
        /** Resolve a severity level to a CSS custom property name so the
         *  progress-bar fill picks up the shared severity tokens. */
        tierColorVar(tier) {
            const known = ['critical', 'high', 'medium', 'low', 'ok', 'info'].includes(tier);
            return known ? `var(--severity-${tier}-bg)` : 'var(--severity-neutral-bg)';
        },
        toggleExpand(gid) {
            this.expandedGid = this.expandedGid === gid ? null : gid;
        },
        pct(frac) {
            if (frac == null) return '—';
            return (frac * 100).toFixed(0) + '%';
        },
        fmtEtaDays(days, historicalDays) {
            if (days == null) return '—';
            const fromNow = days - historicalDays;
            if (fromNow <= 0) return 'crossed';
            const years = fromNow / 365.25;
            if (years < 1) return `${Math.round(fromNow)} d`;
            return `${years.toFixed(1)} y`;
        },
        nearestEta(row) {
            const f = row.forecast;
            if (!f || !f.etaDays) return null;
            const h = f.historicalDays || row.historicalDays || 0;
            const futures = Object.entries(f.etaDays)
                .filter(([, d]) => d != null && d - h > 0)
                .map(([k, d]) => ({ model: k, days: d - h }));
            if (futures.length === 0) return null;
            futures.sort((a, b) => a.days - b.days);
            return futures[0];
        },

        openArtifact3D(row) {
            if (!row || !row.gid || !row.type) return;
            this.$emit('drill-in', {
                gid: row.gid,
                type: row.type,
                caveGid: row.caveGid || null
            });
        },

        exportRowReport(row) {
            const jsPDF = window.jspdf && window.jspdf.jsPDF;
            if (!jsPDF) {
                alert('PDF library not loaded — reload the page and try again.');
                return;
            }
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();
            let y = 48;
            doc.setFontSize(16).setFont(undefined, 'bold');
            doc.text(`Maintenance report — ${row.name || row.gid}`, 40, y); y += 22;
            doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(100);
            doc.text(`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, 40, y); y += 18;
            doc.setTextColor(0);

            doc.setFontSize(11).setFont(undefined, 'bold');
            doc.text('Summary', 40, y); y += 16;
            doc.setFontSize(10).setFont(undefined, 'normal');
            const summary = [
                ['Type', row.type],
                ['GID', row.gid],
                ['Parent cave', row.caveGid || '—'],
                ['Priority tier', row.priorityTier],
                ['Composite score', row.score.toFixed(3)],
                ['Conservation status', row.conservationStatus || '—'],
                ['Sensors linked', String(row.sensors || 0)],
                ['Active anomalies', String(row.anomalies || 0)],
                ['Historical days observed', String(Math.round(row.historicalDays || 0))],
                ['Days since last inspection', row.daysSinceInspection != null ? Math.round(row.daysSinceInspection) : '—']
            ];
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Field', 'Value']],
                    body: summary,
                    startY: y,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [92, 61, 46] }
                });
                y = doc.lastAutoTable.finalY + 16;
            } else {
                for (const [k, v] of summary) { doc.text(`${k}: ${v}`, 40, y); y += 12; }
                y += 6;
            }

            // Current cumulative state
            if (row.cumulative) {
                doc.setFontSize(11).setFont(undefined, 'bold');
                doc.text('Current cumulative state', 40, y); y += 14;
                const c = row.cumulative;
                const cumRows = [
                    ['Chemical \u0394E*',      c.chemicalDeltaE.toFixed(2),        '/ 5.0'],
                    ['Mould index (VTT)',      c.mouldIndexFinal.toFixed(2),       '/ 6 (threshold 3)'],
                    ['Fatigue damage (Miner)', c.fatigueDamage.toFixed(3),         '/ 1.0'],
                    ['Salt cumulative',        c.saltCumulative.toFixed(3),        '/ 1.0'],
                    ['Equivalent reference-years', c.equivYears.toFixed(2),         '']
                ];
                if (doc.autoTable) {
                    doc.autoTable({
                        head: [['Model', 'Value', 'Threshold']],
                        body: cumRows, startY: y, theme: 'grid',
                        styles: { fontSize: 9 },
                        headStyles: { fillColor: [92, 61, 46] }
                    });
                    y = doc.lastAutoTable.finalY + 16;
                } else {
                    for (const r of cumRows) { doc.text(r.join('  '), 40, y); y += 12; }
                    y += 6;
                }
            }

            // Recommendations
            if (row.recommendations && row.recommendations.length > 0) {
                doc.setFontSize(11).setFont(undefined, 'bold');
                doc.text('Recommendations', 40, y); y += 14;
                doc.setFontSize(9).setFont(undefined, 'normal');
                for (const rec of row.recommendations) {
                    const lines = doc.splitTextToSize(`[${rec.priority.toUpperCase()}] ${rec.message}`, W - 80);
                    for (const ln of lines) {
                        if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 48; }
                        doc.text(ln, 40, y); y += 12;
                    }
                    y += 2;
                }
            }

            // Anomalies
            if (row.anomalyDetail && row.anomalyDetail.length > 0) {
                if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 48; }
                y += 8;
                doc.setFontSize(11).setFont(undefined, 'bold');
                doc.text('Active sensor anomalies', 40, y); y += 14;
                if (doc.autoTable) {
                    doc.autoTable({
                        head: [['Rule', 'Severity', 'Sensor', 'Message']],
                        body: row.anomalyDetail.map(a => [a.rule, a.severity, a.sensorName || '—', a.message || '']),
                        startY: y, theme: 'grid',
                        styles: { fontSize: 8, cellWidth: 'wrap' },
                        headStyles: { fillColor: [185, 28, 28] }
                    });
                }
            }

            doc.save(`maintenance-${row.gid}.pdf`);
        },

        exportQueueReport() {
            const jsPDF = window.jspdf && window.jspdf.jsPDF;
            if (!jsPDF) {
                alert('PDF library not loaded — reload the page and try again.');
                return;
            }
            const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
            let y = 40;
            doc.setFontSize(16).setFont(undefined, 'bold');
            doc.text('Maintenance queue — full fleet report', 40, y); y += 20;
            doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(100);
            doc.text(`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} · ${this.rows.length} artifacts scored`, 40, y);
            y += 16;
            doc.setTextColor(0);

            const body = this.filtered.map(r => [
                r.priorityTier,
                r.score.toFixed(2),
                r.name || r.gid,
                r.type,
                (r.indices.damage * 100).toFixed(0) + '%',
                this.nearestEta(r) ? this.fmtEtaDays(this.nearestEta(r).days + (r.historicalDays || 0), r.historicalDays || 0) : '—',
                String(r.anomalies || 0),
                r.conservationStatus || '—',
                (r.recommendations && r.recommendations[0]) ? r.recommendations[0].message : ''
            ]);
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Tier', 'Score', 'Artifact', 'Type', 'Damage', 'Nearest ETA', 'Anom.', 'Status', 'Top action']],
                    body,
                    startY: y,
                    theme: 'striped',
                    styles: { fontSize: 8, overflow: 'linebreak' },
                    headStyles: { fillColor: [92, 61, 46] },
                    columnStyles: { 8: { cellWidth: 260 } }
                });
            }
            doc.save(`maintenance-queue-${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    },
    template: `
        <div style="padding: 24px; max-width: 1600px; margin: 0 auto;">

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">{{ t('maintenance.title') }}</h2>
                <span style="flex: 1;"></span>
                <button class="btn btn-sm" @click="exportQueueReport" :disabled="loading || rows.length === 0" title="Export the full queue (respecting current filter) as PDF">{{ t('maintenance.exportPdf') }}</button>
                <button class="btn btn-sm" @click="load" :disabled="loading">{{ t('maintenance.refresh') }}</button>
            </div>

            <!-- Loading / error -->
            <div v-if="loading" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <div class="pigment-spinner" style="margin: 0 auto 12px;"></div>
                {{ t('maintenance.loading') }}
            </div>
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #dc2626; font-size: 13px;">
                {{ error }}
            </div>

            <!-- Stats row -->
            <div v-if="!loading && rows.length > 0" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px;">
                <status-card level="neutral" :title="t('maintenance.statTotal')" :value="stats.total"></status-card>
                <status-card level="critical" :title="t('maintenance.statCritical')" :value="stats.counts.critical || 0"
                             clickable :active="tierFilter==='critical'" @click="tierFilter='critical'"></status-card>
                <status-card level="high" :title="t('maintenance.statHigh')" :value="stats.counts.high || 0"
                             clickable :active="tierFilter==='high'" @click="tierFilter='high'"></status-card>
                <status-card level="medium" :title="t('maintenance.statMedium')" :value="stats.counts.medium || 0"
                             clickable :active="tierFilter==='medium'" @click="tierFilter='medium'"></status-card>
                <status-card level="low" :title="t('maintenance.statLow')" :value="stats.counts.low || 0"
                             clickable :active="tierFilter==='low'" @click="tierFilter='low'"></status-card>
                <status-card level="neutral" :title="t('maintenance.statAnomalies')" :value="stats.anomalies"></status-card>
            </div>

            <!-- Search + filter -->
            <div v-if="!loading && rows.length > 0" style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input v-model="search" :placeholder="t('maintenance.search')" class="form-input" style="flex: 1;" />
                <button v-if="tierFilter !== 'all'" class="btn btn-sm" @click="tierFilter='all'">{{ t('maintenance.clearFilter') }}</button>
            </div>

            <!-- Queue table -->
            <div v-if="!loading && rows.length > 0" class="sim-card" style="padding: 0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 2px solid #e5e5e5;">
                            <th style="text-align: left; padding: 10px;">{{ t('maintenance.colPriority') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('maintenance.colScore') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('maintenance.colArtifact') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('maintenance.colType') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('maintenance.colDamage') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('maintenance.colNearestEta') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('maintenance.colAnomalies') }}</th>
                            <th style="text-align: right; padding: 10px;">{{ t('maintenance.colHistory') }}</th>
                            <th style="text-align: left; padding: 10px;">{{ t('maintenance.colTopAction') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length === 0">
                            <td colspan="9" style="padding: 20px; text-align: center; color: var(--text-secondary); font-style: italic;">
                                {{ t('maintenance.noMatch') }}
                            </td>
                        </tr>
                        <template v-for="r in filtered" :key="r.gid">
                            <tr style="border-bottom: 1px solid #f0f0f0; cursor: pointer;" @click="toggleExpand(r.gid)">
                                <td style="padding: 8px 10px;">
                                    <status-badge :level="r.priorityTier" variant="dot" :label="r.priorityTier"></status-badge>
                                </td>
                                <td style="padding: 8px 10px; text-align: right; font-weight: 700;">{{ r.score.toFixed(2) }}</td>
                                <td style="padding: 8px 10px;">
                                    <div style="font-weight: 600;">{{ expandedGid === r.gid ? '▼' : '▶' }} {{ r.name }}</div>
                                    <div style="font-size: 10px; color: var(--text-secondary); font-family: monospace;">{{ r.gid }}</div>
                                </td>
                                <td style="padding: 8px 10px; color: var(--text-secondary);">{{ r.type }}</td>
                                <td style="padding: 8px 10px; text-align: right;">{{ pct(r.indices.damage) }}</td>
                                <td style="padding: 8px 10px; text-align: right; color: var(--text-secondary);">
                                    <template v-if="nearestEta(r)">
                                        <span style="font-weight: 600;">{{ fmtEtaDays(nearestEta(r).days + (r.historicalDays || 0), r.historicalDays || 0) }}</span>
                                        <span style="font-size: 10px;"> ({{ nearestEta(r).model.replace(/([A-Z])/g, ' $1').toLowerCase() }})</span>
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td style="padding: 8px 10px; text-align: right;">
                                    <span :class="r.anomalies > 0 ? 'text-severity-high' : 'text-muted'" :style="{ fontWeight: r.anomalies > 0 ? 700 : 400 }">
                                        {{ r.anomalies }}
                                    </span>
                                </td>
                                <td style="padding: 8px 10px; text-align: right; color: var(--text-secondary); font-size: 11px;">
                                    {{ (r.historicalDays / 365.25).toFixed(1) }} y
                                </td>
                                <td style="padding: 8px 10px; font-size: 11px; max-width: 360px;">
                                    <template v-if="r.recommendations && r.recommendations.length > 0">
                                        <status-badge :level="r.recommendations[0].priority" :label="r.recommendations[0].priority"></status-badge>
                                        <span style="margin-left: 6px;">{{ r.recommendations[0].message }}</span>
                                    </template>
                                </td>
                            </tr>
                            <!-- Expanded detail row -->
                            <tr v-if="expandedGid === r.gid">
                                <td colspan="9" style="padding: 16px 20px; background: #fafafa;">
                                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                        <button
                                            v-if="r.caveGid"
                                            class="btn btn-sm btn-primary"
                                            @click.stop="openArtifact3D(r)"
                                            title="Open the 3-D view for this artifact with the Prediction panel pre-selected"
                                        >{{ t('maintenance.openArtifact3D') }}</button>
                                        <button
                                            class="btn btn-sm"
                                            @click.stop="exportRowReport(r)"
                                            title="Export this artifact's maintenance summary as PDF"
                                        >{{ t('maintenance.exportPdf') }}</button>
                                        <span v-if="!r.caveGid" style="font-size: 11px; color: var(--text-secondary); align-self: center;">
                                            {{ t('maintenance.drillUnavailable') }}
                                        </span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

                                        <!-- Indices + recommendations -->
                                        <div>
                                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">{{ t('maintenance.scoreBreakdown') }}</div>
                                            <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 4px 10px; font-size: 12px; margin-bottom: 12px;">
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.currentDamage') }}</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.damage), background: tierColorVar(r.priorityTier), height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ pct(r.indices.damage) }}</span>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.etaUrgency') }}</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.eta), background: 'var(--severity-medium-bg)', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ pct(r.indices.eta) }}</span>
                                                <span style="color: var(--text-secondary);">Active anomalies</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.anomaly), background: 'var(--severity-high-bg)', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.anomalies }}</span>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.inspectionAge') }}</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.inspection), background: 'var(--severity-info-bg)', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.daysSinceInspection != null ? Math.round(r.daysSinceInspection) + ' d' : '—' }}</span>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.conservationStatusLabel') }}</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.status), background: '#8b5a3c', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.conservationStatus || '—' }}</span>
                                            </div>

                                            <div style="font-weight: 600; margin: 10px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">{{ t('maintenance.recommendations') }}</div>
                                            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6;">
                                                <li v-for="(rec, i) in r.recommendations" :key="i">
                                                    <status-badge :level="rec.priority" :label="rec.priority"></status-badge>
                                                    — {{ rec.message }}
                                                </li>
                                            </ul>
                                        </div>

                                        <!-- Cumulative + anomalies -->
                                        <div>
                                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">{{ t('maintenance.currentCumulativeState') }}</div>
                                            <div v-if="r.cumulative" style="display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 12px; margin-bottom: 12px;">
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.chemicalDeltaE') }}</span>
                                                <strong>{{ r.cumulative.chemicalDeltaE.toFixed(2) }}</strong>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.mouldIndex') }}</span>
                                                <strong>{{ r.cumulative.mouldIndexFinal.toFixed(2) }} {{ t('maintenance.mouldThreshold') }}</strong>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.fatigueDamage') }}</span>
                                                <strong>{{ r.cumulative.fatigueDamage.toFixed(3) }}</strong>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.saltCumulative') }}</span>
                                                <strong>{{ r.cumulative.saltCumulative.toFixed(3) }}</strong>
                                                <span style="color: var(--text-secondary);">{{ t('maintenance.equivYears') }}</span>
                                                <strong>{{ r.cumulative.equivYears.toFixed(2) }}</strong>
                                            </div>
                                            <div v-else style="font-size: 12px; color: var(--text-secondary); font-style: italic;">{{ t('maintenance.noCumulative') }}</div>

                                            <div v-if="r.anomalyDetail && r.anomalyDetail.length > 0" style="font-weight: 600; margin: 10px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">{{ t('maintenance.activeAnomalies') }}</div>
                                            <ul v-if="r.anomalyDetail && r.anomalyDetail.length > 0" style="margin: 0; padding-left: 18px; font-size: 11px; line-height: 1.5;">
                                                <li v-for="(a, i) in r.anomalyDetail" :key="i">
                                                    <status-badge :level="a.severity" :label="a.rule"></status-badge>
                                                    <span style="margin-left: 4px;">{{ a.sensorName }}: {{ a.message }}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Methodology note -->
            <div v-if="!loading" style="background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #5c4a1a; margin-top: 14px;">
                {{ t('maintenance.methodology') }}
            </div>
        </div>
    `
};
