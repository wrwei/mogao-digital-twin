/**
 * Inscription Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 铭文 with 3D viewer support
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'InscriptionDetailView',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        inscription: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    computed: {
        displayName() {
            return this.inscription.name || this.inscription.gid || '铭文';
        }
    },
    template: `
        <div class="detail-view">
            <div class="detail-header">
                <div class="detail-title-section">
                    <h1 class="detail-title">{{ displayName }}</h1>
                    <span class="badge" :class="'badge-' + (inscription.conservationStatus || 'unknown').toLowerCase()">
                        {{ inscription.conservationStatus ? t('conservationStatus.' + inscription.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                    </span>
                </div>
                <div class="detail-actions">
                    <button @click="$emit('edit', inscription)" class="btn btn-primary" :title="t('common.edit')">
                        ✏️ {{ t('common.edit') }}
                    </button>
                    <button @click="$emit('delete', inscription)" class="btn btn-error" :title="t('common.delete')">
                        🗑️ {{ t('common.delete') }}
                    </button>
                    <button @click="$emit('close')" class="btn btn-outline" :title="t('common.close')">
                        ✕ {{ t('common.close') }}
                    </button>
                </div>
            </div>

            <div class="detail-content">
                <!-- Basic Information Section -->
                <div class="detail-section info-section">
                    <h2 class="section-title">{{ t('detail.basicInfo') }}</h2>
                    <dl class="detail-list">
                        <div class="detail-item">
                            <dt class="detail-label">名称</dt>
                            <dd class="detail-value">
                                {{ inscription.name || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">描述</dt>
                            <dd class="detail-value">
                                {{ inscription.description || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">label</dt>
                            <dd class="detail-value">
                                {{ inscription.label || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">creationPeriod</dt>
                            <dd class="detail-value">
                                {{ inscription.creationPeriod || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">lastInspectionDate</dt>
                            <dd class="detail-value">
                                {{ inscription.lastInspectionDate || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">inspectionNotes</dt>
                            <dd class="detail-value">
                                {{ inscription.inspectionNotes || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">材质</dt>
                            <dd class="detail-value">
                                {{ inscription.material || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">period</dt>
                            <dd class="detail-value">
                                {{ inscription.period || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">保护状态</dt>
                            <dd class="detail-value">
                                {{ inscription.conservationStatus || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">语言</dt>
                            <dd class="detail-value">
                                {{ inscription.language || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">content</dt>
                            <dd class="detail-value">
                                {{ inscription.content || 'N/A' }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Asset Reference Information -->
                <div v-if="inscription.reference" class="detail-section asset-section">
                    <h2 class="section-title">{{ t('detail.assetReference') }}</h2>
                    <dl class="detail-list">
                        <div class="detail-item" v-if="inscription.reference.modelLocation">
                            <dt class="detail-label">{{ t('detail.modelPath') }}</dt>
                            <dd class="detail-value detail-path">{{ inscription.reference.modelLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="inscription.reference.metadataLocation">
                            <dt class="detail-label">{{ t('detail.metadataPath') }}</dt>
                            <dd class="detail-value detail-path">{{ inscription.reference.metadataLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="inscription.reference.textureLocation">
                            <dt class="detail-label">{{ t('detail.texturePath') }}</dt>
                            <dd class="detail-value detail-path">{{ inscription.reference.textureLocation }}</dd>
                        </div>
                    </dl>
                </div>


                <!-- Defects Section -->
                <div v-if="inscription.defects && inscription.defects.length > 0" class="detail-section defects-section">
                    <h2 class="section-title">{{ t('entities.defects') }} ({{ inscription.defects.length }})</h2>
                    <div class="defects-list">
                        <div v-for="defect in inscription.defects" :key="defect.gid" class="defect-item" style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--spacing-md); margin-bottom: var(--spacing-sm);">
                            <div class="defect-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                                <strong style="font-size: 1.1em;">{{ defect.name || defect.gid }}</strong>
                                <span v-if="defect.severity" class="badge" :class="'badge-' + (defect.severity || 'unknown').toLowerCase()" style="font-size: 0.85em;">
                                    {{ defect.severity }}
                                </span>
                            </div>
                            <p v-if="defect.description" style="margin-bottom: var(--spacing-sm); color: var(--text-secondary);">{{ defect.description }}</p>
                            <div class="defect-meta" style="font-size: 0.9em; color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: var(--spacing-md);">
                                <span v-if="defect.defectType">
                                    <strong>{{ t('detail.type') }}:</strong> {{ defect.defectType }}
                                </span>
                                <span v-if="defect.affectedArea">
                                    <strong>{{ t('detail.affectedArea') }}:</strong> {{ defect.affectedArea }} m²
                                </span>
                                <span v-if="defect.requiresImmediateAction" style="color: var(--error-color); font-weight: bold;">
                                    ⚠️ {{ t('detail.urgent') }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- coordinates Section -->
                <div v-if="inscription.coordinates" class="detail-section">
                    <h2 class="section-title">coordinates</h2>
                    <div class="nested-content">
                        <pre>{{ inscription.coordinates }}</pre>
                    </div>
                </div>

            </div>
        </div>
    `
};
