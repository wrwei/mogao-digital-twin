/**
 * AppearanceSection — theme / font size / language / sidebar collapse.
 * Initial state from localStorage; server-side preferences (when received
 * from SettingsView via the serverPreferences prop) override on arrival.
 * Each interaction writes through to /users/preferences.
 */
import { useI18n } from '../i18n.js';

const { ref, watch } = Vue;

// Curated theme list. Each entry mirrors the matching [data-theme] block in
// main.css; the three preview dots show sidebar / primary / accent so users
// recognise the palette before applying it. Dropped 'ember' — too close to
// the default Mogao Sand and added little visual distinction.
const THEMES = [
    { id: 'mogao',    name: 'Mogao Sand',     sidebar: '#2c1810', primary: '#b25a24', accent: '#d4a574' },
    { id: 'ocean',    name: 'Ocean Blue',     sidebar: '#0f2a44', primary: '#2570a8', accent: '#5b9bd5' },
    { id: 'forest',   name: 'Forest Green',   sidebar: '#1f3a2e', primary: '#3a7d5c', accent: '#6db58a' },
    { id: 'slate',    name: 'Modern Slate',   sidebar: '#1f2733', primary: '#4a5568', accent: '#a0aec0' },
    { id: 'plum',     name: 'Royal Plum',     sidebar: '#2d1f3d', primary: '#6a4c93', accent: '#b39ddb' },
    { id: 'sakura',   name: 'Sakura Blossom', sidebar: '#3a2030', primary: '#8b4f6e', accent: '#e8a0bf' },
    { id: 'midnight', name: 'Midnight Dark',  sidebar: '#0a0c12', primary: '#7c83db', accent: '#b8baf5' }
];

export default {
    name: 'AppearanceSection',
    props: {
        serverPreferences: { type: Object, default: null }
    },
    emits: ['preferences-changed'],
    setup(props, { emit }) {
        const { t, locale, setLocale } = useI18n();

        const currentTheme = ref(localStorage.getItem('mgemini-theme') || 'mogao');
        const fontSize = ref(parseInt(localStorage.getItem('mgemini-font-size') || '14'));
        const sidebarCollapsed = ref(localStorage.getItem('mgemini-sidebar-collapsed') === 'true');

        watch(() => props.serverPreferences, (prefs) => {
            if (!prefs) return;
            if (prefs.theme) currentTheme.value = prefs.theme;
            if (prefs.fontSize) fontSize.value = prefs.fontSize;
            sidebarCollapsed.value = prefs.sidebarCollapsed || false;
        });

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

        return {
            t, locale,
            themes: THEMES,
            currentTheme, fontSize, sidebarCollapsed,
            selectTheme, updateFontSize, changeLanguage, toggleSidebar
        };
    },
    template: `
    <div>
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
    `
};
