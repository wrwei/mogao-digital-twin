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

export default {
    name: 'MaintenanceQueue',
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
        tierColor(tier) {
            return { critical: '#ef4444', high: '#f59e0b', medium: '#eab308', low: '#10b981' }[tier] || '#6b7280';
        },
        priorityLabel(p) {
            return { critical: '⚠ Critical', high: '🔶 High', medium: '◆ Medium', low: '✓ Low', info: 'ℹ Info' }[p] || p;
        },
        priorityColor(p) {
            return { critical: '#991b1b', high: '#b45309', medium: '#a16207', low: '#065f46', info: '#374151' }[p] || '#374151';
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
        }
    },
    template: `
        <div style="padding: 24px; max-width: 1600px; margin: 0 auto;">

            <!-- Header -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">🔧 Maintenance Queue</h2>
                <span style="flex: 1;"></span>
                <button class="btn btn-sm" @click="load" :disabled="loading">↻ Refresh</button>
            </div>

            <!-- Loading / error -->
            <div v-if="loading" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <div class="pigment-spinner" style="margin: 0 auto 12px;"></div>
                Scoring all artifacts… (runs a full deterioration replay for each)
            </div>
            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #dc2626; font-size: 13px;">
                {{ error }}
            </div>

            <!-- Stats row -->
            <div v-if="!loading && rows.length > 0" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px;">
                <div class="stat-card" style="padding: 12px;">
                    <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Total</div>
                    <div style="font-size: 24px; font-weight: 700;">{{ stats.total }}</div>
                </div>
                <div class="stat-card" @click="tierFilter='critical'" style="padding: 12px; cursor: pointer;" :style="tierFilter==='critical' ? 'outline: 2px solid #ef4444;' : ''">
                    <div style="font-size: 11px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Critical</div>
                    <div style="font-size: 24px; font-weight: 700; color: #ef4444;">{{ stats.counts.critical || 0 }}</div>
                </div>
                <div class="stat-card" @click="tierFilter='high'" style="padding: 12px; cursor: pointer;" :style="tierFilter==='high' ? 'outline: 2px solid #f59e0b;' : ''">
                    <div style="font-size: 11px; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">High</div>
                    <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">{{ stats.counts.high || 0 }}</div>
                </div>
                <div class="stat-card" @click="tierFilter='medium'" style="padding: 12px; cursor: pointer;" :style="tierFilter==='medium' ? 'outline: 2px solid #eab308;' : ''">
                    <div style="font-size: 11px; color: #a16207; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Medium</div>
                    <div style="font-size: 24px; font-weight: 700; color: #a16207;">{{ stats.counts.medium || 0 }}</div>
                </div>
                <div class="stat-card" @click="tierFilter='low'" style="padding: 12px; cursor: pointer;" :style="tierFilter==='low' ? 'outline: 2px solid #10b981;' : ''">
                    <div style="font-size: 11px; color: #10b981; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Low</div>
                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">{{ stats.counts.low || 0 }}</div>
                </div>
                <div class="stat-card" style="padding: 12px;">
                    <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Active anomalies</div>
                    <div style="font-size: 24px; font-weight: 700;">{{ stats.anomalies }}</div>
                </div>
            </div>

            <!-- Search + filter -->
            <div v-if="!loading && rows.length > 0" style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input v-model="search" placeholder="Search by name, gid or type…" class="form-input" style="flex: 1;" />
                <button v-if="tierFilter !== 'all'" class="btn btn-sm" @click="tierFilter='all'">Clear filter</button>
            </div>

            <!-- Queue table -->
            <div v-if="!loading && rows.length > 0" class="sim-card" style="padding: 0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 2px solid #e5e5e5;">
                            <th style="text-align: left; padding: 10px;">Priority</th>
                            <th style="text-align: right; padding: 10px;">Score</th>
                            <th style="text-align: left; padding: 10px;">Artifact</th>
                            <th style="text-align: left; padding: 10px;">Type</th>
                            <th style="text-align: right; padding: 10px;">Damage</th>
                            <th style="text-align: right; padding: 10px;">Nearest ETA</th>
                            <th style="text-align: right; padding: 10px;">Anomalies</th>
                            <th style="text-align: right; padding: 10px;">Hist.</th>
                            <th style="text-align: left; padding: 10px;">Top action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length === 0">
                            <td colspan="9" style="padding: 20px; text-align: center; color: var(--text-secondary); font-style: italic;">
                                No artifacts match the filter.
                            </td>
                        </tr>
                        <template v-for="r in filtered" :key="r.gid">
                            <tr style="border-bottom: 1px solid #f0f0f0; cursor: pointer;" @click="toggleExpand(r.gid)">
                                <td style="padding: 8px 10px;">
                                    <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: tierColor(r.priorityTier) }">
                                        <span :style="{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: tierColor(r.priorityTier) }"></span>
                                        {{ r.priorityTier }}
                                    </span>
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
                                    <span :style="{ color: r.anomalies > 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: r.anomalies > 0 ? 700 : 400 }">
                                        {{ r.anomalies }}
                                    </span>
                                </td>
                                <td style="padding: 8px 10px; text-align: right; color: var(--text-secondary); font-size: 11px;">
                                    {{ (r.historicalDays / 365.25).toFixed(1) }} y
                                </td>
                                <td style="padding: 8px 10px; font-size: 11px; max-width: 360px;">
                                    <template v-if="r.recommendations && r.recommendations.length > 0">
                                        <span :style="{ color: priorityColor(r.recommendations[0].priority), fontWeight: 600 }">
                                            {{ priorityLabel(r.recommendations[0].priority) }}
                                        </span>
                                        {{ r.recommendations[0].message }}
                                    </template>
                                </td>
                            </tr>
                            <!-- Expanded detail row -->
                            <tr v-if="expandedGid === r.gid">
                                <td colspan="9" style="padding: 16px 20px; background: #fafafa;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

                                        <!-- Indices + recommendations -->
                                        <div>
                                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Score breakdown</div>
                                            <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 4px 10px; font-size: 12px; margin-bottom: 12px;">
                                                <span style="color: var(--text-secondary);">Current damage</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.damage), background: tierColor(r.priorityTier), height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ pct(r.indices.damage) }}</span>
                                                <span style="color: var(--text-secondary);">ETA urgency</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.eta), background: '#f59e0b', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ pct(r.indices.eta) }}</span>
                                                <span style="color: var(--text-secondary);">Active anomalies</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.anomaly), background: '#ef4444', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.anomalies }}</span>
                                                <span style="color: var(--text-secondary);">Inspection age</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.inspection), background: '#3b82f6', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.daysSinceInspection != null ? Math.round(r.daysSinceInspection) + ' d' : '—' }}</span>
                                                <span style="color: var(--text-secondary);">Conservation status</span>
                                                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; align-self: center; position: relative;">
                                                    <div :style="{ width: pct(r.indices.status), background: '#8b5a3c', height: '100%', borderRadius: '4px' }"></div>
                                                </div>
                                                <span>{{ r.conservationStatus || '—' }}</span>
                                            </div>

                                            <div style="font-weight: 600; margin: 10px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Recommendations</div>
                                            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6;">
                                                <li v-for="(rec, i) in r.recommendations" :key="i">
                                                    <span :style="{ color: priorityColor(rec.priority), fontWeight: 600 }">
                                                        {{ priorityLabel(rec.priority) }}
                                                    </span>
                                                    — {{ rec.message }}
                                                </li>
                                            </ul>
                                        </div>

                                        <!-- Cumulative + anomalies -->
                                        <div>
                                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Current cumulative state</div>
                                            <div v-if="r.cumulative" style="display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 12px; margin-bottom: 12px;">
                                                <span style="color: var(--text-secondary);">⚗️ Chemical ΔE*</span>
                                                <strong>{{ r.cumulative.chemicalDeltaE.toFixed(2) }}</strong>
                                                <span style="color: var(--text-secondary);">🦠 Mould index</span>
                                                <strong>{{ r.cumulative.mouldIndexFinal.toFixed(2) }} / 6</strong>
                                                <span style="color: var(--text-secondary);">🧱 Fatigue D</span>
                                                <strong>{{ r.cumulative.fatigueDamage.toFixed(3) }}</strong>
                                                <span style="color: var(--text-secondary);">🧂 Salt cumulative</span>
                                                <strong>{{ r.cumulative.saltCumulative.toFixed(3) }}</strong>
                                                <span style="color: var(--text-secondary);">⏳ Equiv. reference-years</span>
                                                <strong>{{ r.cumulative.equivYears.toFixed(2) }}</strong>
                                            </div>
                                            <div v-else style="font-size: 12px; color: var(--text-secondary); font-style: italic;">No cumulative data available yet.</div>

                                            <div v-if="r.anomalyDetail && r.anomalyDetail.length > 0" style="font-weight: 600; margin: 10px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Active anomalies</div>
                                            <ul v-if="r.anomalyDetail && r.anomalyDetail.length > 0" style="margin: 0; padding-left: 18px; font-size: 11px; line-height: 1.5;">
                                                <li v-for="(a, i) in r.anomalyDetail" :key="i">
                                                    <span :style="{ color: a.severity === 'critical' ? '#dc2626' : a.severity === 'high' ? '#b45309' : '#64748b', fontWeight: 600 }">
                                                        [{{ a.rule }}]
                                                    </span>
                                                    {{ a.sensorName }}: {{ a.message }}
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
                <strong>ℹ Scoring:</strong> composite = 1.0·damage + 1.0·(1/ETA_years) + 0.5·anomalyCount + 0.3·inspectionAge + 0.8·statusSeverity.
                Score ≥ 2.5 = critical, ≥ 1.5 = high, ≥ 0.8 = medium, else low. Expand any row for the per-index breakdown, full cumulative state, active anomalies, and all recommendations.
            </div>
        </div>
    `
};
