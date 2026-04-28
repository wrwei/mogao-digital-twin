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

import SettingsView from './components/SettingsView.js';
import SensorDashboard from './components/SensorDashboard.js';
import MaintenanceQueue from './components/MaintenanceQueue.js';

// ============================================
// Generated Composable Imports
// ============================================
import { useCaves } from './composables/useCaves.js';
import { useStatues } from './composables/useStatues.js';
import { useMurals } from './composables/useMurals.js';
import { usePaintings } from './composables/usePaintings.js';
import { useInscriptions } from './composables/useInscriptions.js';

// ============================================
// Login Page Component
// ============================================
const LoginPage = {
    emits: ['login-success'],
    data() {
        return {
            username: '',
            password: '',
            error: '',
            loading: false,
        };
    },
    methods: {
        async handleSubmit() {
            this.error = '';
            this.loading = true;
            try {
                const response = await axios.post((window.CONFIG?.API_BASE_URL || 'http://localhost:8008') + '/users/login', {
                    username: this.username,
                    password: this.password,
                });
                const { token, user } = response.data;
                localStorage.setItem('mgemini-token', token);
                localStorage.setItem('mgemini-user', JSON.stringify(user));
                this.$emit('login-success', { token, user });
            } catch (err) {
                if (err.response && err.response.data) {
                    this.error = err.response.data.message;
                } else {
                    this.error = 'Connection failed. Is the backend running?';
                }
            } finally {
                this.loading = false;
            }
        },
        enterAsGuest() {
            const guestUser = { username: 'guest', fullName: 'Guest', role: 'guest' };
            localStorage.setItem('mgemini-user', JSON.stringify(guestUser));
            this.$emit('login-success', { token: null, user: guestUser });
        },
    },
    template: `
        <div class="login-page">
            <div class="login-hero">
                <div class="login-hero-content">
                    <h1>M-Gemini<span>Digital Twin Platform</span></h1>
                    <p class="login-hero-subtitle">
                        Preserving the Mogao Grottoes through digital twin technology.
                        Monitor, simulate, and protect UNESCO World Heritage.
                    </p>
                    <div class="login-hero-features">
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🏛️</div>
                            <span>3D digital replicas of cave temples and artefacts</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">📊</div>
                            <span>Real-time environmental monitoring and analysis</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🔬</div>
                            <span>Deterioration simulation and conservation planning</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🤝</div>
                            <span>Collaborative research across institutions</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="login-form-panel">
                <div class="login-form-container">
                    <div class="login-form-header">
                        <div class="login-form-logo">🏛️</div>
                        <h2>M-Gemini</h2>
                        <p>Mogao Digital Twin Platform</p>
                    </div>

                    <div v-if="error" class="login-error">{{ error }}</div>

                    <form @submit.prevent="handleSubmit">
                        <div class="login-field">
                            <label>Username</label>
                            <input v-model="username" type="text" placeholder="Enter your username" required />
                        </div>

                        <div class="login-field">
                            <label>Password</label>
                            <input v-model="password" type="password" placeholder="Enter your password" required />
                        </div>

                        <button type="submit" class="login-submit-btn" :disabled="loading">
                            {{ loading ? 'Please wait...' : 'Sign In' }}
                        </button>
                    </form>

                    <div class="login-divider">
                        <span>or</span>
                    </div>

                    <button class="login-guest-btn" @click="enterAsGuest">
                        Visit as a Guest
                    </button>

                    <div class="login-form-footer">
                        Mogao Digital Twin &copy; 2026
                    </div>
                </div>
            </div>
        </div>
    `
};

// ============================================
// Shared UI Components
// ============================================
const AppSidebar = {
    props: ['currentView', 'backendOnline', 'isAdmin', 'anomalyCount'],
    emits: ['change-view'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="app-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">🏛️</div>
                <span class="sidebar-brand">M-Gemini</span>
            </div>
            <div class="sidebar-nav">
                <div class="sidebar-nav-item" :class="{ active: currentView === 'dashboard' }" @click="$emit('change-view', 'dashboard')">
                    <span class="sidebar-nav-icon">📊</span>
                    <span>{{ t('nav.dashboard') }}</span>
                </div>
                <div class="sidebar-nav-item" :class="{ active: currentView === 'caves' || currentView === 'statues' || currentView === 'murals' || currentView === 'paintings' || currentView === 'inscriptions' }" @click="$emit('change-view', 'caves')">
                    <span class="sidebar-nav-icon">🏛️</span>
                    <span>{{ t('entities.caves') }}</span>
                </div>
                <div v-if="isAdmin" class="sidebar-nav-item" :class="{ active: currentView === 'sensors' }" @click="$emit('change-view', 'sensors')">
                    <span class="sidebar-nav-icon">📡</span>
                    <span style="flex: 1;">{{ t('nav.sensors') || 'Sensors' }}</span>
                    <span v-if="anomalyCount > 0" class="sidebar-badge" :class="{ critical: anomalyCount >= 5 }" :title="anomalyCount + ' active anomalies'">{{ anomalyCount }}</span>
                </div>
                <div v-if="isAdmin" class="sidebar-nav-item" :class="{ active: currentView === 'maintenance' }" @click="$emit('change-view', 'maintenance')">
                    <span class="sidebar-nav-icon">🔧</span>
                    <span style="flex: 1;">Maintenance</span>
                    <span v-if="anomalyCount > 0" class="sidebar-badge" :class="{ critical: anomalyCount >= 5 }" :title="anomalyCount + ' active anomalies'">{{ anomalyCount }}</span>
                </div>
                <div class="sidebar-nav-item" :class="{ active: currentView === 'settings' }" @click="$emit('change-view', 'settings')" style="margin-top: auto;">
                    <span class="sidebar-nav-icon">&#9881;</span>
                    <span>{{ t('nav.settings') || 'Settings' }}</span>
                </div>
            </div>
            <div class="sidebar-footer">
                <span class="status-dot" :class="backendOnline ? 'online' : 'offline'"></span>
                <span>{{ backendOnline ? t('nav.backendOnline') : t('nav.backendOffline') }}</span>
            </div>
        </div>
    `
};

const AppTopbar = {
    props: ['locale', 'theme', 'user'],
    emits: ['change-locale', 'change-theme', 'logout'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            showThemePicker: false,
            themes: [
                { id: 'mogao',    name: 'Mogao Sand',     sidebar: '#5C3D2E', primary: '#D4A574', accent: '#8B4513', icon: '🏛️' },
                { id: 'ocean',    name: 'Ocean Blue',     sidebar: '#1e3a5f', primary: '#5b9bd5', accent: '#2c5f8a', icon: '🌊' },
                { id: 'forest',   name: 'Forest Green',   sidebar: '#2d4a3e', primary: '#6db58a', accent: '#3a7d5c', icon: '🌿' },
                { id: 'slate',    name: 'Modern Slate',   sidebar: '#2d3748', primary: '#a0aec0', accent: '#4a5568', icon: '🖥️' },
                { id: 'plum',     name: 'Royal Plum',     sidebar: '#3d2b4e', primary: '#b39ddb', accent: '#6a4c93', icon: '👑' },
                { id: 'ember',    name: 'Warm Ember',     sidebar: '#4a2020', primary: '#e07a5f', accent: '#8b3a3a', icon: '🔥' },
                { id: 'midnight', name: 'Midnight Dark',  sidebar: '#1a1a2e', primary: '#7c83db', accent: '#3a3a5c', icon: '🌙' },
                { id: 'sakura',   name: 'Sakura Blossom', sidebar: '#4a3040', primary: '#e8a0bf', accent: '#8b4f6e', icon: '🌸' }
            ]
        };
    },
    methods: {
        selectTheme(themeId) {
            this.$emit('change-theme', themeId);
            this.showThemePicker = false;
        }
    },
    template: `
        <div class="app-topbar">
            <span class="topbar-title">{{ locale === 'zh' ? 'M-Gemini 数字孪生平台' : 'M-Gemini Digital Twin Platform' }}</span>
            <div class="topbar-actions">
                <!-- Theme picker -->
                <div class="theme-picker-wrapper">
                    <button class="topbar-icon-btn" @click="showThemePicker = !showThemePicker" title="Theme">
                        🎨
                    </button>
                    <div v-if="showThemePicker" class="theme-picker-dropdown">
                        <div class="theme-picker-title">Theme</div>
                        <div
                            v-for="t in themes"
                            :key="t.id"
                            class="theme-picker-item"
                            :class="{ active: theme === t.id }"
                            @click="selectTheme(t.id)"
                        >
                            <span class="theme-picker-swatch" :style="{ background: t.sidebar }">
                                <span class="theme-picker-swatch-dot" :style="{ background: t.primary }"></span>
                            </span>
                            <span>{{ t.icon }} {{ t.name }}</span>
                            <span v-if="theme === t.id" style="margin-left: auto; color: var(--primary-color);">✓</span>
                        </div>
                    </div>
                </div>
                <!-- Locale -->
                <select class="topbar-locale-select"
                        @change="$emit('change-locale', $event.target.value)"
                        :value="locale">
                    <option value="en">🌐 English</option>
                    <option value="zh">🌐 中文</option>
                </select>
                <!-- User & Logout -->
                <span v-if="user" style="color: var(--sidebar-text, #ccc); font-size: 13px; margin-left: 8px;">
                    {{ user.fullName || user.username }}
                </span>
                <button class="topbar-icon-btn" @click="$emit('logout')" title="Logout" style="margin-left: 4px;">
                    ⏻
                </button>
            </div>
        </div>
    `
};

const DashboardView = {
    props: ['caveCount', 'statueCount', 'muralCount', 'paintingCount', 'inscriptionCount'],
    emits: ['navigate'],
    setup() {
        const { t, locale } = useI18n();
        const today = new Date();
        const dateStr = today.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        return { t, locale, dateStr };
    },
    template: `
        <div class="dashboard-view">
            <div class="welcome-banner">
                <div>
                    <h2>{{ t('dashboard.welcome') }}</h2>
                    <p>{{ t('dashboard.subtitle') }}</p>
                </div>
                <div class="welcome-banner-date">{{ dateStr }}</div>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card caves" @click="$emit('navigate', 'caves')">
                    <div class="stat-card-icon">🏛️</div>
                    <div class="stat-card-info">
                        <h3>{{ caveCount }}</h3>
                        <p>{{ t('entities.caves') }}</p>
                    </div>
                </div>
                <div class="stat-card statues" @click="$emit('navigate', 'statues')">
                    <div class="stat-card-icon">🗿</div>
                    <div class="stat-card-info">
                        <h3>{{ statueCount }}</h3>
                        <p>{{ t('entities.statues') }}</p>
                    </div>
                </div>
                <div class="stat-card murals" @click="$emit('navigate', 'murals')">
                    <div class="stat-card-icon">🎨</div>
                    <div class="stat-card-info">
                        <h3>{{ muralCount }}</h3>
                        <p>{{ t('entities.murals') }}</p>
                    </div>
                </div>
                <div class="stat-card paintings" @click="$emit('navigate', 'paintings')">
                    <div class="stat-card-icon">🖼️</div>
                    <div class="stat-card-info">
                        <h3>{{ paintingCount }}</h3>
                        <p>{{ t('entities.paintings') }}</p>
                    </div>
                </div>
                <div class="stat-card inscriptions" @click="$emit('navigate', 'inscriptions')">
                    <div class="stat-card-icon">✍️</div>
                    <div class="stat-card-info">
                        <h3>{{ inscriptionCount }}</h3>
                        <p>{{ t('entities.inscriptions') }}</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-section">
                <div class="dashboard-section-title">⚡ {{ t('dashboard.quickActions') }}</div>
                <div class="quick-actions">
                    <button class="quick-action-btn" @click="$emit('navigate', 'caves')">🏛️ {{ t('dashboard.viewCaves') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'statues')">🗿 {{ t('dashboard.viewStatues') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'murals')">🎨 {{ t('dashboard.viewMurals') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'paintings')">🖼️ {{ t('dashboard.viewPaintings') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'inscriptions')">✍️ {{ t('dashboard.viewInscriptions') }}</button>
                </div>
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
    props: ['message', 'type'],
    emits: ['dismiss'],
    template: `
        <div :style="{
            background: type === 'success' ? '#10b981' : (type === 'warning' ? '#f59e0b' : 'var(--error-color)'),
            color: 'white',
            padding: 'var(--spacing-md)',
            margin: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }">
            <span>{{ type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : '❌') }} {{ message }}</span>
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

const DrawerPanel = {
    props: ['show', 'title'],
    emits: ['close'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div v-if="show" class="drawer-overlay" @click.self="$emit('close')">
            <div class="drawer drawer-right">
                <div class="drawer-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; flex: 1;">{{ title }}</h3>
                    <div class="drawer-header-actions" style="display: flex; align-items: center; gap: 8px;">
                        <slot name="header-actions"></slot>
                        <button class="drawer-close" @click="$emit('close')">&times;</button>
                    </div>
                </div>
                <div class="drawer-body">
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
        DrawerPanel,
    },
    props: {
        pendingDrillIn: { type: Object, default: null }
    },
    emits: ['show-message', 'item-selected', 'drill-in-consumed'],
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
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;  // Close detail drawer if open
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;  // Close detail drawer if open
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
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.cave') }), 'success');
            this.showForm = false;
            await this.fetchCaves();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectCave(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
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
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.cave') : t('actions.createNew', { entity: t('entities.cave') })" @close="handleFormCancel">
                <cave-form
                    :cave="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></cave-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <cave-detail-view
                    v-if="detailItem"
                    :cave="detailItem"
                ></cave-detail-view>            </drawer-panel>

            <cave-list
                :caves="caves"
                :loading="loading"
                :selected-gid="selectedGid"
                :pending-drill-in="pendingDrillIn"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
                @drill-in-consumed="$emit('drill-in-consumed')"
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
        DrawerPanel,
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
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;  // Close detail drawer if open
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;  // Close detail drawer if open
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
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.statue') }), 'success');
            this.showForm = false;
            await this.fetchStatues();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectStatue(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
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
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.statue') : t('actions.createNew', { entity: t('entities.statue') })" @close="handleFormCancel">
                <statue-form
                    :statue="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></statue-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <statue-detail-view
                    v-if="detailItem"
                    :statue="detailItem"
                ></statue-detail-view>            </drawer-panel>

            <statue-list
                :statues="statues"
                :loading="loading"
                :selected-gid="selectedGid"
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
        DrawerPanel,
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
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;  // Close detail drawer if open
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;  // Close detail drawer if open
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
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.mural') }), 'success');
            this.showForm = false;
            await this.fetchMurals();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectMural(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
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
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.mural') : t('actions.createNew', { entity: t('entities.mural') })" @close="handleFormCancel">
                <mural-form
                    :mural="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></mural-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <mural-detail-view
                    v-if="detailItem"
                    :mural="detailItem"
                ></mural-detail-view>            </drawer-panel>

            <mural-list
                :murals="murals"
                :loading="loading"
                :selected-gid="selectedGid"
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
        DrawerPanel,
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
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;  // Close detail drawer if open
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;  // Close detail drawer if open
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
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.painting') }), 'success');
            this.showForm = false;
            await this.fetchPaintings();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectPainting(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
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
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.painting') : t('actions.createNew', { entity: t('entities.painting') })" @close="handleFormCancel">
                <painting-form
                    :painting="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></painting-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <painting-detail-view
                    v-if="detailItem"
                    :painting="detailItem"
                ></painting-detail-view>            </drawer-panel>

            <painting-list
                :paintings="paintings"
                :loading="loading"
                :selected-gid="selectedGid"
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
        DrawerPanel,
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
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;  // Close detail drawer if open
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;  // Close detail drawer if open
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
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.inscription') }), 'success');
            this.showForm = false;
            await this.fetchInscriptions();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectInscription(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
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
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.inscription') : t('actions.createNew', { entity: t('entities.inscription') })" @close="handleFormCancel">
                <inscription-form
                    :inscription="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></inscription-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <inscription-detail-view
                    v-if="detailItem"
                    :inscription="detailItem"
                ></inscription-detail-view>            </drawer-panel>

            <inscription-list
                :inscriptions="inscriptions"
                :loading="loading"
                :selected-gid="selectedGid"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
            ></inscription-list>        </div>
    `
};

// ============================================
// Main App Component
// ============================================
const app = createApp({
    components: {
        LoginPage,
        AppSidebar,
        AppTopbar,
        DashboardView,
        LoadingSpinner,
        ErrorMessage,
        ModalDialog,
        CaveView,
        StatueView,
        MuralView,
        PaintingView,
        InscriptionView,
        SettingsView,
        SensorDashboard,
        MaintenanceQueue,
    },
    setup() {
        const { locale, t, setLocale } = useI18n();
        const cavesComposable = useCaves();
        const statuesComposable = useStatues();
        const muralsComposable = useMurals();
        const paintingsComposable = usePaintings();
        const inscriptionsComposable = useInscriptions();

        // Provide isGuest as a reactive computed for all child components
        const isGuest = Vue.computed(() => {
            const user = JSON.parse(localStorage.getItem('mgemini-user') || 'null');
            return user && user.role === 'guest';
        });
        Vue.provide('isGuest', isGuest);

        const isAdmin = Vue.computed(() => {
            const user = JSON.parse(localStorage.getItem('mgemini-user') || 'null');
            return !!(user && user.role === 'admin');
        });

        return {
            isAdmin,
            locale, t, setLocale,
            isGuest,
            dashCaves: cavesComposable,
            dashStatues: statuesComposable,
            dashMurals: muralsComposable,
            dashPaintings: paintingsComposable,
            dashInscriptions: inscriptionsComposable,
        };
    },
    data() {
        return {
            // Auth state
            isAuthenticated: !!localStorage.getItem('mgemini-token'),
            currentUser: JSON.parse(localStorage.getItem('mgemini-user') || 'null'),

            // Application state
            currentView: 'dashboard',
            loading: false,
            error: null,
            message: null,
            messageType: 'info',

            // Backend connection status
            backendOnline: false,

            // Theme
            currentTheme: localStorage.getItem('mgemini-theme') || 'mogao',

            // Anomaly count (sidebar badge) — admin only
            anomalyCount: 0,
            _anomalyTimer: null,

            // Drill-in from MaintenanceQueue: { gid, type } pending selection
            pendingArtifactDrillIn: null,
        };
    },

    methods: {
        handleLoginSuccess({ token, user }) {
            this.isAuthenticated = true;
            this.currentUser = user;
            // Set auth header for all future API requests
            if (token) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                delete axios.defaults.headers.common['X-Guest-Access'];
            } else {
                // Guest mode — no token, use guest header
                delete axios.defaults.headers.common['Authorization'];
                axios.defaults.headers.common['X-Guest-Access'] = 'true';
            }
            this.checkBackendConnection();
            this.dashCaves.fetchCaves();
            this.dashStatues.fetchStatues();
            this.dashMurals.fetchMurals();
            this.dashPaintings.fetchPaintings();
            this.dashInscriptions.fetchInscriptions();
        },

        handleLogout() {
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('mgemini-token');
            localStorage.removeItem('mgemini-user');
            delete axios.defaults.headers.common['Authorization'];
        },

        changeView(view) {
            this.currentView = view;
            if (view === 'dashboard') {
                this.dashCaves.fetchCaves();
                this.dashStatues.fetchStatues();
                this.dashMurals.fetchMurals();
                this.dashPaintings.fetchPaintings();
                this.dashInscriptions.fetchInscriptions();
            }
        },

        changeLocale(newLocale) {
            this.setLocale(newLocale);
        },

        changeTheme(themeId) {
            this.currentTheme = themeId;
            localStorage.setItem('mgemini-theme', themeId);
            this.applyTheme(themeId);
        },

        applyTheme(themeId) {
            document.documentElement.setAttribute('data-theme', themeId);
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

        handlePreferencesChanged(prefs) {
            if (prefs.theme) this.changeTheme(prefs.theme);
            if (prefs.language) this.changeLocale(prefs.language);
        },

        handleProfileUpdated(user) {
            this.currentUser = { ...this.currentUser, ...user };
            localStorage.setItem('mgemini-user', JSON.stringify(this.currentUser));
        },

        async checkBackendConnection() {
            try {
                const response = await window.api.health.check();
                this.backendOnline = response.data.status !== 'offline';
            } catch (error) {
                this.backendOnline = false;
                console.warn('Backend connection check failed:', error.message);
            }
        },

        async fetchAnomalyCount() {
            if (!this.isAdmin) return;
            try {
                const res = await window.api.maintenance.anomalies();
                const list = Array.isArray(res.data) ? res.data
                    : Array.isArray(res.data?.anomalies) ? res.data.anomalies
                    : [];
                this.anomalyCount = list.length;
            } catch (err) {
                // Silent — don't spam on auth hiccups
                this.anomalyCount = 0;
            }
        },

        /**
         * Invoked by MaintenanceQueue when a row is clicked. Navigates to the
         * caves view and queues the drill-in so CaveList can auto-open the
         * matching cave + artifact with the Prediction panel active.
         */
        handleArtifactDrillIn({ gid, type, caveGid }) {
            if (!gid || !type) return;
            if (!caveGid) {
                this.showMessage('Cannot open 3D view: this artifact is not linked to a parent cave.', 'warning');
                return;
            }
            this.pendingArtifactDrillIn = { gid, type, caveGid };
            this.currentView = 'caves';
        },

        clearPendingDrillIn() {
            this.pendingArtifactDrillIn = null;
        },
    },

    mounted() {
        this.applyTheme(this.currentTheme);
        // Restore auth header from stored token or guest mode
        const token = localStorage.getItem('mgemini-token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        } else if (this.currentUser && this.currentUser.role === 'guest') {
            axios.defaults.headers.common['X-Guest-Access'] = 'true';
        }

        if (this.isAuthenticated) {
            // Check backend connection and fetch dashboard counts
            this.checkBackendConnection();
            this.dashCaves.fetchCaves();
            this.dashStatues.fetchStatues();
            this.dashMurals.fetchMurals();
            this.dashPaintings.fetchPaintings();
            this.dashInscriptions.fetchInscriptions();

            // Set up periodic backend health check
            setInterval(() => {
                this.checkBackendConnection();
            }, 30000);

            // Anomaly badge poll (admin only) — initial + every 60s
            if (this.isAdmin) {
                this.fetchAnomalyCount();
                this._anomalyTimer = setInterval(() => this.fetchAnomalyCount(), 60000);
            }
        }
    },

    beforeUnmount() {
        if (this._anomalyTimer) clearInterval(this._anomalyTimer);
    },

    template: `
        <login-page
            v-if="!isAuthenticated"
            @login-success="handleLoginSuccess"
        ></login-page>

        <div v-else id="app-container" style="display: flex; height: 100vh;">
            <app-sidebar
                :current-view="currentView"
                :backend-online="backendOnline"
                :is-admin="isAdmin"
                :anomaly-count="anomalyCount"
                @change-view="changeView"
            ></app-sidebar>

            <div class="app-main">
                <app-topbar
                    :locale="locale"
                    :theme="currentTheme"
                    :user="currentUser"
                    @change-locale="changeLocale"
                    @change-theme="changeTheme"
                    @logout="handleLogout"
                ></app-topbar>

                <error-message
                    v-if="error || message"
                    :message="error || message"
                    :type="error ? 'error' : messageType"
                    @dismiss="dismissError"
                ></error-message>

                <div class="main-content">
                    <loading-spinner v-if="loading"></loading-spinner>

                    <div v-else class="content-area" style="flex: 1; overflow: hidden;">
                        <dashboard-view
                            v-if="currentView === 'dashboard'"
                            :cave-count="dashCaves.caves.value ? dashCaves.caves.value.length : 0"
                            :statue-count="dashStatues.statues.value ? dashStatues.statues.value.length : 0"
                            :mural-count="dashMurals.murals.value ? dashMurals.murals.value.length : 0"
                            :painting-count="dashPaintings.paintings.value ? dashPaintings.paintings.value.length : 0"
                            :inscription-count="dashInscriptions.inscriptions.value ? dashInscriptions.inscriptions.value.length : 0"
                            @navigate="changeView"
                        ></dashboard-view>
                        <cave-view
                            v-if="currentView === 'caves'"
                            :pending-drill-in="pendingArtifactDrillIn"
                            @drill-in-consumed="clearPendingDrillIn"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></cave-view>
                        <statue-view
                            v-if="currentView === 'statues'"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></statue-view>
                        <mural-view
                            v-if="currentView === 'murals'"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></mural-view>
                        <painting-view
                            v-if="currentView === 'paintings'"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></painting-view>
                        <inscription-view
                            v-if="currentView === 'inscriptions'"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></inscription-view>
                        <settings-view
                            v-if="currentView === 'settings'"
                            :user="currentUser"
                            @show-message="showMessage"
                            @preferences-changed="handlePreferencesChanged"
                            @profile-updated="handleProfileUpdated"
                        ></settings-view>
                        <sensor-dashboard
                            v-if="currentView === 'sensors' && isAdmin"
                        ></sensor-dashboard>
                        <maintenance-queue
                            v-if="currentView === 'maintenance' && isAdmin"
                            @drill-in="handleArtifactDrillIn"
                        ></maintenance-queue>
                    </div>
                </div>

            </div>
        </div>
    `
});

// Mount the app
app.mount('#app');

