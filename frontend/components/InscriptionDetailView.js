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
            <!-- Title with Badge -->
            <div class="detail-title-bar">
                <h2 class="detail-title">{{ displayName }}</h2>
                <span class="badge badge-lg" :class="'badge-' + (inscription.conservationStatus || 'unknown').toLowerCase()">
                    {{ inscription.conservationStatus ? t('conservationStatus.' + inscription.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>

            <!-- Basic Information Section -->
            <div class="info-section">
                <h3 class="section-header">{{ t('detail.basicInfo') }}</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.name') }}</span>
                        <span class="info-value">
                            {{ inscription.name || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.description') }}</span>
                        <span class="info-value">
                            {{ inscription.description || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.label') }}</span>
                        <span class="info-value">
                            {{ inscription.label || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.creationPeriod') }}</span>
                        <span class="info-value">
                            {{ inscription.creationPeriod || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.lastInspectionDate') }}</span>
                        <span class="info-value">
                            {{ inscription.lastInspectionDate || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.inspectionNotes') }}</span>
                        <span class="info-value">
                            {{ inscription.inspectionNotes || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.material') }}</span>
                        <span class="info-value">
                            {{ inscription.material || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.period') }}</span>
                        <span class="info-value">
                            {{ inscription.period || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.conservationStatus') }}</span>
                        <span class="info-value">
                            {{ inscription.conservationStatus || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.language') }}</span>
                        <span class="info-value">
                            {{ inscription.language || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.content') }}</span>
                        <span class="info-value">
                            {{ inscription.content || 'N/A' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Asset Reference Section -->
            <div v-if="inscription.reference" class="info-section">
                <h3 class="section-header">{{ t('detail.assetReference') }}</h3>
                <div class="info-grid">
                    <div class="info-row" v-if="inscription.reference.modelLocation">
                        <span class="info-label">{{ t('detail.modelPath') }}</span>
                        <span class="info-value info-path">{{ inscription.reference.modelLocation }}</span>
                    </div>
                    <div class="info-row" v-if="inscription.reference.metadataLocation">
                        <span class="info-label">{{ t('detail.metadataPath') }}</span>
                        <span class="info-value info-path">{{ inscription.reference.metadataLocation }}</span>
                    </div>
                    <div class="info-row" v-if="inscription.reference.textureLocation">
                        <span class="info-label">{{ t('detail.texturePath') }}</span>
                        <span class="info-value info-path">{{ inscription.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>

            <!-- Defects Section -->
            <div v-if="inscription.defects && inscription.defects.length > 0" class="info-section defects-section">
                <h3 class="section-header">
                    {{ t('entities.defects') }}
                    <span class="count-badge">{{ inscription.defects.length }}</span>
                </h3>
                <div class="defects-list">
                    <div v-for="defect in inscription.defects" :key="defect.gid" class="defect-card">
                        <div class="defect-card-header">
                            <strong class="defect-name">{{ defect.name || defect.gid }}</strong>
                            <span v-if="defect.severity" class="badge" :class="'badge-' + (defect.severity || 'unknown').toLowerCase()">
                                {{ defect.severity }}
                            </span>
                        </div>
                        <p v-if="defect.description" class="defect-description">{{ defect.description }}</p>
                        <div class="defect-meta">
                            <span v-if="defect.defectType" class="meta-item">
                                <strong>{{ t('detail.type') }}:</strong> {{ defect.defectType }}
                            </span>
                            <span v-if="defect.affectedArea" class="meta-item">
                                <strong>{{ t('detail.affectedArea') }}:</strong> {{ defect.affectedArea }} m²
                            </span>
                            <span v-if="defect.requiresImmediateAction" class="meta-item meta-urgent">
                                ⚠️ {{ t('detail.urgent') }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
