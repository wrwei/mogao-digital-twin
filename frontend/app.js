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
import { parseHash, setHash, subscribeRoute } from './utils/router.js';
import ConfirmDialog from './components/ConfirmDialog.js';
import ToastStack from './components/ToastStack.js';
import ShortcutsCheatsheet from './components/ShortcutsCheatsheet.js';
import { installShortcuts, registerSingleKey, registerLeaderPair } from './utils/keyboard.js';

// Per-entity Card/Form/List/DetailView modules are imported by their
// respective entity-view files (CaveView, StatueView, etc.) so they are
// not re-imported here.

import SettingsView from './components/SettingsView.js';
import SensorDashboard from './components/SensorDashboard.js';
import MaintenanceQueue from './components/MaintenanceQueue.js';

// Application chrome + shared UI primitives (extracted from this file)
import AppSidebar from './components/AppSidebar.js';
import AppTopbar from './components/AppTopbar.js';
import LoadingSpinner from './components/LoadingSpinner.js';
import ModalDialog from './components/ModalDialog.js';
import DrawerPanel from './components/DrawerPanel.js';
import LoginPage from './components/LoginPage.js';
import DashboardView from './components/DashboardView.js';
import CaveView from './components/CaveView.js';
import StatueView from './components/StatueView.js';
import MuralView from './components/MuralView.js';
import PaintingView from './components/PaintingView.js';
import InscriptionView from './components/InscriptionView.js';

// ============================================
// Entity Composable Factory
// ============================================
import { useEntity } from './composables/useEntity.js';


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
        const cavesComposable = useEntity('Cave', 'caves', 'caves');
        const statuesComposable = useEntity('Statue', 'statues', 'statues');
        const muralsComposable = useEntity('Mural', 'murals', 'murals');
        const paintingsComposable = useEntity('Painting', 'paintings', 'paintings');
        const inscriptionsComposable = useEntity('Inscription', 'inscriptions', 'inscriptions');

        // Auth state lives here as Vue refs so isAdmin / isGuest can track
        // it reactively. Reading localStorage inside a computed doesn't work:
        // localStorage isn't a Vue reactive source, so the computed evaluates
        // once on first access (before login) and never re-runs — the
        // admin-only sidebar items would stay hidden even after the role
        // came back as 'admin' from /users/login.
        const currentUser = Vue.ref(JSON.parse(localStorage.getItem('mgemini-user') || 'null'));
        const isAuthenticated = Vue.ref(!!localStorage.getItem('mgemini-token'));
        const isGuest = Vue.computed(() => !!(currentUser.value && currentUser.value.role === 'guest'));
        const isAdmin = Vue.computed(() => !!(currentUser.value && currentUser.value.role === 'admin'));
        Vue.provide('isGuest', isGuest);

        return {
            currentUser,
            isAuthenticated,
            isAdmin,
            isGuest,
            locale, t, setLocale,
            dashCaves: cavesComposable,
            dashStatues: statuesComposable,
            dashMurals: muralsComposable,
            dashPaintings: paintingsComposable,
            dashInscriptions: inscriptionsComposable,
        };
    },
    data() {
        return {
            // Auth state (isAuthenticated, currentUser) lifted into setup()
            // as refs — see comment there.

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

            // gid extracted from the URL (e.g. #/caves/cave-001 → 'cave-001').
            // _applyRoute updates this on every route change; entity views
            // receive it via :initial-gid and reconcile their detail-drawer
            // state against it. Single source of truth: URL drives state.
            routeGid: null,

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
            this.routeGid = parseHash().gid;
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
                            :initial-gid="routeGid"
                            @drill-in-consumed="clearPendingDrillIn"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></cave-view>
                        <statue-view
                            v-if="currentView === 'statues'"
                            :initial-gid="routeGid"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></statue-view>
                        <mural-view
                            v-if="currentView === 'murals'"
                            :initial-gid="routeGid"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></mural-view>
                        <painting-view
                            v-if="currentView === 'paintings'"
                            :initial-gid="routeGid"
                            @show-message="showMessage"
                            @item-selected="() => {}"
                        ></painting-view>
                        <inscription-view
                            v-if="currentView === 'inscriptions'"
                            :initial-gid="routeGid"
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

