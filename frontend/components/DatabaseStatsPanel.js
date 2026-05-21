/**
 * DatabaseStatsPanel — admin: per-collection document counts.
 */
import { useI18n } from '../i18n.js';

const { ref, onMounted } = Vue;

export default {
    name: 'DatabaseStatsPanel',
    emits: ['show-message'],
    setup(_, { emit }) {
        const { t } = useI18n();
        const dbStats = ref([]);
        const dbStatsLoading = ref(false);

        async function loadDbStats() {
            dbStatsLoading.value = true;
            try {
                const res = await window.api.get('/users/database-stats');
                const d = res.data;
                dbStats.value = Object.entries(d).map(([name, count]) => ({ name, count }));
            } catch (err) {
                emit('show-message', 'Failed to load database stats', 'error');
            } finally {
                dbStatsLoading.value = false;
            }
        }

        onMounted(() => { loadDbStats(); });

        return { t, dbStats, dbStatsLoading, loadDbStats };
    },
    template: `
    <div>
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
    `
};
