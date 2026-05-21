/**
 * SettingsView — sidebar nav + section dispatch.
 * Owns the single /users/profile fetch on mount and distributes profile +
 * preferences down to ProfileSection and AppearanceSection respectively.
 */
import { useI18n } from '../i18n.js';
import ProfileSection from './ProfileSection.js';
import AppearanceSection from './AppearanceSection.js';
import UserManagementPanel from './UserManagementPanel.js';
import DatabaseStatsPanel from './DatabaseStatsPanel.js';

const { ref, computed, onMounted } = Vue;

export default {
    name: 'SettingsView',
    components: { ProfileSection, AppearanceSection, UserManagementPanel, DatabaseStatsPanel },
    props: {
        user: { type: Object, default: () => ({}) }
    },
    emits: ['preferences-changed', 'profile-updated', 'show-message'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const activeSection = ref('profile');
        const loadedProfile = ref(null);
        const loadedPreferences = ref(null);

        const isAdmin = computed(() => props.user && props.user.role === 'admin');

        async function loadProfile() {
            try {
                const res = await window.api.get('/users/profile');
                const d = res.data;
                loadedProfile.value = {
                    fullName: d.fullName,
                    username: d.username,
                    email: d.email,
                    gender: d.gender,
                    bio: d.bio,
                    avatar: d.avatar
                };
                if (d.preferences) loadedPreferences.value = d.preferences;
            } catch (err) {
                loadedProfile.value = {
                    fullName: props.user?.fullName || '',
                    username: props.user?.username || '',
                    email: props.user?.email || ''
                };
            }
        }

        onMounted(() => { loadProfile(); });

        function relay(eventName) {
            return (...args) => emit(eventName, ...args);
        }

        return {
            t, activeSection, isAdmin, loadedProfile, loadedPreferences,
            onProfileUpdated: relay('profile-updated'),
            onPreferencesChanged: relay('preferences-changed'),
            onShowMessage: relay('show-message')
        };
    },
    template: `
    <div class="settings-view">
        <div class="settings-sidebar">
            <div class="settings-nav-header">{{ t('settings.userHeader') || 'User' }}</div>
            <div class="settings-nav-item" :class="{ active: activeSection === 'profile' }" @click="activeSection = 'profile'">{{ t('settings.profile') }}</div>
            <div class="settings-nav-item" :class="{ active: activeSection === 'appearance' }" @click="activeSection = 'appearance'">{{ t('settings.appearance') }}</div>
            <template v-if="isAdmin">
                <div class="settings-nav-header">{{ t('settings.adminHeader') || 'Admin' }}</div>
                <div class="settings-nav-item" :class="{ active: activeSection === 'userManagement' }" @click="activeSection = 'userManagement'">{{ t('settings.userManagement') }}</div>
                <div class="settings-nav-item" :class="{ active: activeSection === 'database' }" @click="activeSection = 'database'">{{ t('settings.database') }}</div>
            </template>

            <div class="settings-version">M-Gemini v1.0</div>
        </div>

        <div class="settings-content">
            <profile-section v-if="activeSection === 'profile'"
                :initial-profile="loadedProfile"
                @profile-updated="onProfileUpdated"
                @show-message="onShowMessage" />

            <appearance-section v-if="activeSection === 'appearance'"
                :server-preferences="loadedPreferences"
                @preferences-changed="onPreferencesChanged" />

            <user-management-panel v-if="activeSection === 'userManagement' && isAdmin"
                @show-message="onShowMessage" />

            <database-stats-panel v-if="activeSection === 'database' && isAdmin"
                @show-message="onShowMessage" />
        </div>
    </div>
    `
};
