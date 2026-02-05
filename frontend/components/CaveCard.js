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
        }
    },
    emits: ['select', 'edit', 'delete'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="card cave-card" @click="$emit('select', cave)">
            <div class="card-header">
                <h3 class="card-title">{{ cave.name || '洞窟' }}</h3>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ cave.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ cave.label || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">creationPeriod:</span>
                    <span class="field-value">{{ cave.creationPeriod || 'N/A' }}</span>
                </div>
                <div v-if="cave.reference" class="card-section">
                    <div class="field-label">{{ t('detail.assetReference') }}</div>
                    <div class="card-field" v-if="cave.reference.modelLocation">
                        <span class="field-label">{{ t('detail.modelPath') }}:</span>
                        <span class="field-value">{{ cave.reference.modelLocation }}</span>
                    </div>
                    <div class="card-field" v-if="cave.reference.textureLocation">
                        <span class="field-label">{{ t('detail.texturePath') }}:</span>
                        <span class="field-value">{{ cave.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', cave)" :title="t('common.edit')">
                    ✏️ {{ t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', cave)" :title="t('common.delete')">
                    🗑️ {{ t('common.delete') }}
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.cave.name || this.cave.gid || '洞窟';
        },
        lastInspectionDateDisplay() {
            const value = this.cave.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
