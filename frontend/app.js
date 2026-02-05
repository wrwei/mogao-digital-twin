/**
 * Mogao Digital Twin - Vue 3 App
 * Auto-generated from mogao_dt.ecore
 * Main application with model-driven entity management
 */

const { createApp } = Vue;

// ============================================
// Generated Component Imports
// ============================================
// Cave Components
import CaveCard from './components/CaveCard.js';
import CaveForm from './components/CaveForm.js';
import CaveList from './components/CaveList.js';
// Statue Components
import StatueCard from './components/StatueCard.js';
import StatueForm from './components/StatueForm.js';
import StatueList from './components/StatueList.js';
// Mural Components
import MuralCard from './components/MuralCard.js';
import MuralForm from './components/MuralForm.js';
import MuralList from './components/MuralList.js';
// Painting Components
import PaintingCard from './components/PaintingCard.js';
import PaintingForm from './components/PaintingForm.js';
import PaintingList from './components/PaintingList.js';
// Inscription Components
import InscriptionCard from './components/InscriptionCard.js';
import InscriptionForm from './components/InscriptionForm.js';
import InscriptionList from './components/InscriptionList.js';
// Defect Components
import DefectCard from './components/DefectCard.js';
import DefectForm from './components/DefectForm.js';
import DefectList from './components/DefectList.js';

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
    props: ['currentView'],
    emits: ['change-view'],
    template: `
        <div class="app-header" style="background: var(--primary-color); color: white; padding: var(--spacing-md); display: flex; justify-content: space-between; align-items: center;">
            <h1 style="margin: 0; font-size: 24px;">🏛️ 莫高窟数字孪生</h1>
            <div style="display: flex; gap: var(--spacing-sm);">
                <button @click="$emit('change-view', 'caves')"
                        class="btn btn-sm"
                        :class="currentView === 'caves' ? 'btn-secondary' : 'btn-outline'">
                    洞窟
                </button>
                <button @click="$emit('change-view', 'statues')"
                        class="btn btn-sm"
                        :class="currentView === 'statues' ? 'btn-secondary' : 'btn-outline'">
                    雕像
                </button>
                <button @click="$emit('change-view', 'murals')"
                        class="btn btn-sm"
                        :class="currentView === 'murals' ? 'btn-secondary' : 'btn-outline'">
                    壁画
                </button>
                <button @click="$emit('change-view', 'paintings')"
                        class="btn btn-sm"
                        :class="currentView === 'paintings' ? 'btn-secondary' : 'btn-outline'">
                    绘画
                </button>
                <button @click="$emit('change-view', 'inscriptions')"
                        class="btn btn-sm"
                        :class="currentView === 'inscriptions' ? 'btn-secondary' : 'btn-outline'">
                    铭文
                </button>
                <button @click="$emit('change-view', 'defects')"
                        class="btn btn-sm"
                        :class="currentView === 'defects' ? 'btn-secondary' : 'btn-outline'">
                    缺陷
                </button>
            </div>
        </div>
    `
};

const LoadingSpinner = {
    template: `
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p style="margin-top: var(--spacing-md); color: var(--text-secondary);">加载中...</p>
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
    props: ['title', 'show'],
    emits: ['close'],
    template: `
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="modal" style="min-width: 500px;">
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
    },
    setup() {
        const composable = useCaves();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个洞窟吗？`)) {
                try {
                    await this.deleteCave(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateCave(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createCave(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchCaves();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectCave(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchCaves();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑洞窟' : '创建洞窟'" @close="handleFormCancel">
                <cave-form
                    :cave="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></cave-form>            </modal-dialog>

            <cave-list
                :caves="caves"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
            ></cave-list>        </div>
    `
};

const StatueView = {
    components: {
        StatueList,
        StatueForm,
        StatueCard,
    },
    setup() {
        const composable = useStatues();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个雕像吗？`)) {
                try {
                    await this.deleteStatue(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateStatue(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createStatue(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchStatues();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectStatue(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchStatues();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑雕像' : '创建雕像'" @close="handleFormCancel">
                <statue-form
                    :statue="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></statue-form>            </modal-dialog>

            <statue-list
                :statues="statues"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
            ></statue-list>        </div>
    `
};

const MuralView = {
    components: {
        MuralList,
        MuralForm,
        MuralCard,
    },
    setup() {
        const composable = useMurals();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个壁画吗？`)) {
                try {
                    await this.deleteMural(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateMural(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createMural(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchMurals();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectMural(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchMurals();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑壁画' : '创建壁画'" @close="handleFormCancel">
                <mural-form
                    :mural="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></mural-form>            </modal-dialog>

            <mural-list
                :murals="murals"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
            ></mural-list>        </div>
    `
};

const PaintingView = {
    components: {
        PaintingList,
        PaintingForm,
        PaintingCard,
    },
    setup() {
        const composable = usePaintings();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个绘画吗？`)) {
                try {
                    await this.deletePainting(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updatePainting(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createPainting(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchPaintings();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectPainting(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchPaintings();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑绘画' : '创建绘画'" @close="handleFormCancel">
                <painting-form
                    :painting="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></painting-form>            </modal-dialog>

            <painting-list
                :paintings="paintings"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
            ></painting-list>        </div>
    `
};

const InscriptionView = {
    components: {
        InscriptionList,
        InscriptionForm,
        InscriptionCard,
    },
    setup() {
        const composable = useInscriptions();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个铭文吗？`)) {
                try {
                    await this.deleteInscription(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateInscription(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createInscription(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchInscriptions();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectInscription(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchInscriptions();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑铭文' : '创建铭文'" @close="handleFormCancel">
                <inscription-form
                    :inscription="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></inscription-form>            </modal-dialog>

            <inscription-list
                :inscriptions="inscriptions"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
            ></inscription-list>        </div>
    `
};

const DefectView = {
    components: {
        DefectList,
        DefectForm,
        DefectCard,
    },
    setup() {
        const composable = useDefects();
        return {
            ...composable,
        };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
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
            if (confirm(`确定要删除这个缺陷吗？`)) {
                try {
                    await this.deleteDefect(item.gid);
                    this.$emit('show-message', '删除成功', 'success');
                } catch (err) {
                    this.$emit('show-message', '删除失败: ' + err.message, 'error');
                }
            }
        },
        async handleFormSubmit(data) {
            try {
                if (this.editMode) {
                    await this.updateDefect(this.editingItem.gid, data);
                    this.$emit('show-message', '更新成功', 'success');
                } else {
                    await this.createDefect(data);
                    this.$emit('show-message', '创建成功', 'success');
                }
                this.showForm = false;
                await this.fetchDefects();
            } catch (err) {
                this.$emit('show-message', '操作失败: ' + err.message, 'error');
            }
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectDefect(item);
            this.$emit('item-selected', item);
        }
    },
    mounted() {
        this.fetchDefects();
    },
    template: `
        <div class="entity-view">
            <modal-dialog :show="showForm" :title="editMode ? '编辑缺陷' : '创建缺陷'" @close="handleFormCancel">
                <defect-form
                    :defect="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></defect-form>            </modal-dialog>

            <defect-list
                :defects="defects"
                :loading="loading"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
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
                @change-view="changeView"
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
                <span>{{ backendOnline ? '✅ 后端在线' : '❌ 后端离线' }}</span>
            </div>
        </div>
    `
});

// Mount the app
app.mount('#app');

console.log('✅ Vue app initialized successfully');
console.log('📦 Registered components:', Object.keys(app._context.components));
