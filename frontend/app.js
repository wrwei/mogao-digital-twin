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
import { vFocusTrap } from './utils/a11y.js';
import { parseHash, setHash, subscribeRoute } from './utils/router.js';
import ConfirmDialog from './components/ConfirmDialog.js';
import ToastStack from './components/ToastStack.js';
import ShortcutsCheatsheet from './components/ShortcutsCheatsheet.js';
import { installShortcuts, registerSingleKey, registerLeaderPair } from './utils/keyboard.js';

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
    setup() {
        const { t } = useI18n();
        return { t };
    },
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
                    this.error = this.t('loginPage.connectionFailed');
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
                    <h1>M-Gemini<span>{{ t('loginPage.heroTitle') }}</span></h1>
                    <p class="login-hero-subtitle">{{ t('loginPage.heroSubtitle') }}</p>
                    <div class="login-hero-features">
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🏛️</div>
                            <span>{{ t('loginPage.feature3D') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">📊</div>
                            <span>{{ t('loginPage.featureMonitoring') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🔬</div>
                            <span>{{ t('loginPage.featureSimulation') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🤝</div>
                            <span>{{ t('loginPage.featureCollaboration') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="login-form-panel">
                <div class="login-form-container">
                    <div class="login-form-header">
                        <div class="login-form-logo">🏛️</div>
                        <h2>{{ t('loginPage.formTitle') }}</h2>
                        <p>{{ t('loginPage.formSubtitle') }}</p>
                    </div>

                    <div v-if="error" class="login-error">{{ error }}</div>

                    <form @submit.prevent="handleSubmit">
                        <div class="login-field">
                            <label>{{ t('loginPage.usernameLabel') }}</label>
                            <input v-model="username" type="text" :placeholder="t('loginPage.usernamePlaceholder')" required />
                        </div>

                        <div class="login-field">
                            <label>{{ t('loginPage.passwordLabel') }}</label>
                            <input v-model="password" type="password" :placeholder="t('loginPage.passwordPlaceholder')" required />
                        </div>

                        <button type="submit" class="login-submit-btn" :disabled="loading">
                            {{ loading ? t('loginPage.signingIn') : t('loginPage.signIn') }}
                        </button>
                    </form>

                    <div class="login-divider">
                        <span>{{ t('loginPage.or') }}</span>
                    </div>

                    <button class="login-guest-btn" @click="enterAsGuest">
                        {{ t('loginPage.visitAsGuest') }}
                    </button>

                    <div class="login-form-footer">
                        {{ t('loginPage.footer') }}
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
                    <span style="flex: 1;">{{ t('navExtras.maintenance') }}</span>
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
            // Restore focus to the trigger after closing.
            this.$nextTick(() => { if (this.$refs.themeBtn) this.$refs.themeBtn.focus(); });
        },
        toggleThemePicker() {
            this.showThemePicker = !this.showThemePicker;
        },
        closeThemePicker() {
            this.showThemePicker = false;
        },
        handleThemePickerKey(ev) {
            // Esc closes the picker; arrows navigate items.
            if (ev.key === 'Escape') {
                ev.stopPropagation();
                this.showThemePicker = false;
                if (this.$refs.themeBtn) this.$refs.themeBtn.focus();
            }
        },
        handleDocClick(ev) {
            // Click-outside dismissal — runs only while picker is open
            // because the listener is registered/removed by a watcher below.
            if (this.$refs.picker && !this.$refs.picker.contains(ev.target)) {
                this.showThemePicker = false;
            }
        }
    },
    watch: {
        showThemePicker(open) {
            if (open) {
                document.addEventListener('mousedown', this.handleDocClick);
            } else {
                document.removeEventListener('mousedown', this.handleDocClick);
            }
        }
    },
    beforeUnmount() {
        document.removeEventListener('mousedown', this.handleDocClick);
    },
    template: `
        <div class="app-topbar">
            <span class="topbar-title">{{ locale === 'zh' ? 'M-Gemini 数字孪生平台' : 'M-Gemini Digital Twin Platform' }}</span>
            <div class="topbar-actions">
                <!-- Theme picker -->
                <div class="theme-picker-wrapper" ref="picker" @keydown="handleThemePickerKey">
                    <button ref="themeBtn"
                            class="topbar-icon-btn"
                            @click="toggleThemePicker"
                            :aria-label="t('settings.theme') || 'Theme'"
                            aria-haspopup="menu"
                            :aria-expanded="showThemePicker">
                        🎨
                    </button>
                    <div v-if="showThemePicker" class="theme-picker-dropdown" role="menu">
                        <div class="theme-picker-title">{{ t('settings.theme') || 'Theme' }}</div>
                        <button
                            v-for="th in themes"
                            :key="th.id"
                            type="button"
                            class="theme-picker-item"
                            :class="{ active: theme === th.id }"
                            role="menuitemradio"
                            :aria-checked="theme === th.id"
                            @click="selectTheme(th.id)"
                        >
                            <span class="theme-picker-swatch" :style="{ background: th.sidebar }">
                                <span class="theme-picker-swatch-dot" :style="{ background: th.primary }"></span>
                            </span>
                            <span>{{ th.icon }} {{ th.name }}</span>
                            <span v-if="theme === th.id" style="margin-left: auto; color: var(--primary-color);" aria-hidden="true">✓</span>
                        </button>
                    </div>
                </div>
                <!-- Locale -->
                <select class="topbar-locale-select"
                        @change="$emit('change-locale', $event.target.value)"
                        :value="locale"
                        :aria-label="t('settings.language') || 'Language'">
                    <option value="en">🌐 English</option>
                    <option value="zh">🌐 中文</option>
                </select>
                <!-- User & Logout -->
                <span v-if="user" style="color: var(--sidebar-text, #ccc); font-size: 13px; margin-left: 8px;">
                    {{ user.fullName || user.username }}
                </span>
                <button class="topbar-icon-btn"
                        @click="$emit('logout')"
                        :aria-label="t('actions.logout') || 'Logout'"
                        :title="t('actions.logout') || 'Logout'"
                        style="margin-left: 4px;">
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

const ModalDialog = {
    props: ['title', 'show', 'wide'],
    emits: ['close'],
    directives: { focusTrap: vFocusTrap },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')"
             v-focus-trap="{ onEscape: () => $emit('close') }"
             role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal" :style="wide ? 'min-width: 500px; max-width: 95vw; width: auto;' : 'min-width: 500px;'">
                <div class="modal-header">
                    <h3 id="modal-title" class="modal-title">{{ title }}</h3>
                    <button class="modal-close" @click="$emit('close')"
                            :aria-label="t('common.close') || 'Close'">&times;</button>
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
    directives: { focusTrap: vFocusTrap },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div v-if="show" class="drawer-overlay" @click.self="$emit('close')"
             v-focus-trap="{ onEscape: () => $emit('close') }"
             role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div class="drawer drawer-right">
                <div class="drawer-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="drawer-title" style="margin: 0; flex: 1;">{{ title }}</h3>
                    <div class="drawer-header-actions" style="display: flex; align-items: center; gap: 8px;">
                        <slot name="header-actions"></slot>
                        <button class="drawer-close" @click="$emit('close')"
                                :aria-label="t('common.close') || 'Close'">&times;</button>
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
    inject: ['$confirm'],
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
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.cave') }),
                danger: true
            });
            if (!ok) return;
                try {
                    await this.deleteCave(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.cave') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.cave') }) + ': ' + err.message, 'error');
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
    inject: ['$confirm'],
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
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.statue') }),
                danger: true
            });
            if (!ok) return;
                try {
                    await this.deleteStatue(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.statue') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.statue') }) + ': ' + err.message, 'error');
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
    inject: ['$confirm'],
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
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.mural') }),
                danger: true
            });
            if (!ok) return;
                try {
                    await this.deleteMural(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.mural') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.mural') }) + ': ' + err.message, 'error');
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
    inject: ['$confirm'],
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
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.painting') }),
                danger: true
            });
            if (!ok) return;
                try {
                    await this.deletePainting(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.painting') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.painting') }) + ': ' + err.message, 'error');
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
    inject: ['$confirm'],
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
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.inscription') }),
                danger: true
            });
            if (!ok) return;
                try {
                    await this.deleteInscription(item.gid);
                    this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.inscription') }), 'success');
                } catch (err) {
                    this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.inscription') }) + ': ' + err.message, 'error');
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
        ModalDialog,
        CaveView,
        StatueView,
        MuralView,
        PaintingView,
        InscriptionView,
        SettingsView,
        SensorDashboard,
        MaintenanceQueue,
        ConfirmDialog,
        ToastStack,
        ShortcutsCheatsheet,
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

            // Application state. mounted() reconciles this with the URL hash
            // and runs the route-arrival side effects (admin guard, fetches).
            currentView: 'dashboard',
            loading: false,

            // Toast stack — replaces the single inline ErrorMessage banner.
            // showMessage() pushes a toast with a per-toast auto-dismiss
            // timer so two errors in a row no longer overwrite each other.
            toasts: [],
            _toastSeq: 0,

            // Keyboard cheatsheet visibility — toggled by '?'.
            showCheatsheet: false,

            // Backend connection status
            backendOnline: false,

            // Theme
            currentTheme: localStorage.getItem('mgemini-theme') || 'mogao',

            // Anomaly count (sidebar badge) — admin only
            anomalyCount: 0,
            _anomalyTimer: null,
            _healthTimer:  null,
            _onVisibility: null,

            // Drill-in from MaintenanceQueue: { gid, type } pending selection
            pendingArtifactDrillIn: null,

            // Themed-confirm dialog state. Components inject('$confirm') to
            // open it; the dialog component reads this state via prop and
            // resolves the queued promise on confirm/cancel.
            confirmState: {
                open: false,
                message: '',
                confirmLabel: '',
                cancelLabel: '',
                danger: false,
                _resolve: null
            },
        };
    },

    provide() {
        // Expose `$confirm({ message, confirmLabel?, cancelLabel?, danger? })`
        // to every descendant. Returns Promise<boolean>.
        const state = this.confirmState;
        return {
            $confirm: (opts = {}) => new Promise(resolve => {
                state.message      = opts.message || '';
                state.confirmLabel = opts.confirmLabel || '';
                state.cancelLabel  = opts.cancelLabel  || '';
                state.danger       = !!opts.danger;
                state._resolve     = resolve;
                state.open         = true;
            })
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
            // Start health/anomaly polling for the new session — without
            // this, a fresh sign-in (vs. arriving with a stored token) had
            // no background polls until the user refreshed.
            this._startBackgroundPolls();

            // Land on the URL view (a deep-link still works after a session
            // expiry → re-auth round trip). _applyRoute fetches dashboard
            // counts when view='dashboard' and admin-guards otherwise.
            this._applyRoute(parseHash().view);
            setHash(this.currentView);
        },

        handleLogout() {
            this._stopBackgroundPolls();
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('mgemini-token');
            localStorage.removeItem('mgemini-user');
            delete axios.defaults.headers.common['Authorization'];
        },

        changeView(view) {
            // Push the hash; the subscribeRoute handler installed in mounted()
            // will set currentView and run any view-specific work. This keeps
            // a single source of truth (the URL) for the active view.
            if (!setHash(view)) {
                // No URL change (already on this view) — apply side effects
                // directly so refreshes on /dashboard still refetch counts.
                this._applyRoute(view);
            }
        },

        // Side effects of arriving at a view, regardless of how we got here
        // (sidebar click, back button, deep-link, programmatic transition).
        _applyRoute(view) {
            // Bounce admin-only views back to the dashboard when the user
            // isn't admin — otherwise the content pane renders blank because
            // every <admin-view v-if="... && isAdmin"> branch is false.
            if ((view === 'sensors' || view === 'maintenance') && !this.isAdmin) {
                setHash('dashboard');
                return;
            }
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

        showMessage(message, type = 'info', duration = 5000) {
            const id = ++this._toastSeq;
            this.toasts.push({ id, message, type });
            if (duration > 0) {
                setTimeout(() => this.dismissToast(id), duration);
            }
            return id;
        },

        dismissToast(id) {
            const idx = this.toasts.findIndex(t => t.id === id);
            if (idx !== -1) this.toasts.splice(idx, 1);
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
            // Skip when the tab is hidden — saves an idle request every 30 s
            // and avoids piling up backlog when the user comes back to the tab.
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            try {
                const response = await window.api.health.check();
                this.backendOnline = response.data.status !== 'offline';
            } catch (error) {
                this.backendOnline = false;
                if (error.response?.status === 401) this._stopBackgroundPolls();
                console.warn('Backend connection check failed:', error.message);
            }
        },

        async fetchAnomalyCount() {
            if (!this.isAdmin) return;
            // Skip when the tab is hidden, the JWT is gone, or the user has
            // become a guest mid-session — those are silent failure modes.
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            if (!localStorage.getItem('mgemini-token')) return;
            try {
                const res = await window.api.maintenance.anomalies();
                const list = Array.isArray(res.data) ? res.data
                    : Array.isArray(res.data?.anomalies) ? res.data.anomalies
                    : [];
                this.anomalyCount = list.length;
            } catch (err) {
                this.anomalyCount = 0;
                // 401 means the token expired or the role no longer has admin
                // privileges; stop hammering the endpoint until the next sign-in.
                if (err.response?.status === 401) this._stopBackgroundPolls();
            }
        },

        /**
         * Start the background polls + visibility listener. Idempotent: safe
         * to call from mounted() (token in localStorage) and from
         * handleLoginSuccess (fresh sign-in). Without this, a user who
         * landed on the login screen and then signed in had no health or
         * anomaly polling until they refreshed.
         */
        _startBackgroundPolls() {
            this.checkBackendConnection();

            if (!this._healthTimer) {
                this._healthTimer = setInterval(() => this.checkBackendConnection(), 30000);
            }

            if (this.isAdmin && !this._anomalyTimer) {
                this.fetchAnomalyCount();
                this._anomalyTimer = setInterval(() => this.fetchAnomalyCount(), 60000);
            }

            if (!this._onVisibility) {
                this._onVisibility = () => {
                    if (document.visibilityState !== 'visible') return;
                    this.checkBackendConnection();
                    if (this.isAdmin) this.fetchAnomalyCount();
                };
                document.addEventListener('visibilitychange', this._onVisibility);
            }
        },

        /** Tear down all background polls + the visibility listener. Used on
         *  auth-loss (401) and on explicit logout. */
        _stopBackgroundPolls() {
            if (this._anomalyTimer) { clearInterval(this._anomalyTimer); this._anomalyTimer = null; }
            if (this._healthTimer)  { clearInterval(this._healthTimer);  this._healthTimer  = null; }
            if (this._onVisibility) {
                document.removeEventListener('visibilitychange', this._onVisibility);
                this._onVisibility = null;
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
            this.changeView('caves');
        },

        clearPendingDrillIn() {
            this.pendingArtifactDrillIn = null;
        },

        _registerShortcuts() {
            // '/' focuses the most relevant search box on the current view.
            // We pick the first visible .search-input or .page-search-input
            // (CaveList uses the latter for its full-page layout).
            registerSingleKey('/', () => {
                const sel = document.querySelector(
                    '.page-search-input, .search-input, input[type="search"]'
                );
                if (sel) sel.focus();
            });

            // '?' toggles the cheatsheet. The keyboard module lets '?' through
            // even when an overlay is open, so pressing it again while open
            // is a no-op (this.showCheatsheet stays true).
            registerSingleKey('?', () => { this.showCheatsheet = true; });

            // 'g <letter>' jumps between top-level views. The leader-pair
            // helper handles the 1.2s timeout and the followup matching.
            const goto = (view) => () => this.changeView(view);
            registerLeaderPair('g', 'd', goto('dashboard'));
            registerLeaderPair('g', 'c', goto('caves'));
            registerLeaderPair('g', 's', goto('statues'));
            registerLeaderPair('g', 'm', goto('murals'));
            registerLeaderPair('g', 'p', goto('paintings'));
            registerLeaderPair('g', 'i', goto('inscriptions'));
            registerLeaderPair('g', 'e', goto('sensors'));      // e for "environment"
            registerLeaderPair('g', 'q', goto('maintenance'));  // q for "queue"
        },
    },

    mounted() {
        this.applyTheme(this.currentTheme);

        // Restore auth header BEFORE the initial route applies, so dashboard
        // fetches issued by _applyRoute carry Authorization.
        const token = localStorage.getItem('mgemini-token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        } else if (this.currentUser && this.currentUser.role === 'guest') {
            axios.defaults.headers.common['X-Guest-Access'] = 'true';
        }

        // Hash router: subscribe always (so back/forward works across the
        // login boundary). When already authenticated, apply the URL route
        // now — _applyRoute runs the admin guard and any view-specific
        // fetches. handleLoginSuccess does the same after a fresh sign-in.
        this._unsubscribeRoute = subscribeRoute(({ view }) => this._applyRoute(view));

        if (this.isAuthenticated) {
            this._applyRoute(parseHash().view);
            setHash(this.currentView);
            this._startBackgroundPolls();
        }

        // Keyboard shortcuts. Registered once at root; registry survives
        // re-mounts because the maps live at module scope. installed=true
        // is module-scoped so re-installing is a no-op.
        this._registerShortcuts();
        this._uninstallShortcuts = installShortcuts();
    },

    beforeUnmount() {
        this._stopBackgroundPolls();
        if (this._unsubscribeRoute) {
            this._unsubscribeRoute();
            this._unsubscribeRoute = null;
        }
        if (this._uninstallShortcuts) {
            this._uninstallShortcuts();
            this._uninstallShortcuts = null;
        }
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

        <!-- Themed replacement for window.confirm() — mounted once at root,
             driven by the $confirm injection. -->
        <confirm-dialog :state="confirmState"></confirm-dialog>

        <!-- Bottom-right toast stack. showMessage() pushes; each toast has
             its own auto-dismiss timer so consecutive errors stack instead
             of overwriting. -->
        <toast-stack :toasts="toasts" @dismiss="dismissToast"></toast-stack>

        <!-- Keyboard-shortcut cheatsheet, opened with '?'. -->
        <shortcuts-cheatsheet :open="showCheatsheet" :is-admin="isAdmin"
                              @close="showCheatsheet = false"></shortcuts-cheatsheet>
    `
});

// Mount the app
app.mount('#app');

