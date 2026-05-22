/**
 * AppTopbar — application chrome along the top of the page. Holds the
 * theme picker, locale selector, current user display, and the logout
 * button. Theme picker manages its own open/close + click-outside +
 * keyboard handling.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'AppTopbar',
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
                { id: 'mogao',    name: 'Mogao Sand',     sidebar: '#2c1810', primary: '#b25a24', accent: '#d4a574', icon: '🏛️' },
                { id: 'ocean',    name: 'Ocean Blue',     sidebar: '#0f2a44', primary: '#2570a8', accent: '#5b9bd5', icon: '🌊' },
                { id: 'forest',   name: 'Forest Green',   sidebar: '#1f3a2e', primary: '#3a7d5c', accent: '#6db58a', icon: '🌿' },
                { id: 'slate',    name: 'Modern Slate',   sidebar: '#1f2733', primary: '#4a5568', accent: '#a0aec0', icon: '🖥️' },
                { id: 'plum',     name: 'Royal Plum',     sidebar: '#2d1f3d', primary: '#6a4c93', accent: '#b39ddb', icon: '👑' },
                { id: 'sakura',   name: 'Sakura Blossom', sidebar: '#3a2030', primary: '#8b4f6e', accent: '#e8a0bf', icon: '🌸' },
                { id: 'midnight', name: 'Midnight Dark',  sidebar: '#0a0c12', primary: '#7c83db', accent: '#b8baf5', icon: '🌙' }
            ]
        };
    },
    methods: {
        selectTheme(themeId) {
            this.$emit('change-theme', themeId);
            this.showThemePicker = false;
            this.$nextTick(() => { if (this.$refs.themeBtn) this.$refs.themeBtn.focus(); });
        },
        toggleThemePicker() {
            this.showThemePicker = !this.showThemePicker;
        },
        closeThemePicker() {
            this.showThemePicker = false;
        },
        handleThemePickerKey(ev) {
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
                        :aria-label="t('actions.logout')"
                        :title="t('actions.logout')"
                        style="margin-left: 4px;">
                    ⏻
                </button>
            </div>
        </div>
    `
};
