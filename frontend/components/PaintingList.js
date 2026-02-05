/**
 * Painting List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 绘画 with search and filter
 */
import PaintingCard from './PaintingCard.js';

export default {
    name: 'PaintingList',
    components: {
        PaintingCard
    },
    props: {
        paintings: {
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
        filteredPaintings() {
            let results = [...this.paintings];

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
            return this.paintings.length === 0;
        }
    },
    template: `
        <div class="painting-list">
            <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h2 style="margin: 0;">绘画列表</h2>
                    <button class="btn btn-primary" @click="$emit('create')">
                        ➕ 添加绘画
                    </button>
                </div>

                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input
                        type="text"
                        v-model="searchQuery"
                        class="search-input"
                        placeholder="搜索绘画..."
                    />
                </div>
            </div>

            <div class="list-body" style="padding: var(--spacing-md);">
                <loading-spinner v-if="loading"></loading-spinner>

                <div v-else-if="isEmpty" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无绘画数据</div>
                    <button class="btn btn-primary" @click="$emit('create')">
                        创建第一个绘画
                    </button>
                </div>

                <div v-else-if="filteredPaintings.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">未找到匹配的绘画</div>
                </div>

                <div v-else class="list-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <painting-card
                        v-for="item in filteredPaintings"
                        :key="item.gid"
                        :painting="item"
                        @select="$emit('select', item)"
                        @edit="$emit('edit', item)"
                        @delete="$emit('delete', item)"
                    ></painting-card>                </div>
            </div>

            <div class="list-footer" style="padding: var(--spacing-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);">
                共 {{ filteredPaintings.length }} 个绘画
                <span v-if="searchQuery">（从 {{ paintings.length }} 个中筛选）</span>
            </div>
        </div>
    `
};
