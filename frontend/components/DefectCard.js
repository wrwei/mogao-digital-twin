/**
 * Defect Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 缺陷 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'DefectCard',
    props: {
        defect: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card defect-card" @click="$emit('select', defect)">
            <div class="card-header">
                <h3 class="card-title">{{ defect.name || '缺陷' }}</h3>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ defect.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">缺陷类型:</span>
                    <span class="field-value">{{ defect.defectType || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">严重程度:</span>
                    <span class="field-value">{{ defect.severity || 'N/A' }}</span>
                </div>
                <div v-if="defect.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="defect.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ defect.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="defect.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ defect.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', defect)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', defect)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.defect.name || this.defect.gid || '缺陷';
        },
        detectionDateDisplay() {
            const value = this.defect.detectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
