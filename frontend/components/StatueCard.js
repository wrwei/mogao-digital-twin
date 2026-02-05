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
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card statue-card" @click="$emit('select', statue)">
            <div class="card-header">
                <h3 class="card-title">{{ statue.name || '雕像' }}</h3>
                <span class="badge" :class="'badge-' + (statue.conservationStatus || 'unknown').toLowerCase()">
                    {{ statue.conservationStatus ? t('conservationStatus.' + statue.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ statue.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ statue.label || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">creationPeriod:</span>
                    <span class="field-value">{{ statue.creationPeriod || 'N/A' }}</span>
                </div>
                <div v-if="statue.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="statue.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ statue.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="statue.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ statue.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', statue)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', statue)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.statue.name || this.statue.gid || '雕像';
        },
        lastInspectionDateDisplay() {
            const value = this.statue.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
