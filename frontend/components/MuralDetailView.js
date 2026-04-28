/**
 * Mural Detail View Component
 * Auto-generated from mogao_dt.ecore
 * Full detail view for 壁画 with 3D viewer support
 */
import { useI18n } from '../i18n.js';
import DefectsPanel from './DefectsPanel.js';

export default {
    name: 'MuralDetailView',
    components: { DefectsPanel },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        mural: {
            type: Object,
            required: true
        }
    },
    emits: ['close', 'edit', 'delete'],
    computed: {
        displayName() {
            return this.mural.name || this.mural.gid || '壁画';
        }
    },
    template: `
        <div class="detail-view">
            <!-- Title with Badge -->
            <div class="detail-title-bar">
                <h2 class="detail-title">{{ displayName }}</h2>
                <span class="badge badge-lg" :class="'badge-' + (mural.conservationStatus || 'unknown').toLowerCase()">
                    {{ mural.conservationStatus ? t('conservationStatus.' + mural.conservationStatus.toLowerCase()) : t('conservationStatus.unknown') }}
                </span>
            </div>

            <!-- Basic Information Section -->
            <div class="info-section">
                <h3 class="section-header">{{ t('detail.basicInfo') }}</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.name') }}</span>
                        <span class="info-value">
                            {{ mural.name || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.description') }}</span>
                        <span class="info-value">
                            {{ mural.description || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.label') }}</span>
                        <span class="info-value">
                            {{ mural.label || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.creationPeriod') }}</span>
                        <span class="info-value">
                            {{ mural.creationPeriod || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.lastInspectionDate') }}</span>
                        <span class="info-value">
                            {{ mural.lastInspectionDate || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.inspectionNotes') }}</span>
                        <span class="info-value">
                            {{ mural.inspectionNotes || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.material') }}</span>
                        <span class="info-value">
                            {{ mural.material || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.period') }}</span>
                        <span class="info-value">
                            {{ mural.period || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.conservationStatus') }}</span>
                        <span class="info-value">
                            {{ mural.conservationStatus || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.width') }}</span>
                        <span class="info-value">
                            {{ mural.width || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.height') }}</span>
                        <span class="info-value">
                            {{ mural.height || 'N/A' }}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">{{ t('fields.technique') }}</span>
                        <span class="info-value">
                            {{ mural.technique || 'N/A' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Asset Reference Section -->
            <div v-if="mural.reference" class="info-section">
                <h3 class="section-header">{{ t('detail.assetReference') }}</h3>
                <div class="info-grid">
                    <div class="info-row" v-if="mural.reference.modelLocation">
                        <span class="info-label">{{ t('detail.modelPath') }}</span>
                        <span class="info-value info-path">{{ mural.reference.modelLocation }}</span>
                    </div>
                    <div class="info-row" v-if="mural.reference.metadataLocation">
                        <span class="info-label">{{ t('detail.metadataPath') }}</span>
                        <span class="info-value info-path">{{ mural.reference.metadataLocation }}</span>
                    </div>
                    <div class="info-row" v-if="mural.reference.textureLocation">
                        <span class="info-label">{{ t('detail.texturePath') }}</span>
                        <span class="info-value info-path">{{ mural.reference.textureLocation }}</span>
                    </div>
                </div>
            </div>

            <!-- Defects: per-exhibit observation log -->
            <div class="info-section defects-section">
                <defects-panel :exhibit-gid="mural.gid" :initial-defects="mural.defects || []"></defects-panel>
            </div>
        </div>
    `
};
