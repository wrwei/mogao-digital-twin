/**
 * Cave List Component
 * Full-page card layout for caves, with heritage assets detail view
 */
import CaveCard from './CaveCard.js';
import ModelViewer from './ModelViewer.js';
import SimulationPanel from './SimulationPanel.js';
import PigmentAnalysisPanel from './PigmentAnalysisPanel.js';
import * as Sim from '../services/SimulationEngine.js';
import LiveDataPanel from './LiveDataPanel.js';
import PredictionPanel from './PredictionPanel.js';
import SnapshotsPanel from './SnapshotsPanel.js';
import StatueForm from './StatueForm.js';
import MuralForm from './MuralForm.js';
import PaintingForm from './PaintingForm.js';
import InscriptionForm from './InscriptionForm.js';
import Skeleton from './Skeleton.js';
import EmptyState from './EmptyState.js';
import { parseHash, replaceHashParams } from '../utils/router.js';
import { useI18n } from '../i18n.js';
import { vFocusTrap } from '../utils/a11y.js';

export default {
    name: 'CaveList',
    inject: ['$confirm'],
    setup() {
        const { t } = useI18n();
        const isGuest = Vue.inject('isGuest', Vue.ref(false));
        const isAdmin = Vue.computed(() => {
            const user = JSON.parse(localStorage.getItem('mgemini-user') || 'null');
            return !!(user && user.role === 'admin');
        });
        return { t, isGuest, isAdmin };
    },
    directives: { focusTrap: vFocusTrap },
    components: {
        CaveCard, ModelViewer, SimulationPanel, PigmentAnalysisPanel, LiveDataPanel, PredictionPanel, SnapshotsPanel,
        StatueForm, MuralForm, PaintingForm, InscriptionForm, Skeleton, EmptyState
    },
    props: {
        caves: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        selectedGid: { type: String, default: null },
        pendingDrillIn: { type: Object, default: null }
    },
    emits: ['select', 'edit', 'delete', 'create', 'view-detail', 'drill-in-consumed'],
    data() {
        return {
            searchQuery: '',
            autoRotate: false,
            texturePixelData: null,
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
            // Right-side panel toggle — two tabs now (the merged simulation
            // stack stacks Pigment Analysis + Environmental Simulation cards;
            // monitoring stacks Live Data + Snapshots + Prediction cards).
            activePanel: 'simulation', // 'simulation' | 'monitoring'
            // Panel busy state
            panelBusy: false,
            textureProcessing: false
        };
    },
    mounted() {
        this.handleResize = () => { this.windowWidth = window.innerWidth; this.windowHeight = window.innerHeight; };
        window.addEventListener('resize', this.handleResize);
        if (this.pendingDrillIn) this._processDrillIn(this.pendingDrillIn);

        // Hydrate the search box from the URL so refresh / shared links
        // restore the filter; the watcher below writes it back via
        // replaceState (no history pollution per keystroke).
        const q = parseHash().params.q;
        if (q) this.searchQuery = q;
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
        async handleCreateSubmit() {
            // Refresh the asset list so the new item appears
            await this.fetchAllAssets();
            this.closeEdit();
        },
        async handleDeleteExhibit(type, item) {
            const apiMap = { statue: 'statues', mural: 'murals', painting: 'paintings', inscription: 'inscriptions' };
            const apiKey = apiMap[type];
            if (!apiKey) return;
            const name = item.name || item.gid;
            const typeLabel = { statue: this.t('entities.statue'), mural: this.t('entities.mural'), painting: this.t('entities.painting'), inscription: this.t('entities.inscription') }[type] || type;
            const _ok = await this.$confirm({
                message: `${this.t('actions.deleteConfirm', { entity: typeLabel })}\n\n"${name}"`,
                danger: true
            });
            if (!_ok) return;
            try {
                await window.api[apiKey].delete(item.gid);
                const listMap = { statue: this.statues, mural: this.murals, painting: this.paintings, inscription: this.inscriptions };
                const list = listMap[type];
                if (list) {
                    const idx = list.findIndex(i => i.gid === item.gid);
                    if (idx !== -1) list.splice(idx, 1);
                }
            } catch (err) {
                alert(this.t('actions.deleteError', { entity: typeLabel }) + ': ' + (err.response?.data?.message || err.message));
            }
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
        handlePixelDataReady(data) { this.texturePixelData = data; },
        handleTextureProcessing(v) { this.textureProcessing = v; },
        handleResetTexture() {
            if (this.$refs.modelViewer) this.$refs.modelViewer.resetTexture();
        },
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
            return map[this.editType] || '';
        },

        /**
         * Drill-in from MaintenanceQueue: locate the parent cave + artifact,
         * navigate into 3D mode, and pre-select the Prediction panel.
         */
        async _processDrillIn({ gid, type, caveGid }) {
            if (!gid || !caveGid) return;
            // Wait for caves to load if necessary
            let attempts = 0;
            while ((!this.caves || this.caves.length === 0) && attempts < 40) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            const cave = (this.caves || []).find(c => c.gid === caveGid);
            if (!cave) { this.$emit('drill-in-consumed'); return; }
            this.openCave(cave);
            // fetchAllAssets runs inside openCave; wait for it
            attempts = 0;
            while (this.assetsLoading && attempts < 60) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            const listMap = { statue: this.statues, mural: this.murals, painting: this.paintings, inscription: this.inscriptions };
            const list = listMap[type] || [];
            const exhibit = list.find(x => x.gid === gid);
            if (exhibit) {
                this.openExhibit3D(exhibit);
                // Maintenance-queue drill-in lands on the merged Environment
                // Monitoring tab where the Prediction card is stacked.
                this.activePanel = 'monitoring';
            }
            this.$emit('drill-in-consumed');
        }
    },
    watch: {
        searchQuery(q) { replaceHashParams({ q: q || null }); },
        pendingDrillIn(newVal) {
            if (newVal) this._processDrillIn(newVal);
        },
        /** Clear cross-exhibit state whenever the user opens a different 3D
         *  exhibit or returns to the cave view. Prevents pigment-map or
         *  simulation results from the previous exhibit bleeding into the new one. */
        selectedExhibit(newVal, oldVal) {
            if (newVal !== oldVal) {
                Sim.setPigmentMap(null);
                Sim.setPigmentDisplayMode('current');
                this.texturePixelData = null;
                this.activePanel = 'simulation';
                this.panelBusy = false;
                this.textureProcessing = false;
            }
        }
    },
    computed: {
        /** Bridge SimulationEngine's pigmentMap ref into Options-API
         *  reactivity so the template's `v-if="pigmentMap"` flips true
         *  the moment PigmentAnalysisPanel writes via Sim.setPigmentAnalysisResult. */
        pigmentMap() { return Sim.pigmentMap.value; },
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
        isEmpty() { return this.caves.length === 0; },
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
            <div v-if="editModal" class="modal-backdrop" @click.self="closeEdit"
                 v-focus-trap="{ onEscape: closeEdit }"
                 role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <div class="edit-modal-header-icon">{{ editItem ? '📝' : '➕' }}</div>
                        <div>
                            <div id="edit-modal-title" class="edit-modal-header-title">{{ editItem ? t('common.edit') : t('common.create') }} {{ editTypeLabel() }}</div>
                            <div class="edit-modal-header-sub">{{ editItem ? editItem.name || editItem.gid : '' }}</div>
                        </div>
                        <button class="edit-modal-close" @click="closeEdit"
                                :aria-label="t('common.close') || 'Close'">&times;</button>
                    </div>
                    <div class="edit-modal-body">
                        <statue-form v-if="editType === 'statue'" :statue="editItem" :mode="editItem ? 'edit' : 'create'"
                            @created="handleCreateSubmit" @updated="handleEditSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></statue-form>
                        <mural-form v-if="editType === 'mural'" :mural="editItem" :mode="editItem ? 'edit' : 'create'"
                            @created="handleCreateSubmit" @updated="handleEditSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></mural-form>
                        <painting-form v-if="editType === 'painting'" :painting="editItem" :mode="editItem ? 'edit' : 'create'"
                            @created="handleCreateSubmit" @updated="handleEditSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></painting-form>
                        <inscription-form v-if="editType === 'inscription'" :inscription="editItem" :mode="editItem ? 'edit' : 'create'"
                            @created="handleCreateSubmit" @updated="handleEditSubmit" @cancel="closeEdit" @error="(msg) => console.error(msg)"></inscription-form>
                    </div>
                </div>
            </div>

            <!-- ═══ LIST MODE ═══ -->
            <template v-if="mode === 'list'">
                <div class="page-breadcrumb">
                    <span class="breadcrumb-item">{{ t('nav.dashboard') }}</span>
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
                <skeleton v-if="loading" variant="grid-card" :count="6"></skeleton>
                <empty-state v-else-if="isEmpty"
                    icon="🏛️"
                    :title="t('empty.noEntityTitle')"
                    :description="t('empty.noEntityHint', { entity: t('entities.cave') })"
                    :action-label="!isGuest ? t('actions.createNew', { entity: t('entities.cave') }) : ''"
                    @action="$emit('create')"></empty-state>
                <empty-state v-else-if="filteredCaves.length === 0"
                    icon="🔍"
                    :title="t('empty.noResultsTitle')"
                    :description="t('empty.noResultsHint')"></empty-state>
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
                <!-- Top buttons -->
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <button class="project-action-btn" @click="backToList" style="padding: 6px 16px;">← {{ t('common.back') }}</button>
                    <button class="project-action-btn" style="color: var(--secondary-color); border-color: var(--secondary-color); padding: 6px 16px;" @click="$emit('edit', openedCave)">{{ t('common.edit') }}</button>
                </div>
                <div class="page-breadcrumb">
                    <span class="breadcrumb-link" @click="backToList">{{ t('entities.caves') }}</span>
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-current">{{ openedCave.name }}</span>
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
                    <div v-for="cat in assetCategories" :key="cat.key" class="cave-detail-section" style="margin-bottom: 16px;">
                        <!-- Section header -->
                        <div class="cave-detail-section-header" :style="{ borderLeft: '4px solid ' + cat.color }">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 18px; line-height: 1;">{{ cat.icon }}</span>
                                <span style="font-weight: 600; font-size: 14px; color: var(--text-primary); letter-spacing: 0.01em;">{{ cat.label }}</span>
                                <span :style="{ background: cat.color + '18', color: cat.color, fontSize: '11px', fontWeight: '700', padding: '1px 8px', borderRadius: '10px' }">{{ cat.items.length }}</span>
                            </div>
                            <button v-if="!isGuest" class="project-action-btn" style="font-size: 12px; padding: 4px 12px;" @click="openCreate(cat.type)">
                                + {{ t('actions.createNew', { entity: '' }).replace('  ', ' ').trim() || 'Add' }}
                            </button>
                        </div>

                        <!-- Empty state -->
                        <div v-if="cat.items.length === 0" style="padding: 20px 24px; text-align: center; color: var(--text-secondary); font-size: 13px; font-style: italic; background: white;">
                            {{ t('common.noData') }}
                        </div>

                        <!-- Compact row list -->
                        <div v-else style="background: white;">
                            <div v-for="(item, idx) in cat.items" :key="item.gid"
                                 :style="{
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '14px',
                                     padding: '11px 20px',
                                     borderTop: idx > 0 ? '1px solid #f0ece7' : 'none',
                                     transition: 'background 0.12s'
                                 }"
                                 @mouseenter="$event.currentTarget.style.background = '#fdfcfb'"
                                 @mouseleave="$event.currentTarget.style.background = 'white'">

                                <!-- Status colour strip -->
                                <div :style="{ width: '3px', height: '40px', borderRadius: '2px', background: statusColor(item.conservationStatus), flexShrink: 0 }"></div>

                                <!-- Name + metadata -->
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">{{ item.name || item.gid }}</span>
                                        <span v-if="item.conservationStatus"
                                              :style="{ background: statusColor(item.conservationStatus) + '20', color: statusColor(item.conservationStatus), fontSize: '11px', padding: '1px 8px', borderRadius: '10px', fontWeight: '600', textTransform: 'capitalize' }">
                                            {{ item.conservationStatus }}
                                        </span>
                                        <span v-if="item.reference && item.reference.modelLocation"
                                              style="background: #f0f4ff; color: #4f6ef7; font-size: 11px; padding: 1px 8px; border-radius: 10px; font-weight: 600;">
                                            3D
                                        </span>
                                    </div>
                                    <div style="display: flex; gap: 12px; margin-top: 3px; flex-wrap: wrap;">
                                        <span v-if="item.period" style="font-size: 12px; color: var(--text-secondary);">📅 {{ item.period }}</span>
                                        <span v-if="item.material" style="font-size: 12px; color: var(--text-secondary);">🧱 {{ item.material }}</span>
                                        <span v-if="item.technique" style="font-size: 12px; color: var(--text-secondary);">🖌️ {{ item.technique }}</span>
                                        <span v-if="item.language" style="font-size: 12px; color: var(--text-secondary);">🔤 {{ item.language }}</span>
                                        <span v-if="item.width && item.height" style="font-size: 12px; color: var(--text-secondary);">📐 {{ item.width }}×{{ item.height }}{{ item.depth ? '×'+item.depth : '' }}</span>
                                    </div>
                                </div>

                                <!-- Action buttons -->
                                <div style="display: flex; gap: 6px; flex-shrink: 0;">
                                    <button class="project-action-btn project-action-open"
                                            @click="openExhibit3D(item)"
                                            style="padding: 4px 12px; font-size: 12px;">
                                        {{ t('common.detail') || 'Open' }}
                                    </button>
                                    <button class="project-action-btn"
                                            @click="openEdit(cat.type, item)"
                                            style="padding: 4px 12px; font-size: 12px;">
                                        ✏️ {{ t('common.edit') }}
                                    </button>
                                    <button v-if="!isGuest"
                                            class="project-action-btn project-action-delete"
                                            @click="handleDeleteExhibit(cat.type, item)"
                                            style="padding: 4px 12px; font-size: 12px;">
                                        {{ t('common.delete') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </template>

            <!-- ═══ 3D VIEWER MODE ═══ -->
            <template v-if="mode === '3d' && selectedExhibit">
                <div class="page-breadcrumb">
                    <span class="breadcrumb-link" @click="backToList">{{ t('entities.caves') }}</span>
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-link" @click="backToCave">{{ openedCave ? openedCave.name : '' }}</span>
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-current">{{ selectedExhibit.name }}</span>
                </div>
                <div class="tool-buttons-bar">
                    <button class="tool-btn" :class="{ active: activePanel === 'simulation' }"  :disabled="panelBusy || textureProcessing" @click="activePanel = 'simulation'">{{ t('simulation.title') }}</button>
                    <button class="tool-btn" :class="{ active: activePanel === 'monitoring' }"  :disabled="panelBusy || textureProcessing" @click="activePanel = 'monitoring'">{{ t('liveData.title') }}</button>
                </div>
                <div style="flex: 1; display: flex; flex-direction: row; padding: 16px; overflow: hidden;">
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding-right: 8px; overflow-y: auto;">
                        <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; margin: auto 0;">
                            <model-viewer ref="modelViewer" :asset-reference="selectedExhibit.reference" v-model:autoRotate="autoRotate" :width="viewerWidth" :height="viewerHeight" @pixel-data-ready="handlePixelDataReady" @processing-changed="handleTextureProcessing"></model-viewer>
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
                    <div :style="{ width: simulationPanelWidth + 'px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', paddingLeft: '8px' }">
                        <!-- Simulation: pigment analysis is the gateway; environmental
                             simulation card stacks below it once a pigment map exists. -->
                        <template v-if="activePanel === 'simulation'">
                            <pigment-analysis-panel :pixel-data="texturePixelData" :entity="selectedExhibit" @busy-changed="panelBusy = $event"></pigment-analysis-panel>
                            <simulation-panel v-if="pigmentMap" :entity="selectedExhibit" :pixel-data="texturePixelData" :texture-processing="textureProcessing" @reset-texture="handleResetTexture" @busy-changed="panelBusy = $event"></simulation-panel>
                        </template>
                        <!-- Environment Monitoring: live data, snapshots, prediction stacked. -->
                        <template v-if="activePanel === 'monitoring'">
                            <live-data-panel :entity="selectedExhibit" :is-admin="isAdmin" @busy-changed="panelBusy = $event"></live-data-panel>
                            <snapshots-panel :entity="selectedExhibit" :is-admin="isAdmin" @busy-changed="panelBusy = $event"></snapshots-panel>
                            <prediction-panel :entity="selectedExhibit" @busy-changed="panelBusy = $event"></prediction-panel>
                        </template>
                    </div>
                </div>
            </template>
        </div>
    `
};
