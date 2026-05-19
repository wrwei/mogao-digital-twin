/**
 * Statue Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 雕像 with 3D viewer support
 */
import { useI18n } from '../i18n.js';
import DefectsPanel from './DefectsPanel.js';

export default {
    name: 'StatueDetailView',
    components: { DefectsPanel },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        statue: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    computed: {
        displayName() {
            return this.statue.name || this.statue.gid || '雕像';
        }
    },
    template: `
        <div class="detail-view">
            <!-- Title with Badge -->
            <div class="detail-title-bar">
                <h2 class="detail-title">{{ displayName }}</h2>
                <span class="badge badge-lg" :class="'badge-' + (statue.conservationStatus || 'unknown').toLowerCase()">
                    {{ statue.conservationStatus ? t('conservationStatus.' + statue.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>

            <!-- Basic Information Section -->
            <div class="info-section">
                <h3 class="section-header">{{ t('detail.basicInfo') }}</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.name') }}</span>
                        <span class="info-value">
                            {{ statue.name || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.description') }}</span>
                        <span class="info-value">
                            {{ statue.description || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.label') }}</span>
                        <span class="info-value">
                            {{ statue.label || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.creationPeriod') }}</span>
                        <span class="info-value">
                            {{ statue.creationPeriod || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.lastInspectionDate') }}</span>
                        <span class="info-value">
                            {{ statue.lastInspectionDate || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.inspectionNotes') }}</span>
                        <span class="info-value">
                            {{ statue.inspectionNotes || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.material') }}</span>
                        <span class="info-value">
                            {{ statue.material || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.period') }}</span>
                        <span class="info-value">
                            {{ statue.period || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.conservationStatus') }}</span>
                        <span class="info-value">
                            {{ statue.conservationStatus || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.width') }}</span>
                        <span class="info-value">
                            {{ statue.width || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.depth') }}</span>
                        <span class="info-value">
                            {{ statue.depth || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.height') }}</span>
                        <span class="info-value">
                            {{ statue.height || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.subject') }}</span>
                        <span class="info-value">
                            {{ statue.subject || 'N/A' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Asset Reference Section -->
            <div v-if="statue.reference" class="info-section">
                <h3 class="section-header">{{ t('detail.assetReference') }}</h3>
                <div class="info-grid">
                    <div class="info-row" v-if="statue.reference.modelLocation">
                        <span class="info-label">{{ t('detail.modelPath') }}</span>
                        <span class="info-value info-path">{{ statue.reference.modelLocation }}</span>
                    </div>
                    <div class="info-row" v-if="statue.reference.metadataLocation">
                        <span class="info-label">{{ t('detail.metadataPath') }}</span>
                        <span class="info-value info-path">{{ statue.reference.metadataLocation }}</span>
                    </div>
                    <div class="info-row" v-if="statue.reference.textureLocation">
                        <span class="info-label">{{ t('detail.texturePath') }}</span>
                        <span class="info-value info-path">{{ statue.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>

            <!-- Defects: per-exhibit observation log -->
            <div class="info-section defects-section">
                <defects-panel :exhibit-gid="statue.gid" :initial-defects="statue.defects || []"></defects-panel>
            </div>
        </div>
    `
};
