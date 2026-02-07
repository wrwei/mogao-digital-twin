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
            <!-- Title with Badge -->
            <div class="detail-title-bar">
                <h2 class="detail-title">{{ displayName }}</h2>
            </div>

            <!-- Basic Information Section -->
            <div class="info-section">
                <h3 class="section-header">{{ t('detail.basicInfo') }}</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.name') }}</span>
                        <span class="info-value">
                            {{ defect.name || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.description') }}</span>
                        <span class="info-value">
                            {{ defect.description || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.defectType') }}</span>
                        <span class="info-value">
                            {{ defect.defectType || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.severity') }}</span>
                        <span class="info-value">
                            {{ defect.severity || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.detectionDate') }}</span>
                        <span class="info-value">
                            {{ defect.detectionDate || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.affectedArea') }}</span>
                        <span class="info-value">
                            {{ defect.affectedArea || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.treatmentHistory') }}</span>
                        <span class="info-value">
                            {{ defect.treatmentHistory || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.requiresImmediateAction') }}</span>
                        <span class="info-value">
                            {{ defect.requiresImmediateAction || 'N/A' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Asset Reference Section -->
            <div v-if="defect.reference" class="info-section">
                <h3 class="section-header">{{ t('detail.assetReference') }}</h3>
                <div class="info-grid">
                    <div class="info-row" v-if="defect.reference.modelLocation">
                        <span class="info-label">{{ t('detail.modelPath') }}</span>
                        <span class="info-value info-path">{{ defect.reference.modelLocation }}</span>
                    </div>
                    <div class="info-row" v-if="defect.reference.metadataLocation">
                        <span class="info-label">{{ t('detail.metadataPath') }}</span>
                        <span class="info-value info-path">{{ defect.reference.metadataLocation }}</span>
                    </div>
                    <div class="info-row" v-if="defect.reference.textureLocation">
                        <span class="info-label">{{ t('detail.texturePath') }}</span>
                        <span class="info-value info-path">{{ defect.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>

        </div>
    `
};
