/**
 * UserManagementPanel — admin role / account-status edit + delete.
 * Fetches the user list once on mount (re-mounted on each visit; cheap).
 */
import { useI18n } from '../i18n.js';

const { ref, reactive, onMounted } = Vue;

export default {
    name: 'UserManagementPanel',
    emits: ['show-message'],
    setup(_, { emit }) {
        const { t } = useI18n();
        const users = ref([]);
        const usersLoading = ref(false);
        const editingUserId = ref(null);
        const editUserData = reactive({ role: '', accountStatus: '' });

        async function loadUsers() {
            usersLoading.value = true;
            try {
                const res = await window.api.get('/users');
                users.value = res.data || [];
            } catch (err) {
                emit('show-message', 'Failed to load users', 'error');
            } finally {
                usersLoading.value = false;
            }
        }

        function startEdit(u) {
            editingUserId.value = u._id;
            editUserData.role = u.role;
            editUserData.accountStatus = u.accountStatus;
        }
        function cancelEdit() { editingUserId.value = null; }

        async function saveEdit(u) {
            try {
                await window.api.put('/users/' + u._id, {
                    role: editUserData.role,
                    accountStatus: editUserData.accountStatus
                });
                editingUserId.value = null;
                await loadUsers();
                emit('show-message', 'User updated', 'success');
            } catch (err) {
                emit('show-message', 'Failed to update user', 'error');
            }
        }

        async function deleteUser(u) {
            if (!confirm('Are you sure you want to delete this user?')) return;
            try {
                await window.api.delete('/users/' + u._id);
                await loadUsers();
                emit('show-message', 'User deleted', 'success');
            } catch (err) {
                emit('show-message', 'Failed to delete user', 'error');
            }
        }

        onMounted(() => { loadUsers(); });

        return { t, users, usersLoading, editingUserId, editUserData, startEdit, cancelEdit, saveEdit, deleteUser };
    },
    template: `
    <div>
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
    `
};
