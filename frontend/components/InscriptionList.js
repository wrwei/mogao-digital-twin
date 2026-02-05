/**
 * Inscription List Component
 * Auto-generated from mogao_dt.ecore
 * Displays list of 铭文 with search and filter
 */
import InscriptionCard from './InscriptionCard.js';

export default {
    name: 'InscriptionList',
    components: {
        InscriptionCard
    },
    props: {
        inscriptions: {
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
        filteredInscriptions() {
            let results = [...this.inscriptions];

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
            return this.inscriptions.length === 0;
        }
    },
    template: `
        <div class="inscription-list">
            <div class="list-header" style="padding: var(--spacing-md); border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h2 style="margin: 0;">铭文列表</h2>
                    <button class="btn btn-primary" @click="$emit('create')">
                        ➕ 添加铭文
                    </button>
                </div>

                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input
                        type="text"
                        v-model="searchQuery"
                        class="search-input"
                        placeholder="搜索铭文..."
                    />
                </div>
            </div>

            <div class="list-body" style="padding: var(--spacing-md);">
                <loading-spinner v-if="loading"></loading-spinner>

                <div v-else-if="isEmpty" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无铭文数据</div>
                    <button class="btn btn-primary" @click="$emit('create')">
                        创建第一个铭文
                    </button>
                </div>

                <div v-else-if="filteredInscriptions.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">未找到匹配的铭文</div>
                </div>

                <div v-else class="list-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <inscription-card
                        v-for="item in filteredInscriptions"
                        :key="item.gid"
                        :inscription="item"
                        @select="$emit('select', item)"
                        @edit="$emit('edit', item)"
                        @delete="$emit('delete', item)"
                    ></inscription-card>                </div>
            </div>

            <div class="list-footer" style="padding: var(--spacing-md); border-top: 1px solid var(--border); text-align: center; color: var(--text-secondary);">
                共 {{ filteredInscriptions.length }} 个铭文
                <span v-if="searchQuery">（从 {{ inscriptions.length }} 个中筛选）</span>
            </div>
        </div>
    `
};
