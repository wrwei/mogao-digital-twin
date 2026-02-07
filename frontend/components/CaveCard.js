/**
 * Cave Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 洞窟 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'CaveCard',
    props: {
        cave: {
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
        <div class="card cave-card"
             :class="{ 'selected': isSelected }"
             @click="handleCardClick">
            <div class="card-header">
                <h3 class="card-title">{{ cave.name || '洞窟' }}</h3>
            </div>
            <div class="card-body">
                <p class="card-description">{{ cave.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm" @click.stop="$emit('edit', cave)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', cave)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    methods: {
        handleCardClick() {
            this.$emit('select', this.cave);
            this.$emit('view-detail', this.cave);
        }
    },
    computed: {
        isSelected() {
            return this.selectedGid === this.cave.gid;
        }
    }
};
