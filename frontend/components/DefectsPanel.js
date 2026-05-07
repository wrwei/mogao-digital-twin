/**
 * DefectsPanel
 *
 * Per-exhibit observation log: lists defects already recorded against an
 * exhibit and lets a conservator log new ones, edit existing entries, or
 * remove them. Intended to live inside an exhibit's detail drawer so the
 * record is paired with the artifact it describes.
 *
 * Defects are observed-damage records — the natural ground-truth channel
 * against which the deterioration models' predicted outputs (fatigue D,
 * mould index M, salt cumulative, ΔE*) can be compared.
 *
 * Backend contract:
 *   GET    /exhibits/:gid/defects
 *   POST   /exhibits/:gid/defects                { defectType, severity, ... }
 *   PUT    /exhibits/:gid/defects/:defectGid     { ...patch }
 *   DELETE /exhibits/:gid/defects/:defectGid
 */
import { useI18n } from '../i18n.js';
import StatusBadge from './StatusBadge.js';

const DEFECT_TYPES = [
    'cracking', 'flaking', 'blistering', 'detachment', 'materialLoss',
    'disruption', 'alveolization', 'saltEfflorescence', 'colorAlteration',
    'acidAttack', 'paintLoss', 'microbialGrowth', 'blackSpots', 'lichenGrowth',
    'insectDamage', 'waterSeepage', 'sootDeposition', 'erosion',
    'structuralCollapse', 'graffiti'
];
const SEVERITIES = ['minor', 'moderate', 'severe', 'critical'];

function emptyForm() {
    return {
        name: '',
        description: '',
        defectType: '',
        severity: 'minor',
        detectionDate: new Date().toISOString().slice(0, 10),
        affectedArea: null,
        treatmentHistory: '',
        requiresImmediateAction: false
    };
}

export default {
    name: 'DefectsPanel',
    components: { StatusBadge },
    props: {
        exhibitGid:     { type: String, required: true },
        initialDefects: { type: Array, default: () => [] }
    },
    emits: ['defects-updated'],
    inject: {
        $confirm: { default: () => () => Promise.resolve(false) },
        isGuest:  { default: { value: false } }
    },
    setup() {
        const { t } = useI18n();
        return { t, DEFECT_TYPES, SEVERITIES };
    },
    data() {
        return {
            defects: [...(this.initialDefects || [])],
            loading: false,
            error:   null,
            // null = no form open; 'new' = creating; or a defect gid being edited
            formMode: null,
            form: emptyForm()
        };
    },
    computed: {
        readOnly() { return this.isGuest && this.isGuest.value; },
        sortedDefects() {
            // Show severe/critical first, then by detection date desc
            const order = { critical: 0, severe: 1, moderate: 2, minor: 3 };
            return [...this.defects].sort((a, b) => {
                const so = (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
                if (so !== 0) return so;
                return (b.detectionDate || 0) - (a.detectionDate || 0);
            });
        }
    },
    watch: {
        // If the parent re-fetches the exhibit and passes a fresh defects list,
        // reflect that here.
        initialDefects(newVal) { this.defects = [...(newVal || [])]; },
        exhibitGid()           { this.refresh(); }
    },
    methods: {
        async refresh() {
            this.loading = true;
            this.error   = null;
            try {
                const res = await window.api.exhibits.listDefects(this.exhibitGid);
                this.defects = Array.isArray(res.data) ? res.data : [];
                this.$emit('defects-updated', this.defects);
            } catch (err) {
                this.error = err.response?.data?.message || err.message;
            } finally {
                this.loading = false;
            }
        },

        openCreateForm() {
            this.formMode = 'new';
            this.form = emptyForm();
        },

        openEditForm(defect) {
            this.formMode = defect.gid;
            this.form = {
                name: defect.name || '',
                description: defect.description || '',
                defectType: defect.defectType || '',
                severity: defect.severity || 'minor',
                detectionDate: defect.detectionDate
                    ? new Date(defect.detectionDate).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10),
                affectedArea: defect.affectedArea ?? null,
                treatmentHistory: defect.treatmentHistory || '',
                requiresImmediateAction: !!defect.requiresImmediateAction
            };
        },

        closeForm() {
            this.formMode = null;
            this.form = emptyForm();
        },

        /** Coerce form fields into the backend payload shape. */
        buildPayload() {
            const p = { ...this.form };
            // detectionDate is held as YYYY-MM-DD in the form; backend stores ms.
            if (p.detectionDate) p.detectionDate = new Date(p.detectionDate).getTime();
            else                 delete p.detectionDate;
            // Numeric coercions; treat blank as omitted
            p.affectedArea = p.affectedArea === null || p.affectedArea === ''
                ? undefined : Number(p.affectedArea);
            return p;
        },

        async submitForm() {
            if (!this.form.defectType) {
                this.error = this.t('defects.errorTypeRequired');
                return;
            }
            this.loading = true;
            this.error   = null;
            try {
                const payload = this.buildPayload();
                if (this.formMode === 'new') {
                    const res = await window.api.exhibits.addDefect(this.exhibitGid, payload);
                    this.defects = [...this.defects, res.data];
                } else {
                    const res = await window.api.exhibits.updateDefect(
                        this.exhibitGid, this.formMode, payload
                    );
                    this.defects = this.defects.map(d => d.gid === this.formMode ? res.data : d);
                }
                this.$emit('defects-updated', this.defects);
                this.closeForm();
            } catch (err) {
                this.error = err.response?.data?.message || err.message;
            } finally {
                this.loading = false;
            }
        },

        async confirmDelete(defect) {
            const label = defect.name || defect.gid;
            const _ok = await this.$confirm({
                message: this.t('defects.deleteConfirm', { name: label }),
                danger: true
            });
            if (!_ok) return;
            this.loading = true;
            this.error = null;
            try {
                await window.api.exhibits.removeDefect(this.exhibitGid, defect.gid);
                this.defects = this.defects.filter(d => d.gid !== defect.gid);
                this.$emit('defects-updated', this.defects);
            } catch (err) {
                this.error = err.response?.data?.message || err.message;
            } finally {
                this.loading = false;
            }
        },

        formatDate(ms) {
            if (!ms) return '';
            try { return new Date(ms).toISOString().slice(0, 10); }
            catch (_) { return ''; }
        },

        /** Map defect severity (minor/moderate/severe/critical) onto the
         *  shared severity-token level used by StatusBadge. */
        severityLevel(s) {
            return { minor: 'low', moderate: 'medium',
                     severe: 'high', critical: 'critical' }[s] || 'neutral';
        },
        /** Resolve to a CSS variable for the row's left-accent border. */
        severityAccent(s) {
            const level = this.severityLevel(s);
            return `var(--severity-${level}-bg)`;
        }
    },
    template: `
        <div class="defects-panel">
            <div class="defects-panel-header">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                    {{ t('entities.defects') }}
                    <span class="count-badge" style="margin-left: 6px; font-size: 12px; color: var(--text-secondary);">{{ defects.length }}</span>
                </h3>
                <button v-if="!readOnly && formMode === null"
                        class="btn btn-sm btn-primary"
                        @click="openCreateForm" :disabled="loading">
                    + {{ t('defects.logNew') }}
                </button>
            </div>

            <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-top: 8px;">
                {{ error }}
                <button @click="error = null" :aria-label="t('common.close')" style="float: right; background: none; border: none; cursor: pointer; color: var(--severity-high-bg);">✕</button>
            </div>

            <!-- Inline form (create or edit) -->
            <div v-if="formMode !== null" class="defects-form" style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; margin: 10px 0;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">
                    {{ formMode === 'new' ? t('defects.formCreateTitle') : t('defects.formEditTitle') }}
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px;">
                    <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px;">
                        <span>{{ t('defects.fieldName') }}</span>
                        <input v-model="form.name" type="text" class="form-input" />
                    </label>
                    <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px;">
                        <span>{{ t('defects.fieldType') }} *</span>
                        <select v-model="form.defectType" class="form-input">
                            <option value="" disabled>—</option>
                            <option v-for="dt in DEFECT_TYPES" :key="dt" :value="dt">{{ dt }}</option>
                        </select>
                    </label>
                    <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px;">
                        <span>{{ t('defects.fieldSeverity') }}</span>
                        <select v-model="form.severity" class="form-input">
                            <option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option>
                        </select>
                    </label>
                    <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px;">
                        <span>{{ t('defects.fieldDetectionDate') }}</span>
                        <input v-model="form.detectionDate" type="date" class="form-input" />
                    </label>
                    <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px;">
                        <span>{{ t('defects.fieldAffectedArea') }}</span>
                        <input v-model.number="form.affectedArea" type="number" step="0.01" min="0" class="form-input" />
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; align-self: end;">
                        <input v-model="form.requiresImmediateAction" type="checkbox" />
                        {{ t('defects.fieldUrgent') }}
                    </label>
                </div>
                <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px; margin-bottom: 8px;">
                    <span>{{ t('defects.fieldDescription') }}</span>
                    <textarea v-model="form.description" rows="2" class="form-input" style="resize: vertical;"></textarea>
                </label>
                <label style="display: flex; flex-direction: column; font-size: 12px; gap: 3px; margin-bottom: 10px;">
                    <span>{{ t('defects.fieldTreatment') }}</span>
                    <textarea v-model="form.treatmentHistory" rows="2" class="form-input" style="resize: vertical;"></textarea>
                </label>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" @click="submitForm" :disabled="loading || !form.defectType">
                        {{ loading ? '…' : (formMode === 'new' ? t('common.create') : t('common.save')) }}
                    </button>
                    <button class="btn btn-sm" @click="closeForm" :disabled="loading">
                        {{ t('common.cancel') }}
                    </button>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="defects.length === 0 && formMode === null" style="padding: 14px; text-align: center; color: var(--text-secondary); font-style: italic; font-size: 13px;">
                {{ t('defects.empty') }}
            </div>

            <!-- List -->
            <div v-else class="defects-list" style="margin-top: 8px;">
                <div v-for="d in sortedDefects" :key="d.gid"
                     class="defect-card"
                     :style="{ borderLeft: '4px solid ' + severityAccent(d.severity) }">
                    <div class="defect-card-header">
                        <strong class="defect-name">{{ d.name || d.gid }}</strong>
                        <status-badge v-if="d.severity" :level="severityLevel(d.severity)" variant="solid" :label="d.severity"></status-badge>
                        <span v-if="d.requiresImmediateAction" class="meta-urgent" style="margin-left: 6px;">⚠️</span>
                    </div>
                    <div class="defect-meta" style="font-size: 11px; color: var(--text-secondary); margin: 4px 0;">
                        <span v-if="d.defectType"><strong>{{ t('fields.defectType') }}:</strong> {{ d.defectType }}</span>
                        <span v-if="d.detectionDate" style="margin-left: 8px;"><strong>{{ t('defects.fieldDetectionDate') }}:</strong> {{ formatDate(d.detectionDate) }}</span>
                        <span v-if="d.affectedArea != null" style="margin-left: 8px;"><strong>{{ t('defects.fieldAffectedArea') }}:</strong> {{ d.affectedArea }} m²</span>
                    </div>
                    <p v-if="d.description" class="defect-description" style="font-size: 12px; margin: 4px 0;">{{ d.description }}</p>
                    <p v-if="d.treatmentHistory" style="font-size: 11px; color: var(--text-secondary); margin: 2px 0;">
                        <em>{{ t('defects.fieldTreatment') }}:</em> {{ d.treatmentHistory }}
                    </p>
                    <div v-if="!readOnly" style="display: flex; gap: 6px; margin-top: 6px;">
                        <button class="btn btn-xs" @click="openEditForm(d)" :disabled="loading">
                            {{ t('common.edit') }}
                        </button>
                        <button class="btn btn-xs" @click="confirmDelete(d)" :disabled="loading"
                                style="background: #fee2e2; color: #991b1b;">
                            {{ t('common.delete') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
