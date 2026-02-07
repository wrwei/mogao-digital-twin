/**
 * Mural Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 壁画 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'MuralCard',
    props: {
        mural: {
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
        <div class="card mural-card"
             :class="{ 'selected': isSelected }"
             @click="handleCardClick">
            <div class="card-header">
                <h3 class="card-title">{{ mural.name || '壁画' }}</h3>
                <span class="badge" :class="'badge-' + (mural.conservationStatus || 'unknown').toLowerCase()" :title="t('fields.conservationStatus')">
                    <span style="opacity: 0.8; font-size: 0.9em;">🏛️</span>
                    {{ mural.conservationStatus ? t('conservationStatus.' + mural.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <p class="card-description">{{ mural.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm" @click.stop="$emit('edit', mural)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', mural)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    methods: {
        handleCardClick() {
            this.$emit('select', this.mural);
            this.$emit('view-detail', this.mural);
        }
    },
    computed: {
        isSelected() {
            return this.selectedGid === this.mural.gid;
        }
    }
};
