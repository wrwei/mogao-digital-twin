/**
 * Statue Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 雕像 information in card format
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'StatueCard',
    props: {
        statue: {
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
        <div class="card statue-card"
             :class="{ 'selected': isSelected }"
             @click="$emit('select', statue)">
            <div class="card-header">
                <h3 class="card-title">{{ statue.name || '雕像' }}</h3>
                <span class="badge" :class="'badge-' + (statue.conservationStatus || 'unknown').toLowerCase()">
                    {{ statue.conservationStatus ? t('conservationStatus.' + statue.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <p class="card-description">{{ statue.description || t('common.noDescription') }}</p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('view-detail', statue)" :title="t('actions.viewDetail')">
                    {{ t('actions.viewDetail') }}
                </button>
                <button class="btn btn-sm" @click.stop="$emit('edit', statue)" :title="t('common.edit')">
                    {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="$emit('delete', statue)" :title="t('common.delete')">
                    {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        isSelected() {
            return this.selectedGid === this.statue.gid;
        }
    }
};
