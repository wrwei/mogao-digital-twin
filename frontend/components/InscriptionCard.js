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
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card inscription-card" @click="$emit('select', inscription)">
            <div class="card-header">
                <h3 class="card-title">{{ inscription.name || '铭文' }}</h3>
                <span class="badge" :class="'badge-' + (inscription.conservationStatus || 'unknown').toLowerCase()">
                    {{ inscription.conservationStatus ? t('conservationStatus.' + inscription.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ inscription.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ inscription.label || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">creationPeriod:</span>
                    <span class="field-value">{{ inscription.creationPeriod || 'N/A' }}</span>
                </div>
                <div v-if="inscription.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="inscription.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ inscription.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="inscription.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ inscription.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', inscription)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', inscription)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.inscription.name || this.inscription.gid || '铭文';
        },
        lastInspectionDateDisplay() {
            const value = this.inscription.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
