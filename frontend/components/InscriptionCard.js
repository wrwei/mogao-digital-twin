/**
 * Inscription Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 铭文 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'InscriptionCard',
    props: {
        inscription: {
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
        <div class="card inscription-card"
             :class="{ 'selected': isSelected }"
             @click="handleCardClick">
            <div class="card-header">
                <h3 class="card-title">{{ inscription.name || '铭文' }}</h3>
                <span class="badge" :class="'badge-' + (inscription.conservationStatus || 'unknown').toLowerCase()" :title="t('fields.conservationStatus')">
                    <span style="opacity: 0.8; font-size: 0.9em;">🏛️</span>
                    {{ inscription.conservationStatus ? t('conservationStatus.' + inscription.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <p class="card-description">{{ inscription.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm" @click.stop="$emit('edit', inscription)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', inscription)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    methods: {
        handleCardClick() {
            this.$emit('select', this.inscription);
            this.$emit('view-detail', this.inscription);
        }
    },
    computed: {
        isSelected() {
            return this.selectedGid === this.inscription.gid;
        }
    }
};
