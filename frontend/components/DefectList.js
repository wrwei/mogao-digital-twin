/**
 * Defect List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 缺陷 with search and filter
 */
import DefectCard from './DefectCard.js';
import { useI18n } from '../i18n.js';

export default {
    name: 'DefectList',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    components: {
        DefectCard
    },
    props: {
        defects: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['select', 'edit', 'delete', 'create'],
    data() {
        return {
            searchQuery: '',
            sortBy: 'name',
            sortDesc: false
        };
    },
    computed: {
        filteredDefects() {
            let results = [...this.defects];

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                results = results.filter(item =>
                    (item.name && item.name.toLowerCase().includes(query)) ||
                    (item.description && item.description.toLowerCase().includes(query)) ||
                    (item.gid && item.gid.toLowerCase().includes(query))
                );
            }

            // Sort
            results.sort((a, b) => {
                const aVal = a[this.sortBy] || '';
                const bVal = b[this.sortBy] || '';
                const comparison = aVal.toString().localeCompare(bVal.toString());
                return this.sortDesc ? -comparison : comparison;
            });

            return results;
        },
        isEmpty() {
            return this.defects.length === 0;
        }
    },
    template: `
        <div class="defect-list">
            <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h2 style="margin: 0;">{{ t('entities.defects') }}</h2>
                    <button class="btn btn-primary" @click="$emit('create')">
                        ➕ {{ t('actions.createNew', { entity: t('entities.defect') }) }}
                    </button>
                </div>

                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input
                        type="text"
                        v-model="searchQuery"
                        class="search-input"
                        :placeholder="t('common.search') + ' ' + t('entities.defect')"
                    />
                </div>
            </div>

            <div class="list-body" style="padding: var(--spacing-md);">
                <div v-if="loading" class="loading-overlay">
                    <div class="spinner"></div>
                    <p style="margin-top: var(--spacing-md); color: var(--text-secondary);">{{ t('common.loading') }}</p>
                </div>

                <div v-else-if="isEmpty" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">{{ t('common.noData') }}</div>
                    <button class="btn btn-primary" @click="$emit('create')">
                        {{ t('actions.createNew', { entity: t('entities.defect') }) }}
                    </button>
                </div>

                <div v-else-if="filteredDefects.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">{{ t('common.noData') }}</div>
                </div>

                <div v-else class="list-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <defect-card
                        v-for="item in filteredDefects"
                        :key="item.gid"
                        :defect="item"
                        @select="$emit('select', item)"
                        @edit="$emit('edit', item)"
                        @delete="$emit('delete', item)"
                    ></defect-card>                </div>
            </div>

            <div class="list-footer" style="padding: var(--spacing-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);">
                {{ filteredDefects.length }} {{ t('entities.defect') }}
                <span v-if="searchQuery">({{ defects.length }} {{ t('common.filter') }})</span>
            </div>
        </div>
    `
};
