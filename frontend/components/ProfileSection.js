/**
 * ProfileSection — name / email / gender / bio / avatar editor.
 * Receives initial data from SettingsView's one-shot /users/profile fetch.
 */
import { useI18n } from '../i18n.js';

const { ref, reactive, computed, watch } = Vue;

export default {
    name: 'ProfileSection',
    props: {
        initialProfile: { type: Object, default: null }
    },
    emits: ['profile-updated', 'show-message'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const profile = reactive({
            fullName: '',
            username: '',
            email: '',
            gender: 'confidential',
            bio: '',
            avatar: ''
        });
        const profileSaving = ref(false);

        watch(() => props.initialProfile, (d) => {
            if (!d) return;
            profile.fullName = d.fullName || '';
            profile.username = d.username || '';
            profile.email = d.email || '';
            profile.gender = d.gender || 'confidential';
            profile.bio = d.bio || '';
            profile.avatar = d.avatar || '';
        }, { immediate: true });

        const bioRemaining = computed(() => 200 - (profile.bio || '').length);
        const initials = computed(() => {
            const name = profile.fullName || profile.username || '?';
            return name.charAt(0).toUpperCase();
        });

        async function saveProfile() {
            profileSaving.value = true;
            try {
                await window.api.put('/users/profile', {
                    fullName: profile.fullName,
                    email: profile.email,
                    gender: profile.gender,
                    bio: profile.bio
                });
                emit('profile-updated', {
                    fullName: profile.fullName,
                    email: profile.email,
                    gender: profile.gender,
                    bio: profile.bio
                });
                emit('show-message', 'Profile saved successfully', 'success');
            } catch (err) {
                emit('show-message', 'Failed to save profile', 'error');
            } finally {
                profileSaving.value = false;
            }
        }

        return { t, profile, profileSaving, bioRemaining, initials, saveProfile };
    },
    template: `
    <div>
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
    `
};
