/**
 * Painting Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 绘画 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'PaintingCard',
    props: {
        painting: {
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
        <div class="card painting-card"
             :class="{ 'selected': isSelected }"
             @click="handleCardClick">
            <div class="card-header">
                <h3 class="card-title">{{ painting.name || '绘画' }}</h3>
                <span class="badge" :class="'badge-' + (painting.conservationStatus || 'unknown').toLowerCase()" :title="t('fields.conservationStatus')">
                    <span style="opacity: 0.8; font-size: 0.9em;">🏛️</span>
                    {{ painting.conservationStatus ? t('conservationStatus.' + painting.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <p class="card-description">{{ painting.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm" @click.stop="$emit('edit', painting)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', painting)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    methods: {
        handleCardClick() {
            this.$emit('select', this.painting);
            this.$emit('view-detail', this.painting);
        }
    },
    computed: {
        isSelected() {
            return this.selectedGid === this.painting.gid;
        }
    }
};
