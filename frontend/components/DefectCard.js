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
        },
        selectedGid: {
            type: String,
            default: null
        }
    },
    emits: ['select', 'edit', 'delete', 'view-detail'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card defect-card"
             :class="{ 'selected': isSelected }"
             @click="$emit('select', defect)">
            <div class="card-header">
                <h3 class="card-title">{{ defect.name || '缺陷' }}</h3>
            </div>
            <div class="card-body">
                <p class="card-description">{{ defect.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('view-detail', defect)" :title="t('actions.viewDetail')">
                    {{ t('actions.viewDetail') }}
                </button>
                <button class="btn btn-sm" @click.stop="$emit('edit', defect)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', defect)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        isSelected() {
            return this.selectedGid === this.defect.gid;
        }
    }
};
