/**
 * LoginPage — hero + form. Handles POST /users/login, stores the token
 * + user blob in localStorage, and emits `login-success`. Also exposes
 * a "guest" shortcut that stores a read-only guest user and emits
 * login-success with token = null.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'LoginPage',
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
            <!-- Hero: brand mark + tagline + feature cards over a warm gradient. -->
            <div class="login-hero">
                <div class="login-hero-top">
                    <div class="login-hero-brand">
                        <span class="login-hero-brand-dot"></span>
                        <span>M-Gemini · Mogao Digital Twin</span>
                    </div>
                </div>

                <div class="login-hero-content">
                    <h1>{{ t('loginPage.heroTitle') }}<br/><strong>{{ t('loginPage.heroTitleStrong') || 'in living detail.' }}</strong></h1>
                    <p class="login-hero-subtitle">{{ t('loginPage.heroSubtitle') }}</p>
                    <div class="login-hero-features">
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🏛️</div>
                            <span class="login-hero-feature-text">{{ t('loginPage.feature3D') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">📊</div>
                            <span class="login-hero-feature-text">{{ t('loginPage.featureMonitoring') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🔬</div>
                            <span class="login-hero-feature-text">{{ t('loginPage.featureSimulation') }}</span>
                        </div>
                        <div class="login-hero-feature">
                            <div class="login-hero-feature-icon">🤝</div>
                            <span class="login-hero-feature-text">{{ t('loginPage.featureCollaboration') }}</span>
                        </div>
                    </div>
                </div>

                <div class="login-hero-footer">
                    Mogao Digital Twin · {{ new Date().getFullYear() }}
                </div>
            </div>

            <!-- Form: focused, no duplicate branding on desktop. -->
            <div class="login-form-panel">
                <div class="login-form-container">
                    <!-- Mobile-only brand mark (shown when hero is hidden). -->
                    <div class="login-form-mobile-brand">
                        <span class="login-form-mobile-brand-dot"></span>
                        <span>M-Gemini</span>
                    </div>

                    <div class="login-form-header">
                        <div class="login-form-header-eyebrow">{{ t('loginPage.formEyebrow') || 'Sign in' }}</div>
                        <h2>{{ t('loginPage.formTitle') }}</h2>
                        <p>{{ t('loginPage.formSubtitle') }}</p>
                    </div>

                    <div v-if="error" class="login-error">{{ error }}</div>

                    <form @submit.prevent="handleSubmit" novalidate>
                        <div class="login-field">
                            <label>{{ t('loginPage.usernameLabel') }}</label>
                            <input v-model="username" type="text" :placeholder="t('loginPage.usernamePlaceholder')" autocomplete="username" required />
                        </div>

                        <div class="login-field">
                            <label>{{ t('loginPage.passwordLabel') }}</label>
                            <input v-model="password" type="password" :placeholder="t('loginPage.passwordPlaceholder')" autocomplete="current-password" required />
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
