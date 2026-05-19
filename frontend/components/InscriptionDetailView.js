/**
 * Inscription Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 铭文 with 3D viewer support
 */
import { useI18n } from '../i18n.js';
import DefectsPanel from './DefectsPanel.js';

export default {
    name: 'InscriptionDetailView',
    components: { DefectsPanel },
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

            <!-- Defects: per-exhibit observation log -->
            <div class="info-section defects-section">
                <defects-panel :exhibit-gid="inscription.gid" :initial-defects="inscription.defects || []"></defects-panel>
            </div>
        </div>
    `
};
