/**
 * Cave List Component
 * Full-page card layout for caves, with heritage assets detail view
 */
import CaveCard from './CaveCard.js';
import ModelViewer from './ModelViewer.js';
import SimulationPanel from './SimulationPanel.js';
import StatueForm from './StatueForm.js';
import MuralForm from './MuralForm.js';
import PaintingForm from './PaintingForm.js';
import InscriptionForm from './InscriptionForm.js';
import StatueDetailView from './StatueDetailView.js';
import MuralDetailView from './MuralDetailView.js';
import PaintingDetailView from './PaintingDetailView.js';
import InscriptionDetailView from './InscriptionDetailView.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'CaveList',
    setup() {
        const { t } = useI18n();
        const isGuest = Vue.inject('isGuest', Vue.ref(false));
        return { t, isGuest };
    },
    components: {
        CaveCard, ModelViewer, SimulationPanel,
        StatueForm, MuralForm, PaintingForm, InscriptionForm,
        StatueDetailView, MuralDetailView, PaintingDetailView, InscriptionDetailView
    },
    props: {
        caves: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        selectedGid: { type: String, default: null }
    },
    emits: ['select', 'edit', 'delete', 'create', 'view-detail', 'navigate-dashboard'],
    data() {
        return {
            searchQuery: '',
            autoRotate: false,
            simulationData: null,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            simulationPanelWidth: 480,
            isDragging: false,
            dragStartX: 0,
            dragStartWidth: 0,
            statues: [], murals: [], paintings: [], inscriptions: [],
            assetsLoading: false,
            mode: 'list', // 'list' | 'cave' | '3d'
            openedCave: null,
            selectedExhibit: null,
            // Edit modal
            editModal: false,
            editType: null,
            editItem: null,
            // Detail drawer
            detailItem: null,
            detailType: null
        };
    },
    mounted() {
        this.handleResize = () => { this.windowWidth = window.innerWidth; this.windowHeight = window.innerHeight; };
        window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
        if (this.handleResize) window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        openCave(cave) {
            this.openedCave = cave;
            this.mode = 'cave';
            this.$emit('select', cave);
            this.fetchAllAssets();
        },
        backToList() { this.mode = 'list'; this.openedCave = null; this.selectedExhibit = null; this.closeEdit(); },
        openExhibit3D(exhibit) { this.selectedExhibit = exhibit; this.mode = '3d'; this.closeEdit(); },
        backToCave() { this.mode = 'cave'; this.selectedExhibit = null; },
        openDetail(type, item) { this.selectedExhibit = item; this.detailType = type; this.mode = '3d'; },
        closeDetail() { this.detailType = null; this.mode = 'cave'; this.selectedExhibit = null; },
        openEdit(type, item) { this.editType = type; this.editItem = item; this.editModal = true; },
        openCreate(type) { this.editType = type; this.editItem = null; this.editModal = true; },
        closeEdit() { this.editModal = false; this.editType = null; this.editItem = null; },
        async handleEditSubmit(data) {
            const listMap = { statue: this.statues, mural: this.murals, painting: this.paintings, inscription: this.inscriptions };
            const list = listMap[this.editType];
            if (list && this.editItem) {
                const idx = list.findIndex(i => i.gid === this.editItem.gid);
                if (idx !== -1) list[idx] = { ...list[idx], ...data };
            }
            this.closeEdit();
        },
        async handleCreateSubmit(data) {
            // Form already called api.create() — just refresh the list
            await this.fetchAllAssets();
            this.closeEdit();
        },
        async fetchAllAssets() {
            this.assetsLoading = true;
            try {
                const [s, m, p, i] = await Promise.all([
                    window.api.statues.getAll(), window.api.murals.getAll(),
                    window.api.paintings.getAll(), window.api.inscriptions.getAll()
                ]);
                this.statues = s.data || []; this.murals = m.data || [];
                this.paintings = p.data || []; this.inscriptions = i.data || [];
            } catch (err) { console.error('Failed to fetch heritage assets:', err); }
            finally { this.assetsLoading = false; }
        },
        handleSimulationChanged(data) { this.simulationData = data; },
        statusColor(status) {
            return { excellent: '#10b981', good: '#3b82f6', fair: '#f59e0b', poor: '#ef4444', critical: '#dc2626' }[status] || '#6b7280';
        },
        startDrag(e) {
            this.isDragging = true; this.dragStartX = e.clientX; this.dragStartWidth = this.simulationPanelWidth;
            document.addEventListener('mousemove', this.onDrag); document.addEventListener('mouseup', this.stopDrag); e.preventDefault();
        },
        onDrag(e) { if (!this.isDragging) return; this.simulationPanelWidth = Math.max(300, Math.min(800, this.dragStartWidth + (this.dragStartX - e.clientX))); },
        stopDrag() { this.isDragging = false; document.removeEventListener('mousemove', this.onDrag); document.removeEventListener('mouseup', this.stopDrag); },
        onResizerMouseLeave(e) { if (!this.isDragging) e.target.style.background = '#e0dcd7'; },
        editTypeLabel() {
            const map = { statue: this.t('entities.statue'), mural: this.t('entities.mural'), painting: this.t('entities.painting'), inscription: this.t('entities.inscription') };
            return map[this.editType] || map[this.detailType] || '';
        }
    },
    computed: {
        viewerWidth() { return Math.max(500, this.windowWidth - 240 - this.simulationPanelWidth - 80); },
        viewerHeight() { return Math.max(400, this.windowHeight - 56 - 52 - 64); },
        filteredCaves() {
            let r = [...this.caves];
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                r = r.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q)));
            }
            return r;
        },
        totalAssets() { return this.statues.length + this.murals.length + this.paintings.length + this.inscriptions.length; },
        assetCategories() {
            return [
                { key: 'statues', type: 'statue', icon: '🗿', label: this.t('entities.statues'), items: this.statues, color: '#10b981' },
                { key: 'murals', type: 'mural', icon: '🎨', label: this.t('entities.murals'), items: this.murals, color: '#3b82f6' },
                { key: 'paintings', type: 'painting', icon: '🖼️', label: this.t('entities.paintings'), items: this.paintings, color: '#f59e0b' },
                { key: 'inscriptions', type: 'inscription', icon: '✍️', label: this.t('entities.inscriptions'), items: this.inscriptions, color: '#8b5cf6' }
            ];
        }
    },
    template: `
        <div class="page-view">

            <!-- ═══ EDIT MODAL (Principia-style centered dialog) ═══ -->
            <div v-if="editModal" class="modal-backdrop" @click.self="closeEdit">
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <div class="edit-modal-header-icon">{{ editItem ? '📝' : '➕' }}</div>
                        <div>
                            <div class="edit-modal-header-title">{{ editItem ? t('common.edit') : t('common.create') }} {{ editTypeLabel() }}</div>
                            <div class="edit-modal-header-sub">{{ editItem ? editItem.name || editItem.gid : '' }}</div>
                        </div>
                        <button class="edit-modal-close" @click="closeEdit">&times;</button>
                    </div>
                    <div class="edit-modal-body">
                        <statue-form v-if="editType === 'statue'" :statue="editItem" :mode="editItem ? 'edit' : 'create'"
                            @updated="handleEditSubmit" @created="handleCreateSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></statue-form>
                        <mural-form v-if="editType === 'mural'" :mural="editItem" :mode="editItem ? 'edit' : 'create'"
                            @updated="handleEditSubmit" @created="handleCreateSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></mural-form>
                        <painting-form v-if="editType === 'painting'" :painting="editItem" :mode="editItem ? 'edit' : 'create'"
                            @updated="handleEditSubmit" @created="handleCreateSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></painting-form>
                        <inscription-form v-if="editType === 'inscription'" :inscription="editItem" :mode="editItem ? 'edit' : 'create'"
                            @updated="handleEditSubmit" @created="handleCreateSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></inscription-form>
                    </div>
                </div>
            </div>

            <!-- ═══ LIST MODE ═══ -->
            <template v-if="mode === 'list'">
                <div class="page-breadcrumb">
                    <span class="breadcrumb-link" @click="$emit('navigate-dashboard')">{{ t('nav.dashboard') }}</span>
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-current">{{ t('entities.caves') }}</span>
                </div>
                <div class="page-header">
                    <div>
                        <h1 class="page-title">{{ t('entities.caves') }}</h1>
                        <p class="page-subtitle">{{ filteredCaves.length }} {{ t('entities.caves').toLowerCase() }} total</p>
                    </div>
                    <div class="page-header-actions">
                        <div class="page-search">
                            <span class="page-search-icon">🔍</span>
                            <input type="text" v-model="searchQuery" class="page-search-input" :placeholder="t('common.search') + '...'" />
                        </div>
                        <button v-if="!isGuest" class="btn" style="background: var(--secondary-color); color: white;" @click="$emit('create')">
                            + {{ t('actions.createNew', { entity: t('entities.cave') }) }}
                        </button>
                    </div>
                </div>
                <div class="page-section-label">{{ t('entities.caves').toUpperCase() }}</div>
                <div v-if="loading" style="display: flex; align-items: center; justify-content: center; padding: 80px;"><div class="spinner"></div></div>
                <div v-else-if="filteredCaves.length === 0" style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;">🏛️</div><p>{{ t('common.noData') }}</p>
                </div>
                <div v-else class="project-cards-grid">
                    <div v-for="cave in filteredCaves" :key="cave.gid" class="project-card" @click="openCave(cave)" style="cursor: pointer;">
                        <div class="project-card-badges">
                            <span class="project-badge project-badge-active">Active</span>
                            <span v-if="cave.creationPeriod" class="project-badge project-badge-neutral">{{ cave.creationPeriod }}</span>
                        </div>
                        <h3 class="project-card-title">{{ cave.name || t('entities.cave') }}</h3>
                        <p class="project-card-desc">{{ cave.description || t('common.noDescription') }}</p>
                        <div v-if="cave.label" class="project-card-meta"><span>🏷️ {{ cave.label }}</span></div>
                        <div v-if="cave.lastInspectionDate" class="project-card-meta"><span>📅 {{ new Date(cave.lastInspectionDate).toLocaleDateString() }}</span></div>
                        <div class="project-card-footer">
                            <div class="project-card-actions">
                                <button class="project-action-btn project-action-open" @click.stop="openCave(cave)">{{ t('common.detail') || 'Open' }}</button>
                                <button class="project-action-btn" @click.stop="$emit('edit', cave)">{{ t('common.edit') }}</button>
                                <button v-if="!isGuest" class="project-action-btn project-action-delete" @click.stop="$emit('delete', cave)">{{ t('common.delete') }}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ═══ CAVE DETAIL MODE (Principia project-style) ═══ -->
            <template v-if="mode === 'cave' && openedCave">
                <!-- Breadcrumb + actions -->
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <div class="page-breadcrumb" style="margin: 0; flex: 1;">
                        <span class="breadcrumb-link" @click="backToList">{{ t('entities.caves') }}</span>
                        <span class="breadcrumb-sep">/</span>
                        <span class="breadcrumb-current">{{ openedCave.name }}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="project-action-btn" style="color: var(--secondary-color); border-color: var(--secondary-color); padding: 6px 16px;" @click="$emit('edit', openedCave)">✏️ {{ t('common.edit') }}</button>
                        <button class="project-action-btn" @click="backToList" style="padding: 6px 16px;">✕ {{ t('common.close') }}</button>
                    </div>
                </div>

                <!-- Cave Info Card -->
                <div class="cave-detail-card">
                    <div class="cave-detail-card-inner">
                        <div class="cave-detail-avatar">{{ (openedCave.name || 'C')[0] }}</div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">{{ openedCave.name }}</h2>
                                <span class="project-badge project-badge-active">Active</span>
                                <span v-if="openedCave.creationPeriod" class="project-badge project-badge-neutral">{{ openedCave.creationPeriod }}</span>
                            </div>
                            <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 14px;">{{ openedCave.description }}</p>
                            <div style="margin-top: 10px; display: flex; gap: 20px; font-size: 12px; color: var(--text-secondary);">
                                <span v-if="openedCave.label">🏷️ {{ openedCave.label }}</span>
                                <span v-if="openedCave.lastInspectionDate">📅 {{ new Date(openedCave.lastInspectionDate).toLocaleDateString() }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stat cards row -->
                <div class="cave-stat-row">
                    <div class="cave-stat" v-for="cat in assetCategories" :key="cat.key">
                        <div class="cave-stat-icon" :style="{ background: cat.color + '15' }">
                            <span style="font-size: 22px;">{{ cat.icon }}</span>
                        </div>
                        <div>
                            <div class="cave-stat-num">{{ cat.items.length }}</div>
                            <div class="cave-stat-label">{{ cat.label }}</div>
                        </div>
                    </div>
                </div>

                <!-- Asset category sections -->
                <div v-if="assetsLoading" style="display: flex; align-items: center; justify-content: center; padding: 60px;"><div class="spinner"></div></div>
                <template v-else>
                    <div v-for="cat in assetCategories" :key="cat.key" class="cave-detail-section">
                        <div class="cave-detail-section-header">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">{{ cat.icon }}</span>
                                <span style="font-weight: 600; font-size: 15px;">{{ cat.label }}</span>
                                <span class="asset-category-count" :style="{ background: cat.color + '18', color: cat.color }">{{ cat.items.length }}</span>
                            </div>
                            <button class="project-action-btn" style="font-size: 12px;" @click="openCreate(cat.type)">+ {{ t('common.create') || 'Add' }}</button>
                        </div>

                        <div v-if="cat.items.length === 0" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px; font-style: italic;">
                            {{ t('common.noData') }}
                        </div>

                        <div v-else class="project-cards-grid">
                            <div v-for="item in cat.items" :key="item.gid" class="project-card" @click="openDetail(cat.type, item)" style="cursor: pointer;">
                                <div class="project-card-badges">
                                    <span v-if="item.conservationStatus" class="project-badge" :style="{ background: statusColor(item.conservationStatus), color: 'white' }">{{ item.conservationStatus }}</span>
                                    <span v-if="item.reference && item.reference.modelLocation" class="project-badge" style="background: var(--secondary-color); color: white;">3D</span>
                                </div>
                                <h3 class="project-card-title">{{ item.name || item.gid }}</h3>
                                <p class="project-card-desc">{{ item.description || t('common.noDescription') }}</p>
                                <div class="project-card-meta">
                                    <span v-if="item.period">📅 {{ item.period }}</span>
                                    <span v-if="item.material">🧱 {{ item.material }}</span>
                                    <span v-if="item.technique">🖌️ {{ item.technique }}</span>
                                    <span v-if="item.language">🔤 {{ item.language }}</span>
                                    <span v-if="item.width && item.height">📐 {{ item.width }}×{{ item.height }}{{ item.depth ? '×'+item.depth : '' }}</span>
                                </div>
                                <div class="project-card-footer">
                                    <div></div>
                                    <div class="project-card-actions">
                                        <button v-if="item.reference && item.reference.modelLocation" class="project-action-btn project-action-open" @click.stop="openExhibit3D(item)">🔬 3D View</button>
                                        <button class="project-action-btn" @click.stop="openEdit(cat.type, item)">✏️ {{ t('common.edit') }}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </template>

            <!-- ═══ 3D VIEWER MODE ═══ -->
            <template v-if="mode === '3d' && selectedExhibit">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <div class="page-breadcrumb" style="margin: 0; flex: 1;">
                        <span class="breadcrumb-link" @click="backToList">{{ t('entities.caves') }}</span>
                        <span class="breadcrumb-sep">/</span>
                        <span class="breadcrumb-link" @click="backToCave">{{ openedCave ? openedCave.name : '' }}</span>
                        <span class="breadcrumb-sep">/</span>
                        <span class="breadcrumb-current">{{ selectedExhibit.name }}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="project-action-btn" style="color: var(--secondary-color); border-color: var(--secondary-color); padding: 6px 16px;" @click="openEdit(detailType, selectedExhibit)">✏️ {{ t('common.edit') }}</button>
                        <button class="project-action-btn" @click="backToCave" style="padding: 6px 16px;">✕ {{ t('common.close') }}</button>
                    </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: row; padding: 16px; overflow: hidden;">
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding-right: 8px; overflow-y: auto;">
                        <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; margin: auto 0;">
                            <model-viewer :asset-reference="selectedExhibit.reference" :simulation-data="simulationData" v-model:autoRotate="autoRotate" :width="viewerWidth" :height="viewerHeight"></model-viewer>
                            <div style="margin-top: 12px; padding: 8px 16px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 13px; font-weight: 500;">
                                    <input type="checkbox" v-model="autoRotate" style="cursor: pointer; width: 16px; height: 16px; accent-color: #8B4513;" />
                                    <span>{{ t('viewer.autoRotate') }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div @mousedown="startDrag" :style="{ width: '6px', cursor: 'col-resize', background: isDragging ? 'var(--primary-color)' : '#e0dcd7', borderRadius: '3px', transition: isDragging ? 'none' : 'background 0.2s', flexShrink: 0, position: 'relative', userSelect: 'none', margin: '0 2px' }" @mouseenter="$event.target.style.background = 'var(--primary-color)'" @mouseleave="onResizerMouseLeave">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 3px; height: 32px; background: white; border-radius: 2px; opacity: 0.6;"></div>
                    </div>
                    <div :style="{ width: simulationPanelWidth + 'px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', paddingLeft: '8px' }">
                        <simulation-panel :entity="selectedExhibit" @simulation-changed="handleSimulationChanged"></simulation-panel>
                    </div>
                </div>
            </template>
        </div>
    `
};
