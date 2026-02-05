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
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card painting-card" @click="$emit('select', painting)">
            <div class="card-header">
                <h3 class="card-title">{{ painting.name || '绘画' }}</h3>
                <span class="badge" :class="'badge-' + (painting.conservationStatus || 'unknown').toLowerCase()">
                    {{ painting.conservationStatus ? t('conservationStatus.' + painting.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ painting.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ painting.label || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">creationPeriod:</span>
                    <span class="field-value">{{ painting.creationPeriod || 'N/A' }}</span>
                </div>
                <div v-if="painting.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="painting.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ painting.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="painting.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ painting.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', painting)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', painting)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.painting.name || this.painting.gid || '绘画';
        },
        lastInspectionDateDisplay() {
            const value = this.painting.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
