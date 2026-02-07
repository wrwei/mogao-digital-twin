/**
 * Statue List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 雕像 with search and filter
 */
import StatueCard from './StatueCard.js';
import ModelViewer from './ModelViewer.js';
import SimulationPanel from './SimulationPanel.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'StatueList',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    components: {
        StatueCard,
        ModelViewer,
        SimulationPanel
    },
    props: {
        statues: {
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
            simulationData: null,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            simulationPanelWidth: 480,
            isDragging: false,
            dragStartX: 0,
            dragStartWidth: 0
        };
    },
    mounted() {
        // Update viewer dimensions on window resize
        this.handleResize = () => {
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
        };
        window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
    },
    methods: {
        handleSimulationChanged(data) {
            this.simulationData = data;
            console.log('=== Statue Simulation Data ===', data);
            // Emit to parent or update environmental conditions
            // Future: Apply visual effects to 3D model based on simulation data
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
        filteredStatues() {
            let results = [...this.statues];

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
            return this.statues.length === 0;
        },
        selectedItem() {
            if (!this.selectedGid) return null;
            return this.statues.find(item => item.gid === this.selectedGid);
        }
    },
    mounted() {
        // Debug logging for layout sizes
        this.$nextTick(() => {
            setTimeout(() => {
                const container = document.querySelector('.statue-list-container');
                const viewerPanel = document.querySelector('.entity-viewer-panel');

                console.log('=== Statue List Layout Debug ===');
                if (container) {
                    console.log('Grid Container:', {
                        width: container.offsetWidth,
                        height: container.offsetHeight,
                        computedWidth: window.getComputedStyle(container).width
                    });
                }
                if (viewerPanel) {
                    console.log('Viewer Panel:', {
                        width: viewerPanel.offsetWidth,
                        height: viewerPanel.offsetHeight,
                        computedWidth: window.getComputedStyle(viewerPanel).width
                    });
                }
                console.log('Viewport width:', window.innerWidth);
                console.log('Expected viewer width:', window.innerWidth - 280);
            }, 500);
        });
    },
    template: `
        <div class="statue-list-container" style="display: grid; grid-template-columns: 280px 1fr; width: 100%; height: calc(100vh - 140px); gap: 0;">
            <!-- Left Panel: List -->
            <div class="entity-list-panel" style="border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; background: white;">
                <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                        <h2 style="margin: 0; font-size: 1.2em;">{{ t('entities.statues') }}</h2>
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
                            {{ t('actions.createNew', { entity: t('entities.statue') }) }}
                        </button>
                    </div>

                    <div v-else-if="filteredStatues.length === 0" class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-text">{{ t('common.noData') }}</div>
                    </div>

                    <div v-else class="entity-cards" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <statue-card
                            v-for="item in filteredStatues"
                            :key="item.gid"
                            :statue="item"
                            :selected-gid="selectedGid"
                            @select="$emit('select', item)"
                            @view-detail="$emit('view-detail', item)"
                            @edit="$emit('edit', item)"
                            @delete="$emit('delete', item)"
                        ></statue-card>                    </div>
                </div>

                <div class="list-footer" style="padding: var(--spacing-sm); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary); font-size: 0.9em;">
                    {{ filteredStatues.length }} {{ t('entities.statue') }}
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
                                :simulation-data="simulationData"
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
                            @simulation-changed="handleSimulationChanged"
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
