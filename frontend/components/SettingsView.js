/**
 * Settings View Component
 * Provides user profile, appearance, and admin settings
 */
import { useI18n } from '../i18n.js';

const { ref, reactive, computed, onMounted, watch } = Vue;

export default {
    name: 'SettingsView',
    props: {
        user: { type: Object, default: () => ({}) }
    },
    emits: ['preferences-changed', 'profile-updated', 'show-message'],
    setup(props, { emit }) {
        const { t, locale, setLocale } = useI18n();
        const activeSection = ref('profile');

        // Profile
        const profile = reactive({ fullName: '', username: '', email: '', gender: 'confidential', bio: '', avatar: '' });
        const profileLoading = ref(false);
        const profileSaving = ref(false);

        // Appearance
        const themes = [
            { id: 'mogao', name: 'Mogao Sand', sidebar: '#5C3D2E', primary: '#D4A574', accent: '#8B4513' },
            { id: 'ocean', name: 'Ocean Blue', sidebar: '#1e3a5f', primary: '#5b9bd5', accent: '#2c5f8a' },
            { id: 'forest', name: 'Forest Green', sidebar: '#2d4a3e', primary: '#6db58a', accent: '#3a7d5c' },
            { id: 'slate', name: 'Modern Slate', sidebar: '#2d3748', primary: '#a0aec0', accent: '#4a5568' },
            { id: 'plum', name: 'Royal Plum', sidebar: '#3d2b4e', primary: '#b39ddb', accent: '#6a4c93' },
            { id: 'ember', name: 'Warm Ember', sidebar: '#4a2020', primary: '#e07a5f', accent: '#8b3a3a' },
            { id: 'midnight', name: 'Midnight Dark', sidebar: '#1a1a2e', primary: '#7c83db', accent: '#3a3a5c' },
            { id: 'sakura', name: 'Sakura Blossom', sidebar: '#4a3040', primary: '#e8a0bf', accent: '#8b4f6e' }
        ];
        const currentTheme = ref(localStorage.getItem('mgemini-theme') || 'mogao');
        const fontSize = ref(parseInt(localStorage.getItem('mgemini-font-size') || '14'));
        const sidebarCollapsed = ref(localStorage.getItem('mgemini-sidebar-collapsed') === 'true');

        // Admin
        const users = ref([]);
        const usersLoading = ref(false);
        const editingUserId = ref(null);
        const editUserData = reactive({ role: '', accountStatus: '' });
        const dbStats = ref([]);
        const dbStatsLoading = ref(false);

        const isAdmin = computed(() => props.user && props.user.role === 'admin');
        const bioRemaining = computed(() => 200 - (profile.bio || '').length);
        const initials = computed(() => {
            const name = profile.fullName || profile.username || '?';
            return name.charAt(0).toUpperCase();
        });

        async function loadProfile() {
            profileLoading.value = true;
            try {
                const res = await window.api.get('/users/profile');
                const d = res.data;
                profile.fullName = d.fullName || '';
                profile.username = d.username || '';
                profile.email = d.email || '';
                profile.gender = d.gender || 'confidential';
                profile.bio = d.bio || '';
                profile.avatar = d.avatar || '';
                if (d.preferences) {
                    currentTheme.value = d.preferences.theme || currentTheme.value;
                    fontSize.value = d.preferences.fontSize || fontSize.value;
                    sidebarCollapsed.value = d.preferences.sidebarCollapsed || false;
                }
            } catch (err) {
                profile.fullName = props.user?.fullName || '';
                profile.username = props.user?.username || '';
                profile.email = props.user?.email || '';
            } finally {
                profileLoading.value = false;
            }
        }

        async function saveProfile() {
            profileSaving.value = true;
            try {
                await window.api.put('/users/profile', {
                    fullName: profile.fullName,
                    email: profile.email,
                    gender: profile.gender,
                    bio: profile.bio
                });
                emit('profile-updated', { fullName: profile.fullName, email: profile.email, gender: profile.gender, bio: profile.bio });
                emit('show-message', 'Profile saved successfully', 'success');
            } catch (err) {
                emit('show-message', 'Failed to save profile', 'error');
            } finally {
                profileSaving.value = false;
            }
        }

        function selectTheme(id) {
            currentTheme.value = id;
            localStorage.setItem('mgemini-theme', id);
            document.documentElement.setAttribute('data-theme', id);
            emit('preferences-changed', { theme: id });
            savePrefs();
        }

        function updateFontSize(e) {
            fontSize.value = parseInt(e.target.value);
            localStorage.setItem('mgemini-font-size', fontSize.value);
            document.documentElement.style.fontSize = fontSize.value + 'px';
            savePrefs();
        }

        function changeLanguage(e) {
            setLocale(e.target.value);
            emit('preferences-changed', { language: e.target.value });
            savePrefs();
        }

        function toggleSidebar() {
            sidebarCollapsed.value = !sidebarCollapsed.value;
            localStorage.setItem('mgemini-sidebar-collapsed', sidebarCollapsed.value);
            emit('preferences-changed', { sidebarCollapsed: sidebarCollapsed.value });
            savePrefs();
        }

        async function savePrefs() {
            try {
                await window.api.put('/users/preferences', {
                    theme: currentTheme.value,
                    fontSize: fontSize.value,
                    language: locale.value,
                    sidebarCollapsed: sidebarCollapsed.value
                });
            } catch (err) { /* saved locally already */ }
        }

        async function loadUsers() {
            usersLoading.value = true;
            try {
                const res = await window.api.get('/users');
                users.value = res.data || [];
            } catch (err) {
                emit('show-message', 'Failed to load users', 'error');
            } finally { usersLoading.value = false; }
        }

        function startEdit(u) { editingUserId.value = u._id; editUserData.role = u.role; editUserData.accountStatus = u.accountStatus; }
        function cancelEdit() { editingUserId.value = null; }

        async function saveEdit(u) {
            try {
                await window.api.put('/users/' + u._id, { role: editUserData.role, accountStatus: editUserData.accountStatus });
                editingUserId.value = null;
                await loadUsers();
                emit('show-message', 'User updated', 'success');
            } catch (err) { emit('show-message', 'Failed to update user', 'error'); }
        }

        async function deleteUser(u) {
            if (!confirm('Are you sure you want to delete this user?')) return;
            try {
                await window.api.delete('/users/' + u._id);
                await loadUsers();
                emit('show-message', 'User deleted', 'success');
            } catch (err) { emit('show-message', 'Failed to delete user', 'error'); }
        }

        async function loadDbStats() {
            dbStatsLoading.value = true;
            try {
                const res = await window.api.get('/users/database-stats');
                const d = res.data;
                dbStats.value = Object.entries(d).map(([name, count]) => ({ name, count }));
            } catch (err) {
                emit('show-message', 'Failed to load database stats', 'error');
            } finally { dbStatsLoading.value = false; }
        }

        watch(activeSection, (s) => {
            if (s === 'userManagement' && users.value.length === 0) loadUsers();
            if (s === 'database' && dbStats.value.length === 0) loadDbStats();
        });

        onMounted(() => { loadProfile(); });

        return {
            t, locale, activeSection,
            profile, profileLoading, profileSaving, bioRemaining, initials,
            themes, currentTheme, fontSize, sidebarCollapsed,
            users, usersLoading, editingUserId, editUserData,
            dbStats, dbStatsLoading,
            isAdmin,
            saveProfile, selectTheme, updateFontSize, changeLanguage, toggleSidebar,
            loadUsers, startEdit, cancelEdit, saveEdit, deleteUser,
            loadDbStats
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

            <!-- PROFILE -->
            <div v-if="activeSection === 'profile'">
                <div class="settings-section-title">{{ t('settings.profile') }}</div>

                <div class="settings-card">
                    <div class="settings-avatar">
                        <img v-if="profile.avatar" :src="profile.avatar" />
                        <span v-else>{{ initials }}</span>
                    </div>

                    <div class="settings-form-group">
                        <label>{{ t('settings.fullName') }}</label>
                        <input type="text" v-model="profile.fullName" :placeholder="t('settings.fullName')" />
                    </div>

                    <div class="settings-form-group">
                        <label>{{ t('settings.username') }}</label>
                        <input type="text" :value="profile.username" disabled />
                    </div>

                    <div class="settings-form-group">
                        <label>{{ t('settings.email') }}</label>
                        <input type="email" v-model="profile.email" />
                    </div>

                    <div class="settings-form-group">
                        <label>{{ t('settings.gender') }}</label>
                        <select v-model="profile.gender">
                            <option value="confidential">{{ t('settings.genderConfidential') }}</option>
                            <option value="male">{{ t('settings.genderMale') }}</option>
                            <option value="female">{{ t('settings.genderFemale') }}</option>
                        </select>
                    </div>

                    <div class="settings-form-group">
                        <label>{{ t('settings.bio') }}</label>
                        <textarea v-model="profile.bio" maxlength="200" :placeholder="t('settings.bioPlaceholder')"></textarea>
                        <div class="settings-bio-counter">{{ bioRemaining }} {{ t('settings.charsRemaining') || 'characters remaining' }}</div>
                    </div>

                    <button class="settings-btn settings-btn-primary" @click="saveProfile" :disabled="profileSaving">
                        {{ profileSaving ? (t('common.loading') || 'Saving...') : t('settings.saveProfile') }}
                    </button>
                </div>
            </div>

            <!-- APPEARANCE -->
            <div v-if="activeSection === 'appearance'">
                <div class="settings-section-title">{{ t('settings.appearance') }}</div>

                <div class="settings-card">
                    <div class="settings-card-title">{{ t('settings.theme') }}</div>
                    <div class="themes-grid">
                        <div v-for="theme in themes" :key="theme.id"
                            class="theme-card" :class="{ active: currentTheme === theme.id }"
                            @click="selectTheme(theme.id)">
                            <div class="theme-colors">
                                <div class="theme-color-dot" :style="{ background: theme.sidebar }"></div>
                                <div class="theme-color-dot" :style="{ background: theme.primary }"></div>
                                <div class="theme-color-dot" :style="{ background: theme.accent }"></div>
                            </div>
                            <div class="theme-name">{{ theme.name }}</div>
                        </div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-card-title">{{ t('settings.fontSize') }}</div>
                    <div class="font-size-row">
                        <span>A</span>
                        <input type="range" min="12" max="20" :value="fontSize" @input="updateFontSize" />
                        <span style="font-size: 18px;">A</span>
                        <span class="font-size-preview" :style="{ fontSize: fontSize + 'px' }">{{ fontSize }}px</span>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-card-title">{{ t('settings.language') }}</div>
                    <div class="settings-form-group">
                        <select :value="locale" @change="changeLanguage">
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-toggle-row">
                        <div>
                            <div class="settings-toggle-label">{{ t('settings.sidebarCollapsed') }}</div>
                            <div class="settings-toggle-desc">{{ t('settings.sidebarCollapsedDesc') || 'Minimize the sidebar to icons only' }}</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" :checked="sidebarCollapsed" @change="toggleSidebar" />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- USER MANAGEMENT (Admin) -->
            <div v-if="activeSection === 'userManagement' && isAdmin">
                <div class="settings-section-title">{{ t('settings.userManagement') }}</div>

                <div class="settings-card">
                    <div v-if="usersLoading" style="text-align: center; padding: 24px; color: var(--text-secondary);">{{ t('common.loading') || 'Loading...' }}</div>
                    <table v-else class="settings-table">
                        <thead>
                            <tr>
                                <th>{{ t('settings.fullName') }}</th>
                                <th>{{ t('settings.username') }}</th>
                                <th>{{ t('settings.email') }}</th>
                                <th>{{ t('settings.role') }}</th>
                                <th>{{ t('settings.status') }}</th>
                                <th>{{ t('settings.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u._id">
                                <td>{{ u.fullName || '-' }}</td>
                                <td>{{ u.username }}</td>
                                <td>{{ u.email }}</td>
                                <td>
                                    <select v-if="editingUserId === u._id" v-model="editUserData.role" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border);">
                                        <option value="admin">admin</option>
                                        <option value="researcher">researcher</option>
                                        <option value="conservator">conservator</option>
                                        <option value="viewer">viewer</option>
                                    </select>
                                    <span v-else class="role-badge">{{ u.role }}</span>
                                </td>
                                <td>
                                    <select v-if="editingUserId === u._id" v-model="editUserData.accountStatus" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border);">
                                        <option value="active">active</option>
                                        <option value="suspended">suspended</option>
                                        <option value="deactivated">deactivated</option>
                                    </select>
                                    <span v-else class="status-badge" :class="u.accountStatus">{{ u.accountStatus }}</span>
                                </td>
                                <td>
                                    <template v-if="editingUserId === u._id">
                                        <button class="settings-btn settings-btn-primary" style="padding: 4px 12px; font-size: 12px; margin-right: 4px;" @click="saveEdit(u)">Save</button>
                                        <button class="settings-btn settings-btn-outline" style="padding: 4px 12px; font-size: 12px;" @click="cancelEdit">Cancel</button>
                                    </template>
                                    <template v-else>
                                        <button class="settings-btn settings-btn-outline" style="padding: 4px 12px; font-size: 12px; margin-right: 4px;" @click="startEdit(u)">Edit</button>
                                        <button class="settings-btn settings-btn-danger" style="padding: 4px 12px; font-size: 12px;" @click="deleteUser(u)">Delete</button>
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- DATABASE (Admin) -->
            <div v-if="activeSection === 'database' && isAdmin">
                <div class="settings-section-title">
                    {{ t('settings.database') }}
                    <button class="settings-btn settings-btn-outline" style="margin-left: 12px; padding: 4px 14px; font-size: 13px;" @click="loadDbStats">{{ t('settings.refreshStats') }}</button>
                </div>

                <div v-if="dbStatsLoading" style="text-align: center; padding: 24px; color: var(--text-secondary);">{{ t('common.loading') || 'Loading...' }}</div>
                <div v-else class="db-stats-grid">
                    <div v-for="stat in dbStats" :key="stat.name" class="db-stat-card">
                        <div class="db-stat-count">{{ stat.count }}</div>
                        <div class="db-stat-name">{{ stat.name }}</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `
};
