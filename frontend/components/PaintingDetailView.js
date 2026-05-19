/**
 * Painting Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 绘画 with 3D viewer support
 */
import { useI18n } from '../i18n.js';
import DefectsPanel from './DefectsPanel.js';

export default {
    name: 'PaintingDetailView',
    components: { DefectsPanel },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        painting: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    computed: {
        displayName() {
            return this.painting.name || this.painting.gid || '绘画';
        }
    },
    template: `
        <div class="detail-view">
            <!-- Title with Badge -->
            <div class="detail-title-bar">
                <h2 class="detail-title">{{ displayName }}</h2>
                <span class="badge badge-lg" :class="'badge-' + (painting.conservationStatus || 'unknown').toLowerCase()">
                    {{ painting.conservationStatus ? t('conservationStatus.' + painting.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>

            <!-- Basic Information Section -->
            <div class="info-section">
                <h3 class="section-header">{{ t('detail.basicInfo') }}</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.name') }}</span>
                        <span class="info-value">
                            {{ painting.name || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.description') }}</span>
                        <span class="info-value">
                            {{ painting.description || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.label') }}</span>
                        <span class="info-value">
                            {{ painting.label || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.creationPeriod') }}</span>
                        <span class="info-value">
                            {{ painting.creationPeriod || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.lastInspectionDate') }}</span>
                        <span class="info-value">
                            {{ painting.lastInspectionDate || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.inspectionNotes') }}</span>
                        <span class="info-value">
                            {{ painting.inspectionNotes || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.material') }}</span>
                        <span class="info-value">
                            {{ painting.material || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.period') }}</span>
                        <span class="info-value">
                            {{ painting.period || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.conservationStatus') }}</span>
                        <span class="info-value">
                            {{ painting.conservationStatus || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.width') }}</span>
                        <span class="info-value">
                            {{ painting.width || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.height') }}</span>
                        <span class="info-value">
                            {{ painting.height || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.style') }}</span>
                        <span class="info-value">
                            {{ painting.style || 'N/A' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Asset Reference Section -->
            <div v-if="painting.reference" class="info-section">
                <h3 class="section-header">{{ t('detail.assetReference') }}</h3>
                <div class="info-grid">
                    <div class="info-row" v-if="painting.reference.modelLocation">
                        <span class="info-label">{{ t('detail.modelPath') }}</span>
                        <span class="info-value info-path">{{ painting.reference.modelLocation }}</span>
                    </div>
                    <div class="info-row" v-if="painting.reference.metadataLocation">
                        <span class="info-label">{{ t('detail.metadataPath') }}</span>
                        <span class="info-value info-path">{{ painting.reference.metadataLocation }}</span>
                    </div>
                    <div class="info-row" v-if="painting.reference.textureLocation">
                        <span class="info-label">{{ t('detail.texturePath') }}</span>
                        <span class="info-value info-path">{{ painting.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>

            <!-- Defects: per-exhibit observation log -->
            <div class="info-section defects-section">
                <defects-panel :exhibit-gid="painting.gid" :initial-defects="painting.defects || []"></defects-panel>
            </div>
        </div>
    `
};
