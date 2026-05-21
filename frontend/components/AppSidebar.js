/**
 * AppSidebar — left navigation rail. Highlights the current view, gates
 * admin-only items (Sensors, Maintenance) behind the isAdmin prop, and
 * surfaces the anomaly count as a badge.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'AppSidebar',
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
