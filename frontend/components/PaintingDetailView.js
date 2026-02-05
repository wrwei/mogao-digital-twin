/**
 * Painting Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 绘画 with 3D viewer support
 */
import ModelViewer from './ModelViewer.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'PaintingDetailView',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    components: {
        ModelViewer
    },
    props: {
        painting: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    data() {
        return {
            autoRotate: false
        };
    },
    computed: {
        displayName() {
            return this.painting.name || this.painting.gid || '绘画';
        }
    },
    template: `
        <div class="detail-view">
            <div class="detail-header">
                <div class="detail-title-section">
                    <h1 class="detail-title">{{ displayName }}</h1>
                    <span class="badge" :class="'badge-' + (painting.conservationStatus || 'unknown').toLowerCase()">
                        {{ painting.conservationStatus ? t('conservationStatus.' + painting.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                    </span>
                </div>
                <div class="detail-actions">
                    <button @click="$emit('edit', painting)" class="btn btn-primary" :title="t('common.edit')">
                        ✏️ {{ t('common.edit') }}
                    </button>
                    <button @click="$emit('delete', painting)" class="btn btn-error" :title="t('common.delete')">
                        🗑️ {{ t('common.delete') }}
                    </button>
                    <button @click="$emit('close')" class="btn btn-outline" :title="t('common.close')">
                        ✕ {{ t('common.close') }}
                    </button>
                </div>
            </div>

            <div class="detail-content">
                <!-- 3D Model Viewer Section -->
                <div v-if="painting.reference && painting.reference.modelLocation" class="detail-section model-section">
                    <h2 class="section-title">{{ t('viewer.title') }}</h2>
                    <model-viewer
                        :asset-reference="painting.reference"
                        :width="800"
                        :height="500"
                        :auto-rotate="autoRotate"
                    ></model-viewer>
                    <div class="model-controls">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="autoRotate">
                            {{ t('viewer.autoRotate') }}
                        </label>
                    </div>
                </div>

                <!-- Basic Information Section -->
                <div class="detail-section info-section">
                    <h2 class="section-title">{{ t('detail.basicInfo') }}</h2>
                    <dl class="detail-list">
                        <div class="detail-item">
                            <dt class="detail-label">名称</dt>
                            <dd class="detail-value">
                                {{ painting.name || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">描述</dt>
                            <dd class="detail-value">
                                {{ painting.description || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">label</dt>
                            <dd class="detail-value">
                                {{ painting.label || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">creationPeriod</dt>
                            <dd class="detail-value">
                                {{ painting.creationPeriod || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">lastInspectionDate</dt>
                            <dd class="detail-value">
                                {{ painting.lastInspectionDate || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">inspectionNotes</dt>
                            <dd class="detail-value">
                                {{ painting.inspectionNotes || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">材质</dt>
                            <dd class="detail-value">
                                {{ painting.material || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">period</dt>
                            <dd class="detail-value">
                                {{ painting.period || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">保护状态</dt>
                            <dd class="detail-value">
                                {{ painting.conservationStatus || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">宽度</dt>
                            <dd class="detail-value">
                                {{ painting.width || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">高度</dt>
                            <dd class="detail-value">
                                {{ painting.height || 'N/A' }}
                            </dd>
                        </div>
                        <div class="detail-item">
                            <dt class="detail-label">style</dt>
                            <dd class="detail-value">
                                {{ painting.style || 'N/A' }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Asset Reference Information -->
                <div v-if="painting.reference" class="detail-section asset-section">
                    <h2 class="section-title">{{ t('detail.assetReference') }}</h2>
                    <dl class="detail-list">
                        <div class="detail-item" v-if="painting.reference.modelLocation">
                            <dt class="detail-label">{{ t('detail.modelPath') }}</dt>
                            <dd class="detail-value detail-path">{{ painting.reference.modelLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="painting.reference.metadataLocation">
                            <dt class="detail-label">{{ t('detail.metadataPath') }}</dt>
                            <dd class="detail-value detail-path">{{ painting.reference.metadataLocation }}</dd>
                        </div>
                        <div class="detail-item" v-if="painting.reference.textureLocation">
                            <dt class="detail-label">{{ t('detail.texturePath') }}</dt>
                            <dd class="detail-value detail-path">{{ painting.reference.textureLocation }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- coordinates Section -->
                <div v-if="painting.coordinates" class="detail-section">
                    <h2 class="section-title">coordinates</h2>
                    <div class="nested-content">
                        <pre>{{ painting.coordinates }}</pre>
                    </div>
                </div>

            </div>
        </div>
    `
};
