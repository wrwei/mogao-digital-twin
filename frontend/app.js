/**
 * Mogao Digital Twin - Vue 3 App
 * Auto-generated from mogao_dt.ecore
 * Main application with model-driven entity management
 */

const { createApp } = Vue;

// ============================================
// Import i18n
// ============================================
import { useI18n } from './i18n.js';

// ============================================
// Generated Component Imports
// ============================================
// Cave Components
import CaveCard from './components/CaveCard.js';
import CaveForm from './components/CaveForm.js';
import CaveList from './components/CaveList.js';
import CaveDetailView from './components/CaveDetailView.js';
// Statue Components
import StatueCard from './components/StatueCard.js';
import StatueForm from './components/StatueForm.js';
import StatueList from './components/StatueList.js';
import StatueDetailView from './components/StatueDetailView.js';
// Mural Components
import MuralCard from './components/MuralCard.js';
import MuralForm from './components/MuralForm.js';
import MuralList from './components/MuralList.js';
import MuralDetailView from './components/MuralDetailView.js';
// Painting Components
import PaintingCard from './components/PaintingCard.js';
import PaintingForm from './components/PaintingForm.js';
import PaintingList from './components/PaintingList.js';
import PaintingDetailView from './components/PaintingDetailView.js';
// Inscription Components
import InscriptionCard from './components/InscriptionCard.js';
import InscriptionForm from './components/InscriptionForm.js';
import InscriptionList from './components/InscriptionList.js';
import InscriptionDetailView from './components/InscriptionDetailView.js';
// Defect Components
import DefectCard from './components/DefectCard.js';
import DefectForm from './components/DefectForm.js';
import DefectList from './components/DefectList.js';
import DefectDetailView from './components/DefectDetailView.js';

// ============================================
// Generated Composable Imports
// ============================================
import { useCaves } from './composables/useCaves.js';
import { useStatues } from './composables/useStatues.js';
import { useMurals } from './composables/useMurals.js';
import { usePaintings } from './composables/usePaintings.js';
import { useInscriptions } from './composables/useInscriptions.js';
import { useDefects } from './composables/useDefects.js';

// ============================================
// Shared UI Components
// ============================================
const AppHeader = {
    props: ['currentView', 'locale'],
    emits: ['change-view', 'change-locale'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="app-header" style="background: var(--primary-color); color: white; padding: var(--spacing-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                <h1 style="margin: 0; font-size: 24px;">🏛️ {{ locale === 'zh' ? '莫高窟数字孪生' : 'Mogao Digital Twin' }}</h1>
                <div style="display: flex; gap: var(--spacing-sm);">
                    <button @click="$emit('change-locale', 'zh')"
                            class="btn btn-sm"
                            :class="locale === 'zh' ? 'btn-secondary' : 'btn-outline'">
                        🇨🇳 中文
                    </button>
                    <button @click="$emit('change-locale', 'en')"
                            class="btn btn-sm"
                            :class="locale === 'en' ? 'btn-secondary' : 'btn-outline'">
                        🇬🇧 English
                    </button>
                </div>
            </div>
            <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
                <button @click="$emit('change-view', 'caves')"
                        class="btn btn-sm"
                        :class="currentView === 'caves' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.caves') }}
                </button>
                <button @click="$emit('change-view', 'statues')"
                        class="btn btn-sm"
                        :class="currentView === 'statues' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.statues') }}
                </button>
                <button @click="$emit('change-view', 'murals')"
                        class="btn btn-sm"
                        :class="currentView === 'murals' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.murals') }}
                </button>
                <button @click="$emit('change-view', 'paintings')"
                        class="btn btn-sm"
                        :class="currentView === 'paintings' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.paintings') }}
                </button>
                <button @click="$emit('change-view', 'inscriptions')"
                        class="btn btn-sm"
                        :class="currentView === 'inscriptions' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.inscriptions') }}
                </button>
                <button @click="$emit('change-view', 'defects')"
                        class="btn btn-sm"
                        :class="currentView === 'defects' ? 'btn-secondary' : 'btn-outline'">
                    {{ t('entities.defects') }}
                </button>
            </div>
        </div>
    `
};

const LoadingSpinner = {
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p style="margin-top: var(--spacing-md); color: var(--text-secondary);">{{ t('common.loading') }}</p>
        </div>
    `
};

const ErrorMessage = {
    props: ['message'],
    emits: ['dismiss'],
    template: `
        <div style="background: var(--error-color); color: white; padding: var(--spacing-md); margin: var(--spacing-md); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <span>⚠️ {{ message }}</span>
            <button @click="$emit('dismiss')" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 20px;">&times;</button>
        </div>
    `
};

const ModalDialog = {
    props: ['title', 'show', 'wide'],
    emits: ['close'],
    template: `
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="modal" :style="wide ? 'min-width: 500px; max-width: 95vw; width: auto;' : 'min-width: 500px;'">
                <div class="modal-header">
                    <h3 class="modal-title">{{ title }}</h3>
                    <button class="modal-close" @click="$emit('close')">&times;</button>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
};

// ============================================
// Generated Entity View Components
// ============================================

const CaveView = {
    components: {
        CaveList,
        CaveForm,
        CaveCard,
        CaveDetailView,
        ModalDialog,
    },
    setup() {
        const composable = useCaves();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.cave') }))) {
                try {
                    await this.deleteCave(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.cave') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.cave') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateCave(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.cave') }), 'success');
                } else {
                    await this.createCave(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.cave') }), 'success');
                }
                this.showForm = false;
                await this.fetchCaves();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.cave') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectCave(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchCaves();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.cave') : t('actions.createNew', { entity: t('entities.cave') })" @close="handleFormCancel">
                <cave-form
                    :cave="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></cave-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <cave-detail-view
                    v-if="detailItem"
                    :cave="detailItem"
                ></cave-detail-view>            </modal-dialog>

            <cave-list
                :caves="caves"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></cave-list>        </div>
    `
};

const StatueView = {
    components: {
        StatueList,
        StatueForm,
        StatueCard,
        StatueDetailView,
        ModalDialog,
    },
    setup() {
        const composable = useStatues();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.statue') }))) {
                try {
                    await this.deleteStatue(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.statue') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.statue') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateStatue(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.statue') }), 'success');
                } else {
                    await this.createStatue(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.statue') }), 'success');
                }
                this.showForm = false;
                await this.fetchStatues();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.statue') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectStatue(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchStatues();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.statue') : t('actions.createNew', { entity: t('entities.statue') })" @close="handleFormCancel">
                <statue-form
                    :statue="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></statue-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <statue-detail-view
                    v-if="detailItem"
                    :statue="detailItem"
                ></statue-detail-view>            </modal-dialog>

            <statue-list
                :statues="statues"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></statue-list>        </div>
    `
};

const MuralView = {
    components: {
        MuralList,
        MuralForm,
        MuralCard,
        MuralDetailView,
        ModalDialog,
    },
    setup() {
        const composable = useMurals();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.mural') }))) {
                try {
                    await this.deleteMural(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.mural') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.mural') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateMural(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.mural') }), 'success');
                } else {
                    await this.createMural(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.mural') }), 'success');
                }
                this.showForm = false;
                await this.fetchMurals();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.mural') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectMural(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchMurals();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.mural') : t('actions.createNew', { entity: t('entities.mural') })" @close="handleFormCancel">
                <mural-form
                    :mural="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></mural-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <mural-detail-view
                    v-if="detailItem"
                    :mural="detailItem"
                ></mural-detail-view>            </modal-dialog>

            <mural-list
                :murals="murals"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></mural-list>        </div>
    `
};

const PaintingView = {
    components: {
        PaintingList,
        PaintingForm,
        PaintingCard,
        PaintingDetailView,
        ModalDialog,
    },
    setup() {
        const composable = usePaintings();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.painting') }))) {
                try {
                    await this.deletePainting(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.painting') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.painting') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updatePainting(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.painting') }), 'success');
                } else {
                    await this.createPainting(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.painting') }), 'success');
                }
                this.showForm = false;
                await this.fetchPaintings();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.painting') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectPainting(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchPaintings();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.painting') : t('actions.createNew', { entity: t('entities.painting') })" @close="handleFormCancel">
                <painting-form
                    :painting="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></painting-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <painting-detail-view
                    v-if="detailItem"
                    :painting="detailItem"
                ></painting-detail-view>            </modal-dialog>

            <painting-list
                :paintings="paintings"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></painting-list>        </div>
    `
};

const InscriptionView = {
    components: {
        InscriptionList,
        InscriptionForm,
        InscriptionCard,
        InscriptionDetailView,
        ModalDialog,
    },
    setup() {
        const composable = useInscriptions();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.inscription') }))) {
                try {
                    await this.deleteInscription(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.inscription') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.inscription') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateInscription(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.inscription') }), 'success');
                } else {
                    await this.createInscription(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.inscription') }), 'success');
                }
                this.showForm = false;
                await this.fetchInscriptions();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.inscription') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectInscription(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchInscriptions();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.inscription') : t('actions.createNew', { entity: t('entities.inscription') })" @close="handleFormCancel">
                <inscription-form
                    :inscription="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></inscription-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <inscription-detail-view
                    v-if="detailItem"
                    :inscription="detailItem"
                ></inscription-detail-view>            </modal-dialog>

            <inscription-list
                :inscriptions="inscriptions"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></inscription-list>        </div>
    `
};

const DefectView = {
    components: {
        DefectList,
        DefectForm,
        DefectCard,
        DefectDetailView,
        ModalDialog,
    },
    setup() {
        const composable = useDefects();
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showForm = true;
        },
        async handleDelete(item) {
            if (confirm(this.t('actions.deleteConfirm', { entity: this.t('entities.defect') }))) {
                try {
                    await this.deleteDefect(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.defect') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.defect') }) + ': ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateDefect(this.editingItem.gid, data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.defect') }), 'success');
                } else {
                    await this.createDefect(data);
                    this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.defect') }), 'success');
                }
                this.showForm = false;
                await this.fetchDefects();
            } catch (err) {
                this.$emit('show-message', this.t('actions.saveError', { entity: this.t('entities.defect') }) + ': ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectDefect(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.detailItem = item;
            this.showDetail = true;
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
        }
    },
    mounted() {
        this.fetchDefects();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.defect') : t('actions.createNew', { entity: t('entities.defect') })" @close="handleFormCancel">
                <defect-form
                    :defect="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></defect-form>            </modal-dialog>

            <modal-dialog :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail" :wide="true">
                <defect-detail-view
                    v-if="detailItem"
                    :defect="detailItem"
                ></defect-detail-view>            </modal-dialog>

            <defect-list
                :defects="defects"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></defect-list>        </div>
    `
};

// ============================================
// Main App Component
// ============================================
const app = createApp({
    components: {
        AppHeader,
        LoadingSpinner,
        ErrorMessage,
        ModalDialog,
        CaveView,
        StatueView,
        MuralView,
        PaintingView,
        InscriptionView,
        DefectView,
    },
    setup() {
        const { locale, t, setLocale } = useI18n();
        return { locale, t, setLocale };
    },
    data() {
        return {
            // Application state
            currentView: 'caves',
            loading: false,
            error: null,
            message: null,
            messageType: 'info',

            // Backend connection status
            backendOnline: false,
        };
    },

    methods: {
        changeView(view) {
            console.log('Changing view to:', view);
            this.currentView = view;
        },

        changeLocale(newLocale) {
            console.log('Changing locale to:', newLocale);
            this.setLocale(newLocale);
        },

        showMessage(message, type = 'info') {
            this.message = message;
            this.messageType = type;
            setTimeout(() => {
                this.message = null;
            }, 5000);
        },

        dismissError() {
            this.error = null;
            this.message = null;
        },

        async checkBackendConnection() {
            try {
                const response = await window.api.health.check();
                this.backendOnline = response.data.status !== 'offline';
                console.log('Backend status:', this.backendOnline ? '✅ Online' : '❌ Offline');
            } catch (error) {
                this.backendOnline = false;
                console.warn('Backend connection check failed:', error.message);
            }
        },
    },

    mounted() {
        console.log('🏛️ Mogao Digital Twin - Vue App Mounted');
        console.log('📍 Current working directory:', window.location.href);
        console.log('🔌 Backend API:', window.API_BASE_URL || 'http://localhost:8080');

        // Check backend connection
        this.checkBackendConnection();

        // Set up periodic backend health check
        setInterval(() => {
            this.checkBackendConnection();
        }, 30000); // Check every 30 seconds

        console.log('📊 Initial view:', this.currentView);
    },

    template: `
        <div id="app-container">
            <app-header
                :current-view="currentView"
                :locale="locale"
                @change-view="changeView"
                @change-locale="changeLocale"
            ></app-header>

            <error-message
                v-if="error || message"
                :message="error || message"
                @dismiss="dismissError"
            ></error-message>

            <div class="main-content">
                <loading-spinner v-if="loading"></loading-spinner>

                <div v-else class="content-area">

                    <cave-view
                        v-if="currentView === 'caves'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Cave selected:', item)"
                    ></cave-view>
                    <statue-view
                        v-if="currentView === 'statues'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Statue selected:', item)"
                    ></statue-view>
                    <mural-view
                        v-if="currentView === 'murals'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Mural selected:', item)"
                    ></mural-view>
                    <painting-view
                        v-if="currentView === 'paintings'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Painting selected:', item)"
                    ></painting-view>
                    <inscription-view
                        v-if="currentView === 'inscriptions'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Inscription selected:', item)"
                    ></inscription-view>
                    <defect-view
                        v-if="currentView === 'defects'"
                        @show-message="showMessage"
                        @item-selected="(item) => console.log('Defect selected:', item)"
                    ></defect-view>                </div>
            </div>

            <div class="status-bar" :class="backendOnline ? 'status-online' : 'status-offline'">
                <span>{{ backendOnline ? (locale === 'zh' ? '✅ 后端在线' : '✅ Backend Online') : (locale === 'zh' ? '❌ 后端离线' : '❌ Backend Offline') }}</span>
            </div>
        </div>
    `
});

// Mount the app
app.mount('#app');

console.log('✅ Vue app initialized successfully');
console.log('📦 Registered components:', Object.keys(app._context.components));
