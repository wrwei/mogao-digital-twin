/**
 * Mural List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 壁画 with search and filter
 */
import MuralCard from './MuralCard.js';
import ModelViewer from './ModelViewer.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'MuralList',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    components: {
        MuralCard,
        ModelViewer
    },
    props: {
        murals: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        selectedGid: {
            type: String,
            default: null
        }
    },
    emits: ['select', 'edit', 'delete', 'create', 'view-detail'],
    data() {
        return {
            searchQuery: '',
            sortBy: 'name',
            sortDesc: false,
            autoRotate: false,
            viewerWidth: 800,
            viewerHeight: 600
        };
    },
    computed: {
        filteredMurals() {
            let results = [...this.murals];

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                results = results.filter(item =>
                    (item.name && item.name.toLowerCase().includes(query)) ||
                    (item.description && item.description.toLowerCase().includes(query)) ||
                    (item.gid && item.gid.toLowerCase().includes(query))
                );
            }

            // Sort
            results.sort((a, b) => {
                const aVal = a[this.sortBy] || '';
                const bVal = b[this.sortBy] || '';
                const comparison = aVal.toString().localeCompare(bVal.toString());
                return this.sortDesc ? -comparison : comparison;
            });

            return results;
        },
        isEmpty() {
            return this.murals.length === 0;
        },
        selectedItem() {
            if (!this.selectedGid) return null;
            return this.murals.find(item => item.gid === this.selectedGid);
        }
    },
    template: `
        <div class="mural-list-container" style="display: grid; grid-template-columns: 400px 1fr; height: calc(100vh - 140px); gap: 0;">
            <!-- Left Panel: List -->
            <div class="entity-list-panel" style="border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column;">
                <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                        <h2 style="margin: 0; font-size: 1.2em;">{{ t('entities.murals') }}</h2>
                        <button class="btn btn-sm btn-primary" @click="$emit('create')">
                            ➕
                        </button>
                    </div>

                    <div class="search-bar">
                        <span class="search-icon">🔍</span>
                        <input
                            type="text"
                            v-model="searchQuery"
                            class="search-input"
                            :placeholder="t('common.search')"
                        />
                    </div>
                </div>

                <div class="list-body" style="flex: 1; overflow-y: auto; padding: var(--spacing-sm);">
                    <div v-if="loading" class="loading-overlay">
                        <div class="spinner"></div>
                        <p style="margin-top: var(--spacing-md); color: var(--text-secondary);">{{ t('common.loading') }}</p>
                    </div>

                    <div v-else-if="isEmpty" class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">{{ t('common.noData') }}</div>
                        <button class="btn btn-primary" @click="$emit('create')">
                            {{ t('actions.createNew', { entity: t('entities.mural') }) }}
                        </button>
                    </div>

                    <div v-else-if="filteredMurals.length === 0" class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-text">{{ t('common.noData') }}</div>
                    </div>

                    <div v-else class="entity-cards" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <mural-card
                            v-for="item in filteredMurals"
                            :key="item.gid"
                            :mural="item"
                            :selected-gid="selectedGid"
                            @select="$emit('select', item)"
                            @view-detail="$emit('view-detail', item)"
                            @edit="$emit('edit', item)"
                            @delete="$emit('delete', item)"
                        ></mural-card>                    </div>
                </div>

                <div class="list-footer" style="padding: var(--spacing-sm); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary); font-size: 0.9em;">
                    {{ filteredMurals.length }} {{ t('entities.mural') }}
                    <span v-if="searchQuery">({{ t('common.filtered') }})</span>
                </div>
            </div>

            <!-- Right Panel: 3D Viewer -->
            <div class="entity-viewer-panel" style="display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); padding: var(--spacing-lg);">
                <div v-if="selectedItem && selectedItem.reference && selectedItem.reference.modelLocation" class="viewer-container" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <h3 style="margin-bottom: var(--spacing-md);">{{ selectedItem.name }}</h3>
                    <model-viewer
                        :asset-reference="selectedItem.reference"
                        :width="viewerWidth"
                        :height="viewerHeight"
                        :auto-rotate="autoRotate"
                    ></model-viewer>
                    <div class="viewer-controls" style="margin-top: var(--spacing-md);">
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" v-model="autoRotate" />
                            <span>{{ t('viewer.autoRotate') }}</span>
                        </label>
                    </div>
                </div>
                <div v-else-if="selectedItem" class="viewer-placeholder" style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 4em; margin-bottom: var(--spacing-md);">🏛️</div>
                    <p>{{ t('viewer.noModel') }}</p>
                    <p class="text-muted">{{ selectedItem.name }}</p>
                </div>
                <div v-else class="viewer-empty" style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 4em; margin-bottom: var(--spacing-md);">👈</div>
                    <p>{{ t('viewer.selectItem') }}</p>
                </div>
            </div>
        </div>
    `
};
