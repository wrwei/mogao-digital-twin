/**
 * Statue List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 雕像 with search and filter
 */
import StatueCard from './StatueCard.js';

export default {
    name: 'StatueList',
    components: {
        StatueCard
    },
    props: {
        statues: {
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
        filteredStatues() {
            let results = [...this.statues];

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
            return this.statues.length === 0;
        }
    },
    template: `
        <div class="statue-list">
            <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h2 style="margin: 0;">雕像列表</h2>
                    <button class="btn btn-primary" @click="$emit('create')">
                        ➕ 添加雕像
                    </button>
                </div>

                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input
                        type="text"
                        v-model="searchQuery"
                        class="search-input"
                        placeholder="搜索雕像..."
                    />
                </div>
            </div>

            <div class="list-body" style="padding: var(--spacing-md);">
                <loading-spinner v-if="loading"></loading-spinner>

                <div v-else-if="isEmpty" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无雕像数据</div>
                    <button class="btn btn-primary" @click="$emit('create')">
                        创建第一个雕像
                    </button>
                </div>

                <div v-else-if="filteredStatues.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">未找到匹配的雕像</div>
                </div>

                <div v-else class="list-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <statue-card
                        v-for="item in filteredStatues"
                        :key="item.gid"
                        :statue="item"
                        @select="$emit('select', item)"
                        @edit="$emit('edit', item)"
                        @delete="$emit('delete', item)"
                    ></statue-card>                </div>
            </div>

            <div class="list-footer" style="padding: var(--spacing-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);">
                共 {{ filteredStatues.length }} 个雕像
                <span v-if="searchQuery">（从 {{ statues.length }} 个中筛选）</span>
            </div>
        </div>
    `
};
