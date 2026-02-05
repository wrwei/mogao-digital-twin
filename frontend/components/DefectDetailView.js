/**
 * Defect Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 缺陷 with 3D viewer support
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'DefectDetailView',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        defect: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    computed: {
        displayName() {
            return this.defect.name || this.defect.gid || '缺陷';
        }
    },
    template: `
        <div class="detail-view">
            <div class="detail-header">
                <div class="detail-title-section">
                    <h1 class="detail-title">{{ displayName }}</h1>
                </div>
                <div class="detail-actions">
                    <button @click="$emit('edit', defect)" class="btn btn-primary" :title="t('common.edit')">
                        ✏️ {{ t('common.edit') }}
                    </button>
                    <button @click="$emit('delete', defect)" class="btn btn-error" :title="t('common.delete')">
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
                                {{ defect.name || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">描述</dt>
                            <dd class="detail-value">
                                {{ defect.description || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">缺陷类型</dt>
                            <dd class="detail-value">
                                {{ defect.defectType || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">严重程度</dt>
                            <dd class="detail-value">
                                {{ defect.severity || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">detectionDate</dt>
                            <dd class="detail-value">
                                {{ defect.detectionDate || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">affectedArea</dt>
                            <dd class="detail-value">
                                {{ defect.affectedArea || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">treatmentHistory</dt>
                            <dd class="detail-value">
                                {{ defect.treatmentHistory || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">requiresImmediateAction</dt>
                            <dd class="detail-value">
                                {{ defect.requiresImmediateAction || 'N/A' }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Asset Reference Information -->
                <div v-if="defect.reference" class="detail-section asset-section">
                    <h2 class="section-title">{{ t('detail.assetReference') }}</h2>
                    <dl class="detail-list">
                        <div class="detail-item" v-if="defect.reference.modelLocation">
                            <dt class="detail-label">{{ t('detail.modelPath') }}</dt>
                            <dd class="detail-value detail-path">{{ defect.reference.modelLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="defect.reference.metadataLocation">
                            <dt class="detail-label">{{ t('detail.metadataPath') }}</dt>
                            <dd class="detail-value detail-path">{{ defect.reference.metadataLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="defect.reference.textureLocation">
                            <dt class="detail-label">{{ t('detail.texturePath') }}</dt>
                            <dd class="detail-value detail-path">{{ defect.reference.textureLocation }}</dd>
                        </div>
                    </dl>
                </div>


                <!-- coordinates Section -->
                <div v-if="defect.coordinates" class="detail-section">
                    <h2 class="section-title">coordinates</h2>
                    <div class="nested-content">
                        <pre>{{ defect.coordinates }}</pre>
                    </div>
                </div>

            </div>
        </div>
    `
};
