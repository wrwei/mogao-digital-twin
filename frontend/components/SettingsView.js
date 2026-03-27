/**
 * Settings View Component
 * Provides user profile, appearance, notifications, and admin settings
 */
import { useI18n } from '../i18n.js';

const { ref, reactive, computed, onMounted, watch } = Vue;

export default {
    name: 'SettingsView',
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['preferences-changed', 'profile-updated', 'show-message'],
    setup(props, { emit }) {
        const { t, locale, setLocale } = useI18n();

        // Active section
        const activeSection = ref('profile');

        // Profile data
        const profile = reactive({
            fullName: '',
            username: '',
            email: '',
            gender: 'confidential',
            bio: '',
            avatarUrl: ''
        });
        const profileLoading = ref(false);
        const profileSaving = ref(false);

        // Appearance data
        const themes = [
            { id: 'mogao',    name: 'Mogao Sand',     sidebar: '#5C3D2E', primary: '#D4A574', accent: '#8B4513', icon: '\u{1F3DB}\uFE0F' },
            { id: 'ocean',    name: 'Ocean Blue',     sidebar: '#1e3a5f', primary: '#5b9bd5', accent: '#2c5f8a', icon: '\u{1F30A}' },
            { id: 'forest',   name: 'Forest Green',   sidebar: '#2d4a3e', primary: '#6db58a', accent: '#3a7d5c', icon: '\u{1F33F}' },
            { id: 'slate',    name: 'Modern Slate',   sidebar: '#2d3748', primary: '#a0aec0', accent: '#4a5568', icon: '\u{1F5A5}\uFE0F' },
            { id: 'plum',     name: 'Royal Plum',     sidebar: '#3d2b4e', primary: '#b39ddb', accent: '#6a4c93', icon: '\u{1F451}' },
            { id: 'ember',    name: 'Warm Ember',     sidebar: '#4a2020', primary: '#e07a5f', accent: '#8b3a3a', icon: '\u{1F525}' },
            { id: 'midnight', name: 'Midnight Dark',  sidebar: '#1a1a2e', primary: '#7c83db', accent: '#3a3a5c', icon: '\u{1F319}' },
            { id: 'sakura',   name: 'Sakura Blossom', sidebar: '#4a3040', primary: '#e8a0bf', accent: '#8b4f6e', icon: '\u{1F338}' }
        ];
        const currentTheme = ref(localStorage.getItem('mgemini-theme') || 'mogao');
        const fontSize = ref(parseInt(localStorage.getItem('mgemini-font-size') || '14'));
        const sidebarCollapsed = ref(localStorage.getItem('mgemini-sidebar-collapsed') === 'true');

        // Notifications data
        const notifications = reactive({
            emailEnabled: true,
            inAppEnabled: true,
            digestFrequency: 'none'
        });

        // Admin: User Management
        const users = ref([]);
        const usersLoading = ref(false);
        const editingUserId = ref(null);
        const editUserData = reactive({ role: '', status: '' });
        const deleteConfirmId = ref(null);

        // Admin: Database
        const dbStats = ref([]);
        const dbStatsLoading = ref(false);

        // Computed
        const isAdmin = computed(() => props.user && props.user.role === 'admin');
        const bioRemaining = computed(() => 200 - (profile.bio || '').length);

        // Methods
        async function loadProfile() {
            profileLoading.value = true;
            try {
                const res = await window.api.get('/users/profile');
                const data = res.data || res;
                profile.fullName = data.fullName || data.name || '';
                profile.username = data.username || props.user.username || '';
                profile.email = data.email || props.user.email || '';
                profile.gender = data.gender || 'confidential';
                profile.bio = data.bio || '';
                profile.avatarUrl = data.avatarUrl || data.avatar || '';
            } catch (err) {
                // Fallback to props
                profile.fullName = props.user.name || props.user.fullName || '';
                profile.username = props.user.username || '';
                profile.email = props.user.email || '';
            } finally {
                profileLoading.value = false;
            }
        }

        async function saveProfile() {
            profileSaving.value = true;
            try {
                await window.api.put('/users/profile', {
                    fullName: profile.fullName,
                    gender: profile.gender,
                    bio: profile.bio,
                    avatarUrl: profile.avatarUrl
                });
                emit('profile-updated', { ...profile });
                emit('show-message', 'Profile saved successfully', 'success');
            } catch (err) {
                emit('show-message', 'Failed to save profile: ' + (err.message || err), 'error');
            } finally {
                profileSaving.value = false;
            }
        }

        function handleAvatarUpload(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                profile.avatarUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function selectTheme(themeId) {
            currentTheme.value = themeId;
            localStorage.setItem('mgemini-theme', themeId);
            document.documentElement.setAttribute('data-theme', themeId);
            emit('preferences-changed', { theme: themeId });
        }

        function updateFontSize(val) {
            fontSize.value = parseInt(val);
            localStorage.setItem('mgemini-font-size', fontSize.value);
            document.documentElement.style.fontSize = fontSize.value + 'px';
            emit('preferences-changed', { fontSize: fontSize.value });
        }

        function changeLanguage(lang) {
            setLocale(lang);
            emit('preferences-changed', { language: lang });
        }

        function toggleSidebarCollapsed() {
            sidebarCollapsed.value = !sidebarCollapsed.value;
            localStorage.setItem('mgemini-sidebar-collapsed', sidebarCollapsed.value);
            emit('preferences-changed', { sidebarCollapsed: sidebarCollapsed.value });
        }

        async function savePreferences() {
            try {
                await window.api.put('/users/preferences', {
                    theme: currentTheme.value,
                    fontSize: fontSize.value,
                    language: locale.value,
                    sidebarCollapsed: sidebarCollapsed.value,
                    emailNotifications: notifications.emailEnabled,
                    inAppNotifications: notifications.inAppEnabled,
                    digestFrequency: notifications.digestFrequency
                });
                emit('show-message', 'Preferences saved', 'success');
            } catch (err) {
                // Silently handle - preferences are also saved locally
            }
        }

        // Admin methods
        async function loadUsers() {
            usersLoading.value = true;
            try {
                const res = await window.api.get('/users');
                users.value = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            } catch (err) {
                emit('show-message', 'Failed to load users: ' + (err.message || err), 'error');
            } finally {
                usersLoading.value = false;
            }
        }

        function startEditUser(user) {
            editingUserId.value = user._id || user.id;
            editUserData.role = user.role || 'user';
            editUserData.status = user.status || 'active';
        }

        function cancelEditUser() {
            editingUserId.value = null;
        }

        async function saveUserEdit(user) {
            try {
                const userId = user._id || user.id;
                await window.api.put('/users/' + userId, {
                    role: editUserData.role,
                    status: editUserData.status
                });
                editingUserId.value = null;
                await loadUsers();
                emit('show-message', 'User updated successfully', 'success');
            } catch (err) {
                emit('show-message', 'Failed to update user: ' + (err.message || err), 'error');
            }
        }

        function confirmDeleteUser(user) {
            deleteConfirmId.value = user._id || user.id;
        }

        function cancelDelete() {
            deleteConfirmId.value = null;
        }

        async function deleteUser(user) {
            try {
                const userId = user._id || user.id;
                await window.api.delete('/users/' + userId);
                deleteConfirmId.value = null;
                await loadUsers();
                emit('show-message', 'User deleted successfully', 'success');
            } catch (err) {
                emit('show-message', 'Failed to delete user: ' + (err.message || err), 'error');
            }
        }

        async function loadDbStats() {
            dbStatsLoading.value = true;
            try {
                const res = await window.api.get('/users/database-stats');
                const data = res.data || res;
                if (Array.isArray(data)) {
                    dbStats.value = data;
                } else if (typeof data === 'object') {
                    dbStats.value = Object.entries(data).map(([name, count]) => ({ name, count }));
                }
            } catch (err) {
                emit('show-message', 'Failed to load database stats: ' + (err.message || err), 'error');
            } finally {
                dbStatsLoading.value = false;
            }
        }

        // Watch active section for lazy loading admin data
        watch(activeSection, (section) => {
            if (section === 'userManagement' && users.value.length === 0) {
                loadUsers();
            }
            if (section === 'database' && dbStats.value.length === 0) {
                loadDbStats();
            }
        });

        onMounted(() => {
            loadProfile();
        });

        return {
            t, locale,
            activeSection,
            profile, profileLoading, profileSaving,
            themes, currentTheme, fontSize, sidebarCollapsed,
            notifications,
            users, usersLoading, editingUserId, editUserData, deleteConfirmId,
            dbStats, dbStatsLoading,
            isAdmin, bioRemaining,
            loadProfile, saveProfile, handleAvatarUpload,
            selectTheme, updateFontSize, changeLanguage, toggleSidebarCollapsed, savePreferences,
            loadUsers, startEditUser, cancelEditUser, saveUserEdit,
            confirmDeleteUser, cancelDelete, deleteUser,
            loadDbStats
        };
    },
    template: `
    <div class="settings-view" style="display: flex; height: 100%; overflow: hidden;">

        <!-- Settings Sidebar -->
        <div class="settings-sidebar" style="
            width: 220px;
            min-width: 220px;
            background: var(--surface, #fff);
            border-right: 1px solid var(--border, #ddd);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        ">
            <div class="settings-nav-header" style="
                padding: 16px 20px 6px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                color: var(--text-secondary, #666);
                font-weight: 600;
            ">User</div>

            <div class="settings-nav-item" style="
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                border-left: 3px solid transparent;
                transition: all 0.2s;
                color: var(--text-primary, #333);
            "
                :style="activeSection === 'profile' ? {
                    background: 'var(--sidebar-active, rgba(212,165,116,0.15))',
                    borderLeftColor: 'var(--primary-color, #D4A574)',
                    fontWeight: '600'
                } : {}"
                @click="activeSection = 'profile'"
                @mouseenter="$event.target.style.background = activeSection !== 'profile' ? 'var(--sidebar-hover, rgba(0,0,0,0.04))' : ''"
                @mouseleave="$event.target.style.background = activeSection !== 'profile' ? '' : ''"
            >
                <span style="margin-right: 10px;">&#128100;</span> Profile
            </div>

            <div class="settings-nav-item" style="
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                border-left: 3px solid transparent;
                transition: all 0.2s;
                color: var(--text-primary, #333);
            "
                :style="activeSection === 'appearance' ? {
                    background: 'var(--sidebar-active, rgba(212,165,116,0.15))',
                    borderLeftColor: 'var(--primary-color, #D4A574)',
                    fontWeight: '600'
                } : {}"
                @click="activeSection = 'appearance'"
                @mouseenter="$event.target.style.background = activeSection !== 'appearance' ? 'var(--sidebar-hover, rgba(0,0,0,0.04))' : ''"
                @mouseleave="$event.target.style.background = activeSection !== 'appearance' ? '' : ''"
            >
                <span style="margin-right: 10px;">&#127912;</span> Appearance
            </div>

            <div class="settings-nav-item" style="
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                border-left: 3px solid transparent;
                transition: all 0.2s;
                color: var(--text-primary, #333);
            "
                :style="activeSection === 'notifications' ? {
                    background: 'var(--sidebar-active, rgba(212,165,116,0.15))',
                    borderLeftColor: 'var(--primary-color, #D4A574)',
                    fontWeight: '600'
                } : {}"
                @click="activeSection = 'notifications'"
                @mouseenter="$event.target.style.background = activeSection !== 'notifications' ? 'var(--sidebar-hover, rgba(0,0,0,0.04))' : ''"
                @mouseleave="$event.target.style.background = activeSection !== 'notifications' ? '' : ''"
            >
                <span style="margin-right: 10px;">&#128276;</span> Notifications
            </div>

            <template v-if="isAdmin">
                <div class="settings-nav-header" style="
                    padding: 16px 20px 6px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    color: var(--text-secondary, #666);
                    font-weight: 600;
                    margin-top: 8px;
                ">Admin</div>

                <div class="settings-nav-item" style="
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    border-left: 3px solid transparent;
                    transition: all 0.2s;
                    color: var(--text-primary, #333);
                "
                    :style="activeSection === 'userManagement' ? {
                        background: 'var(--sidebar-active, rgba(212,165,116,0.15))',
                        borderLeftColor: 'var(--primary-color, #D4A574)',
                        fontWeight: '600'
                    } : {}"
                    @click="activeSection = 'userManagement'"
                    @mouseenter="$event.target.style.background = activeSection !== 'userManagement' ? 'var(--sidebar-hover, rgba(0,0,0,0.04))' : ''"
                    @mouseleave="$event.target.style.background = activeSection !== 'userManagement' ? '' : ''"
                >
                    <span style="margin-right: 10px;">&#128101;</span> User Management
                </div>

                <div class="settings-nav-item" style="
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    border-left: 3px solid transparent;
                    transition: all 0.2s;
                    color: var(--text-primary, #333);
                "
                    :style="activeSection === 'database' ? {
                        background: 'var(--sidebar-active, rgba(212,165,116,0.15))',
                        borderLeftColor: 'var(--primary-color, #D4A574)',
                        fontWeight: '600'
                    } : {}"
                    @click="activeSection = 'database'"
                    @mouseenter="$event.target.style.background = activeSection !== 'database' ? 'var(--sidebar-hover, rgba(0,0,0,0.04))' : ''"
                    @mouseleave="$event.target.style.background = activeSection !== 'database' ? '' : ''"
                >
                    <span style="margin-right: 10px;">&#128451;</span> Database
                </div>
            </template>

            <div style="flex: 1;"></div>
            <div class="settings-version" style="
                padding: 16px 20px;
                font-size: 11px;
                color: var(--text-secondary, #999);
                border-top: 1px solid var(--border, #eee);
            ">M-Gemini v1.0</div>
        </div>

        <!-- Settings Content -->
        <div class="settings-content" style="flex: 1; overflow-y: auto; padding: 32px; background: var(--background, #f5f0eb);">

            <!-- =============================== -->
            <!-- Profile Section                 -->
            <!-- =============================== -->
            <div v-if="activeSection === 'profile'">
                <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 600; color: var(--text-primary, #333);">Profile</h2>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #666); font-size: 13px;">Manage your personal information</p>

                <div v-if="profileLoading" style="text-align: center; padding: 40px; color: var(--text-secondary, #666);">Loading profile...</div>

                <div v-else style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 28px;
                    max-width: 600px;
                ">
                    <!-- Avatar -->
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 28px;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            background: var(--primary-color, #D4A574);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            color: #fff;
                            overflow: hidden;
                            flex-shrink: 0;
                            border: 3px solid var(--border, #ddd);
                        ">
                            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" style="width: 100%; height: 100%; object-fit: cover;" />
                            <span v-else>{{ (profile.fullName || profile.username || 'U').charAt(0).toUpperCase() }}</span>
                        </div>
                        <div>
                            <label style="
                                display: inline-block;
                                padding: 6px 16px;
                                background: var(--primary-color, #D4A574);
                                color: #fff;
                                border-radius: var(--radius-sm, 4px);
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: 500;
                                transition: opacity 0.2s;
                            "
                                @mouseenter="$event.target.style.opacity = '0.85'"
                                @mouseleave="$event.target.style.opacity = '1'"
                            >
                                Upload Photo
                                <input type="file" accept="image/*" @change="handleAvatarUpload" style="display: none;" />
                            </label>
                            <p style="margin: 6px 0 0; font-size: 12px; color: var(--text-secondary, #999);">JPG, PNG, or GIF. Max 2MB.</p>
                        </div>
                    </div>

                    <!-- Full Name -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 6px;">Full Name</label>
                        <input
                            v-model="profile.fullName"
                            type="text"
                            placeholder="Enter your full name"
                            style="
                                width: 100%;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-primary, #333);
                                background: var(--surface, #fff);
                                outline: none;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            @focus="$event.target.style.borderColor = 'var(--primary-color, #D4A574)'"
                            @blur="$event.target.style.borderColor = 'var(--border, #ddd)'"
                        />
                    </div>

                    <!-- Username (read-only) -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 6px;">Username</label>
                        <input
                            :value="profile.username"
                            type="text"
                            disabled
                            style="
                                width: 100%;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-secondary, #999);
                                background: #f5f5f5;
                                cursor: not-allowed;
                                box-sizing: border-box;
                            "
                        />
                    </div>

                    <!-- Email (read-only) -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 6px;">Email</label>
                        <input
                            :value="profile.email"
                            type="email"
                            disabled
                            style="
                                width: 100%;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-secondary, #999);
                                background: #f5f5f5;
                                cursor: not-allowed;
                                box-sizing: border-box;
                            "
                        />
                    </div>

                    <!-- Gender -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 6px;">Gender</label>
                        <select
                            v-model="profile.gender"
                            style="
                                width: 100%;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-primary, #333);
                                background: var(--surface, #fff);
                                outline: none;
                                box-sizing: border-box;
                            "
                        >
                            <option value="confidential">Confidential</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <!-- Bio -->
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 6px;">
                            Bio
                            <span style="font-weight: 400; color: var(--text-secondary, #999); margin-left: 8px;">{{ bioRemaining }} characters remaining</span>
                        </label>
                        <textarea
                            v-model="profile.bio"
                            maxlength="200"
                            rows="3"
                            placeholder="Write a short bio about yourself..."
                            style="
                                width: 100%;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-primary, #333);
                                background: var(--surface, #fff);
                                outline: none;
                                resize: vertical;
                                font-family: inherit;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            @focus="$event.target.style.borderColor = 'var(--primary-color, #D4A574)'"
                            @blur="$event.target.style.borderColor = 'var(--border, #ddd)'"
                        ></textarea>
                    </div>

                    <!-- Save Button -->
                    <button
                        @click="saveProfile"
                        :disabled="profileSaving"
                        style="
                            padding: 10px 28px;
                            background: var(--primary-color, #D4A574);
                            color: #fff;
                            border: none;
                            border-radius: var(--radius-sm, 4px);
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: opacity 0.2s;
                        "
                        @mouseenter="$event.target.style.opacity = '0.85'"
                        @mouseleave="$event.target.style.opacity = '1'"
                    >
                        {{ profileSaving ? 'Saving...' : 'Save Profile' }}
                    </button>
                </div>
            </div>

            <!-- =============================== -->
            <!-- Appearance Section              -->
            <!-- =============================== -->
            <div v-if="activeSection === 'appearance'">
                <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 600; color: var(--text-primary, #333);">Appearance</h2>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #666); font-size: 13px;">Customize how M-Gemini looks and feels</p>

                <!-- Theme Grid -->
                <div style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 24px;
                    margin-bottom: 20px;
                ">
                    <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--text-primary, #333);">Theme</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                        <div
                            v-for="theme in themes"
                            :key="theme.id"
                            @click="selectTheme(theme.id)"
                            style="
                                padding: 14px;
                                border-radius: var(--radius-md, 8px);
                                cursor: pointer;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            "
                            :style="{
                                border: currentTheme === theme.id
                                    ? '2px solid var(--primary-color, #D4A574)'
                                    : '2px solid var(--border, #ddd)',
                                background: currentTheme === theme.id
                                    ? 'rgba(212,165,116,0.08)'
                                    : 'transparent'
                            }"
                            @mouseenter="if (currentTheme !== theme.id) $event.currentTarget.style.borderColor = 'var(--text-secondary, #999)'"
                            @mouseleave="if (currentTheme !== theme.id) $event.currentTarget.style.borderColor = 'var(--border, #ddd)'"
                        >
                            <div style="display: flex; gap: 4px; flex-shrink: 0;">
                                <span :style="{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', background: theme.sidebar }"></span>
                                <span :style="{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', background: theme.primary }"></span>
                                <span :style="{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', background: theme.accent }"></span>
                            </div>
                            <div style="min-width: 0;">
                                <div style="font-size: 13px; font-weight: 600; color: var(--text-primary, #333); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    {{ theme.icon }} {{ theme.name }}
                                </div>
                            </div>
                            <span v-if="currentTheme === theme.id" style="margin-left: auto; color: var(--primary-color, #D4A574); font-size: 16px; flex-shrink: 0;">&#10003;</span>
                        </div>
                    </div>
                </div>

                <!-- Font Size -->
                <div style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 24px;
                    margin-bottom: 20px;
                    max-width: 600px;
                ">
                    <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--text-primary, #333);">Font Size</h3>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span style="font-size: 12px; color: var(--text-secondary, #666);">A</span>
                        <input
                            type="range"
                            min="12"
                            max="20"
                            :value="fontSize"
                            @input="updateFontSize($event.target.value)"
                            style="flex: 1; accent-color: var(--primary-color, #D4A574);"
                        />
                        <span style="font-size: 20px; color: var(--text-secondary, #666);">A</span>
                        <span style="
                            min-width: 44px;
                            text-align: center;
                            padding: 4px 8px;
                            background: var(--background, #f5f0eb);
                            border-radius: var(--radius-sm, 4px);
                            font-size: 13px;
                            font-weight: 600;
                            color: var(--text-primary, #333);
                        ">{{ fontSize }}px</span>
                    </div>
                    <p :style="{ marginTop: '12px', fontSize: fontSize + 'px', color: 'var(--text-primary, #333)' }">Preview: The quick brown fox jumps over the lazy dog.</p>
                </div>

                <!-- Language -->
                <div style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 24px;
                    margin-bottom: 20px;
                    max-width: 600px;
                ">
                    <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--text-primary, #333);">Language</h3>
                    <select
                        :value="locale"
                        @change="changeLanguage($event.target.value)"
                        style="
                            width: 240px;
                            padding: 9px 12px;
                            border: 1px solid var(--border, #ddd);
                            border-radius: var(--radius-sm, 4px);
                            font-size: 14px;
                            color: var(--text-primary, #333);
                            background: var(--surface, #fff);
                            outline: none;
                        "
                    >
                        <option value="en">English</option>
                        <option value="zh">&#20013;&#25991;</option>
                    </select>
                </div>

                <!-- Sidebar Collapsed -->
                <div style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 24px;
                    max-width: 600px;
                ">
                    <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--text-primary, #333);">Sidebar</h3>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: var(--text-primary, #333);">Collapse sidebar</div>
                            <div style="font-size: 12px; color: var(--text-secondary, #999); margin-top: 2px;">Show icons only in the navigation sidebar</div>
                        </div>
                        <div
                            @click="toggleSidebarCollapsed"
                            style="
                                width: 44px;
                                height: 24px;
                                border-radius: 12px;
                                cursor: pointer;
                                transition: background 0.2s;
                                position: relative;
                                flex-shrink: 0;
                            "
                            :style="{
                                background: sidebarCollapsed ? 'var(--primary-color, #D4A574)' : '#ccc'
                            }"
                        >
                            <div style="
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #fff;
                                position: absolute;
                                top: 2px;
                                transition: left 0.2s;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            "
                                :style="{ left: sidebarCollapsed ? '22px' : '2px' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- =============================== -->
            <!-- Notifications Section           -->
            <!-- =============================== -->
            <div v-if="activeSection === 'notifications'">
                <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 600; color: var(--text-primary, #333);">Notifications</h2>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #666); font-size: 13px;">Configure how you receive notifications</p>

                <div style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 24px;
                    max-width: 600px;
                ">
                    <!-- Email notifications toggle -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: var(--text-primary, #333);">Email notifications</div>
                            <div style="font-size: 12px; color: var(--text-secondary, #999); margin-top: 2px;">Receive email alerts for important events</div>
                        </div>
                        <div
                            @click="notifications.emailEnabled = !notifications.emailEnabled"
                            style="
                                width: 44px;
                                height: 24px;
                                border-radius: 12px;
                                cursor: pointer;
                                transition: background 0.2s;
                                position: relative;
                                flex-shrink: 0;
                            "
                            :style="{
                                background: notifications.emailEnabled ? 'var(--primary-color, #D4A574)' : '#ccc'
                            }"
                        >
                            <div style="
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #fff;
                                position: absolute;
                                top: 2px;
                                transition: left 0.2s;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            "
                                :style="{ left: notifications.emailEnabled ? '22px' : '2px' }"
                            ></div>
                        </div>
                    </div>

                    <!-- In-app notifications toggle -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: var(--text-primary, #333);">In-app notifications</div>
                            <div style="font-size: 12px; color: var(--text-secondary, #999); margin-top: 2px;">Show notification badges and alerts in the app</div>
                        </div>
                        <div
                            @click="notifications.inAppEnabled = !notifications.inAppEnabled"
                            style="
                                width: 44px;
                                height: 24px;
                                border-radius: 12px;
                                cursor: pointer;
                                transition: background 0.2s;
                                position: relative;
                                flex-shrink: 0;
                            "
                            :style="{
                                background: notifications.inAppEnabled ? 'var(--primary-color, #D4A574)' : '#ccc'
                            }"
                        >
                            <div style="
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #fff;
                                position: absolute;
                                top: 2px;
                                transition: left 0.2s;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            "
                                :style="{ left: notifications.inAppEnabled ? '22px' : '2px' }"
                            ></div>
                        </div>
                    </div>

                    <!-- Digest frequency -->
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text-primary, #333); margin-bottom: 4px;">Digest frequency</label>
                        <div style="font-size: 12px; color: var(--text-secondary, #999); margin-bottom: 10px;">How often to receive a summary of activity</div>
                        <select
                            v-model="notifications.digestFrequency"
                            style="
                                width: 240px;
                                padding: 9px 12px;
                                border: 1px solid var(--border, #ddd);
                                border-radius: var(--radius-sm, 4px);
                                font-size: 14px;
                                color: var(--text-primary, #333);
                                background: var(--surface, #fff);
                                outline: none;
                            "
                        >
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- =============================== -->
            <!-- User Management Section (Admin) -->
            <!-- =============================== -->
            <div v-if="activeSection === 'userManagement' && isAdmin">
                <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 600; color: var(--text-primary, #333);">User Management</h2>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #666); font-size: 13px;">Manage system users and their roles</p>

                <div v-if="usersLoading" style="text-align: center; padding: 40px; color: var(--text-secondary, #666);">Loading users...</div>

                <div v-else style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    overflow: hidden;
                ">
                    <div v-if="users.length === 0" style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">
                        No users found
                    </div>

                    <table v-else style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: var(--background, #f5f0eb); border-bottom: 1px solid var(--border, #ddd);">
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: var(--text-secondary, #666); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">User</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: var(--text-secondary, #666); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: var(--text-secondary, #666); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Role</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: var(--text-secondary, #666); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: var(--text-secondary, #666); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="u in users"
                                :key="u._id || u.id"
                                style="border-bottom: 1px solid var(--border, #eee); transition: background 0.15s;"
                                @mouseenter="$event.currentTarget.style.background = 'var(--background, #faf8f5)'"
                                @mouseleave="$event.currentTarget.style.background = ''"
                            >
                                <td style="padding: 12px 16px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="
                                            width: 32px;
                                            height: 32px;
                                            border-radius: 50%;
                                            background: var(--primary-color, #D4A574);
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            color: #fff;
                                            font-size: 13px;
                                            font-weight: 600;
                                            flex-shrink: 0;
                                            overflow: hidden;
                                        ">
                                            <img v-if="u.avatarUrl || u.avatar" :src="u.avatarUrl || u.avatar" style="width: 100%; height: 100%; object-fit: cover;" />
                                            <span v-else>{{ (u.name || u.fullName || u.username || 'U').charAt(0).toUpperCase() }}</span>
                                        </div>
                                        <div>
                                            <div style="font-weight: 500; color: var(--text-primary, #333);">{{ u.name || u.fullName || u.username }}</div>
                                            <div style="font-size: 12px; color: var(--text-secondary, #999);">@{{ u.username }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 12px 16px; color: var(--text-secondary, #666);">{{ u.email || '-' }}</td>

                                <!-- Role (editable or display) -->
                                <td style="padding: 12px 16px;">
                                    <select
                                        v-if="editingUserId === (u._id || u.id)"
                                        v-model="editUserData.role"
                                        style="padding: 4px 8px; border: 1px solid var(--border, #ddd); border-radius: var(--radius-sm, 4px); font-size: 13px;"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                    <span v-else style="
                                        display: inline-block;
                                        padding: 2px 10px;
                                        border-radius: 10px;
                                        font-size: 12px;
                                        font-weight: 500;
                                    "
                                        :style="{
                                            background: u.role === 'admin' ? 'rgba(212,165,116,0.2)' : 'rgba(0,0,0,0.06)',
                                            color: u.role === 'admin' ? 'var(--secondary-color, #8B4513)' : 'var(--text-secondary, #666)'
                                        }"
                                    >{{ u.role || 'user' }}</span>
                                </td>

                                <!-- Status (editable or display) -->
                                <td style="padding: 12px 16px;">
                                    <select
                                        v-if="editingUserId === (u._id || u.id)"
                                        v-model="editUserData.status"
                                        style="padding: 4px 8px; border: 1px solid var(--border, #ddd); border-radius: var(--radius-sm, 4px); font-size: 13px;"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <span v-else style="
                                        display: inline-block;
                                        padding: 2px 10px;
                                        border-radius: 10px;
                                        font-size: 12px;
                                        font-weight: 500;
                                    "
                                        :style="{
                                            background: (u.status || 'active') === 'active' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.1)',
                                            color: (u.status || 'active') === 'active' ? '#2e7d32' : '#c62828'
                                        }"
                                    >{{ u.status || 'active' }}</span>
                                </td>

                                <!-- Actions -->
                                <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                                    <template v-if="editingUserId === (u._id || u.id)">
                                        <button
                                            @click="saveUserEdit(u)"
                                            style="
                                                padding: 4px 12px;
                                                background: var(--success-color, #4CAF50);
                                                color: #fff;
                                                border: none;
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                                margin-right: 6px;
                                            "
                                        >Save</button>
                                        <button
                                            @click="cancelEditUser"
                                            style="
                                                padding: 4px 12px;
                                                background: var(--border, #ddd);
                                                color: var(--text-primary, #333);
                                                border: none;
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                            "
                                        >Cancel</button>
                                    </template>
                                    <template v-else-if="deleteConfirmId === (u._id || u.id)">
                                        <span style="font-size: 12px; color: var(--error-color, #F44336); margin-right: 8px;">Delete?</span>
                                        <button
                                            @click="deleteUser(u)"
                                            style="
                                                padding: 4px 12px;
                                                background: var(--error-color, #F44336);
                                                color: #fff;
                                                border: none;
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                                margin-right: 6px;
                                            "
                                        >Yes</button>
                                        <button
                                            @click="cancelDelete"
                                            style="
                                                padding: 4px 12px;
                                                background: var(--border, #ddd);
                                                color: var(--text-primary, #333);
                                                border: none;
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                            "
                                        >No</button>
                                    </template>
                                    <template v-else>
                                        <button
                                            @click="startEditUser(u)"
                                            style="
                                                padding: 4px 12px;
                                                background: var(--primary-color, #D4A574);
                                                color: #fff;
                                                border: none;
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                                margin-right: 6px;
                                                transition: opacity 0.2s;
                                            "
                                            @mouseenter="$event.target.style.opacity = '0.85'"
                                            @mouseleave="$event.target.style.opacity = '1'"
                                        >Edit</button>
                                        <button
                                            @click="confirmDeleteUser(u)"
                                            style="
                                                padding: 4px 12px;
                                                background: transparent;
                                                color: var(--error-color, #F44336);
                                                border: 1px solid var(--error-color, #F44336);
                                                border-radius: var(--radius-sm, 4px);
                                                font-size: 12px;
                                                cursor: pointer;
                                                transition: all 0.2s;
                                            "
                                            @mouseenter="$event.target.style.background = 'var(--error-color, #F44336)'; $event.target.style.color = '#fff'"
                                            @mouseleave="$event.target.style.background = 'transparent'; $event.target.style.color = 'var(--error-color, #F44336)'"
                                        >Delete</button>
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- =============================== -->
            <!-- Database Section (Admin)        -->
            <!-- =============================== -->
            <div v-if="activeSection === 'database' && isAdmin">
                <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 600; color: var(--text-primary, #333);">Database</h2>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #666); font-size: 13px;">Collection statistics and document counts</p>

                <div v-if="dbStatsLoading" style="text-align: center; padding: 40px; color: var(--text-secondary, #666);">Loading database statistics...</div>

                <div v-else-if="dbStats.length === 0" style="
                    background: var(--surface, #fff);
                    border: 1px solid var(--border, #ddd);
                    border-radius: var(--radius-lg, 12px);
                    padding: 40px;
                    text-align: center;
                    color: var(--text-secondary, #666);
                ">
                    No database statistics available
                </div>

                <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                    <div
                        v-for="stat in dbStats"
                        :key="stat.name"
                        style="
                            background: var(--surface, #fff);
                            border: 1px solid var(--border, #ddd);
                            border-radius: var(--radius-lg, 12px);
                            padding: 24px;
                            text-align: center;
                            transition: box-shadow 0.2s;
                        "
                        @mouseenter="$event.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 6px rgba(0,0,0,0.1))'"
                        @mouseleave="$event.currentTarget.style.boxShadow = 'none'"
                    >
                        <div style="
                            font-size: 32px;
                            font-weight: 700;
                            color: var(--primary-color, #D4A574);
                            margin-bottom: 8px;
                        ">{{ typeof stat.count === 'number' ? stat.count.toLocaleString() : stat.count }}</div>
                        <div style="
                            font-size: 13px;
                            font-weight: 500;
                            color: var(--text-secondary, #666);
                            text-transform: capitalize;
                        ">{{ stat.name }}</div>
                    </div>
                </div>

                <div style="margin-top: 16px;">
                    <button
                        @click="loadDbStats"
                        style="
                            padding: 8px 20px;
                            background: var(--surface, #fff);
                            color: var(--text-primary, #333);
                            border: 1px solid var(--border, #ddd);
                            border-radius: var(--radius-sm, 4px);
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "
                        @mouseenter="$event.target.style.borderColor = 'var(--primary-color, #D4A574)'"
                        @mouseleave="$event.target.style.borderColor = 'var(--border, #ddd)'"
                    >
                        &#8635; Refresh
                    </button>
                </div>
            </div>

        </div>
    </div>
    `
};
