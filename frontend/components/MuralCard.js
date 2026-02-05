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
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card mural-card" @click="$emit('select', mural)">
            <div class="card-header">
                <h3 class="card-title">{{ mural.name || '壁画' }}</h3>
                <span class="badge" :class="'badge-' + (mural.conservationStatus || 'unknown').toLowerCase()">
                    {{ mural.conservationStatus ? t('conservationStatus.' + mural.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ mural.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ mural.label || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">creationPeriod:</span>
                    <span class="field-value">{{ mural.creationPeriod || 'N/A' }}</span>
                </div>
                <div v-if="mural.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="mural.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ mural.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="mural.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ mural.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', mural)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', mural)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.mural.name || this.mural.gid || '壁画';
        },
        lastInspectionDateDisplay() {
            const value = this.mural.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
