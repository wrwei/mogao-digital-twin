/**
 * DashboardView — landing page after login. Five entity-count cards
 * plus quick-action buttons. Emits `navigate` with the target view name.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'DashboardView',
    props: ['caveCount', 'statueCount', 'muralCount', 'paintingCount', 'inscriptionCount'],
    emits: ['navigate'],
    setup() {
        const { t, locale } = useI18n();
        const today = new Date();
        const dateStr = today.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        return { t, locale, dateStr };
    },
    template: `
        <div class="dashboard-view">
            <div class="welcome-banner">
                <div>
                    <h2>{{ t('dashboard.welcome') }}</h2>
                    <p>{{ t('dashboard.subtitle') }}</p>
                </div>
                <div class="welcome-banner-date">{{ dateStr }}</div>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card caves" @click="$emit('navigate', 'caves')">
                    <div class="stat-card-icon">🏛️</div>
                    <div class="stat-card-info">
                        <h3>{{ caveCount }}</h3>
                        <p>{{ t('entities.caves') }}</p>
                    </div>
                </div>
                <div class="stat-card statues" @click="$emit('navigate', 'statues')">
                    <div class="stat-card-icon">🗿</div>
                    <div class="stat-card-info">
                        <h3>{{ statueCount }}</h3>
                        <p>{{ t('entities.statues') }}</p>
                    </div>
                </div>
                <div class="stat-card murals" @click="$emit('navigate', 'murals')">
                    <div class="stat-card-icon">🎨</div>
                    <div class="stat-card-info">
                        <h3>{{ muralCount }}</h3>
                        <p>{{ t('entities.murals') }}</p>
                    </div>
                </div>
                <div class="stat-card paintings" @click="$emit('navigate', 'paintings')">
                    <div class="stat-card-icon">🖼️</div>
                    <div class="stat-card-info">
                        <h3>{{ paintingCount }}</h3>
                        <p>{{ t('entities.paintings') }}</p>
                    </div>
                </div>
                <div class="stat-card inscriptions" @click="$emit('navigate', 'inscriptions')">
                    <div class="stat-card-icon">✍️</div>
                    <div class="stat-card-info">
                        <h3>{{ inscriptionCount }}</h3>
                        <p>{{ t('entities.inscriptions') }}</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-section">
                <div class="dashboard-section-title">⚡ {{ t('dashboard.quickActions') }}</div>
                <div class="quick-actions">
                    <button class="quick-action-btn" @click="$emit('navigate', 'caves')">🏛️ {{ t('dashboard.viewCaves') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'statues')">🗿 {{ t('dashboard.viewStatues') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'murals')">🎨 {{ t('dashboard.viewMurals') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'paintings')">🖼️ {{ t('dashboard.viewPaintings') }}</button>
                    <button class="quick-action-btn" @click="$emit('navigate', 'inscriptions')">✍️ {{ t('dashboard.viewInscriptions') }}</button>
                </div>
            </div>
        </div>
    `
};
