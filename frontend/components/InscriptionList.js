/**
 * Inscription List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 铭文 with search and filter
 */
import InscriptionCard from './InscriptionCard.js';
import ModelViewer from './ModelViewer.js';
import SimulationPanel from './SimulationPanel.js';
import Skeleton from './Skeleton.js';
import EmptyState from './EmptyState.js';
import { parseHash, replaceHashParams } from '../utils/router.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'InscriptionList',
    setup() {
        const { t } = useI18n();
        const isGuest = Vue.inject('isGuest', Vue.ref(false));
        return { t, isGuest };
    },
    components: {
        InscriptionCard,
        ModelViewer,
        SimulationPanel,
        Skeleton,
        EmptyState
    },
    props: {
        inscriptions: {
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
    emits: ['select', 'edit', 'delete', 'create', 'view-detail', 'bulk-delete'],
    data() {
        return {
            searchQuery: '',
            sortBy: 'name',
            sortDesc: false,
            autoRotate: false,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            simulationPanelWidth: 480,
            isDragging: false,
            dragStartX: 0,
            dragStartWidth: 0,
            // Bulk-selection (F6).
            selectedBulkIds: []
        };
    },
    mounted() {
        // Update viewer dimensions on window resize
        this.handleResize = () => {
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
        };
        window.addEventListener('resize', this.handleResize);

        // Hydrate the search box from the URL so refresh / shared links
        // restore the filter; the watcher writes it back via replaceState.
        const q = parseHash().params.q;
        if (q) this.searchQuery = q;
    },
    watch: {
        searchQuery(q) { replaceHashParams({ q: q || null }); },
        inscriptions: {
            handler(arr) {
                if (!this.selectedBulkIds.length) return;
                const present = new Set((arr || []).map(i => i.gid));
                this.selectedBulkIds = this.selectedBulkIds.filter(id => present.has(id));
            }
        }
    },
    beforeUnmount() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
    },
    methods: {
        toggleBulkSelection(item) {
            const idx = this.selectedBulkIds.indexOf(item.gid);
            if (idx === -1) this.selectedBulkIds.push(item.gid);
            else this.selectedBulkIds.splice(idx, 1);
        },
        clearBulkSelection() { this.selectedBulkIds = []; },
        emitBulkDelete() {
            const items = (this.inscriptions || []).filter(i => this.selectedBulkIds.includes(i.gid));
            if (items.length) this.$emit('bulk-delete', items);
        },
        startDrag(event) {
            this.isDragging = true;
            this.dragStartX = event.clientX;
            this.dragStartWidth = this.simulationPanelWidth;
            document.addEventListener('mousemove', this.onDrag);
            document.addEventListener('mouseup', this.stopDrag);
            event.preventDefault();
        },
        onDrag(event) {
            if (!this.isDragging) return;
            const deltaX = this.dragStartX - event.clientX;
            const newWidth = Math.max(300, Math.min(800, this.dragStartWidth + deltaX));
            this.simulationPanelWidth = newWidth;
        },
        stopDrag() {
            this.isDragging = false;
            document.removeEventListener('mousemove', this.onDrag);
            document.removeEventListener('mouseup', this.stopDrag);
        },
        onResizerMouseLeave(event) {
            if (!this.isDragging) {
                event.target.style.background = '#ddd';
            }
        }
    },
    computed: {
        viewerWidth() {
            // Container width minus left panel (280px), simulation panel (dynamic), gaps and padding (96px)
            return Math.max(500, this.windowWidth - 280 - this.simulationPanelWidth - 96);
        },
        viewerHeight() {
            // Container height minus header (140px), controls (40px), and padding (64px)
            // Full height available since panels are side by side
            return Math.max(400, this.windowHeight - 140 - 40 - 64);
        },
        filteredInscriptions() {
            let results = [...this.inscriptions];

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
            return this.inscriptions.length === 0;
        },
        selectedItem() {
            if (!this.selectedGid) return null;
            return this.inscriptions.find(item => item.gid === this.selectedGid);
        }
    },
    template: `
        <div class="inscription-list-container" style="display: grid; grid-template-columns: 280px 1fr; width: 100%; height: calc(100vh - 140px); gap: 0;">
            <!-- Left Panel: List -->
            <div class="entity-list-panel" style="border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; background: white;">
                <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                        <h2 style="margin: 0; font-size: 1.2em;">{{ t('entities.inscriptions') }}</h2>
                        <button v-if="!isGuest" class="btn btn-sm btn-primary" @click="$emit('create')">
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
                    <skeleton v-if="loading" variant="row" :count="6"></skeleton>

                    <empty-state v-else-if="isEmpty"
                        icon="📭"
                        :title="t('empty.noEntityTitle')"
                        :description="t('empty.noEntityHint', { entity: t('entities.inscription') })"
                        :action-label="!isGuest ? t('actions.createNew', { entity: t('entities.inscription') }) : ''"
                        @action="$emit('create')"></empty-state>

                    <empty-state v-else-if="filteredInscriptions.length === 0"
                        icon="🔍"
                        :title="t('empty.noResultsTitle')"
                        :description="t('empty.noResultsHint')"></empty-state>

                    <div v-else>
                        <div v-if="selectedBulkIds.length > 0" class="bulk-action-bar" role="region" aria-live="polite">
                            <span class="bulk-count">{{ t('actions.bulkSelected', { count: selectedBulkIds.length }) }}</span>
                            <button class="btn btn-sm btn-danger" @click="emitBulkDelete">
                                {{ t('actions.bulkDelete') }}
                            </button>
                            <button class="btn btn-sm" @click="clearBulkSelection">
                                {{ t('actions.clearSelection') }}
                            </button>
                        </div>
                        <div class="entity-cards" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <inscription-card
                                v-for="item in filteredInscriptions"
                                :key="item.gid"
                                :inscription="item"
                                :selected-gid="selectedGid"
                                :selected-for-bulk="selectedBulkIds.includes(item.gid)"
                                @toggle-bulk="toggleBulkSelection"
                                @select="$emit('select', item)"
                                @view-detail="$emit('view-detail', item)"
                                @edit="$emit('edit', item)"
                                @delete="$emit('delete', item)"
                            ></inscription-card>
                        </div>
                    </div>
                </div>

                <div class="list-footer" style="padding: var(--spacing-sm); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary); font-size: 0.9em;">
                    {{ filteredInscriptions.length }} {{ t('entities.inscription') }}
                    <span v-if="searchQuery">({{ t('common.filtered') }})</span>
                </div>
            </div>

            <!-- Right Panel: 3D Viewer + Simulation (Side by Side with Resizer) -->
            <div class="entity-viewer-panel" style="display: flex; align-items: stretch; width: 100%; height: 100%; background: #fafafa; padding: 0;">
                <div v-if="selectedItem && selectedItem.reference && selectedItem.reference.modelLocation" style="flex: 1; display: flex; flex-direction: row; padding: 16px; height: 100%; overflow: hidden;">
                    <!-- Left: 3D Model Viewer (takes remaining space) -->
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding-right: 8px; overflow-y: auto;">
                        <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; margin: auto 0;">
                            <model-viewer
                                :asset-reference="selectedItem.reference"
                                v-model:autoRotate="autoRotate"
                                :width="viewerWidth"
                                :height="viewerHeight"
                            ></model-viewer>
                            <!-- Auto Rotate Control (styled button below viewer) -->
                            <div style="margin-top: 16px; padding: 10px 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 14px; font-weight: 500;">
                                    <input type="checkbox" v-model="autoRotate" style="cursor: pointer; width: 18px; height: 18px;" />
                                    <span>{{ t('viewer.autoRotate') }}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Resizer Handle -->
                    <div
                        @mousedown="startDrag"
                        :style="{
                            width: '8px',
                            cursor: 'col-resize',
                            background: isDragging ? '#667eea' : '#ddd',
                            transition: isDragging ? 'none' : 'background 0.2s',
                            flexShrink: 0,
                            position: 'relative',
                            userSelect: 'none'
                        }"
                        @mouseenter="$event.target.style.background = '#667eea'"
                        @mouseleave="onResizerMouseLeave"
                    >
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 40px; background: white; border-radius: 2px; opacity: 0.7;"></div>
                    </div>

                    <!-- Right: Simulation Panel (resizable width) -->
                    <div :style="{
                        width: simulationPanelWidth + 'px',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflowY: 'auto',
                        scrollBehavior: 'smooth',
                        paddingLeft: '8px'
                    }">
                        <simulation-panel
                            :entity="selectedItem"
                        ></simulation-panel>
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
