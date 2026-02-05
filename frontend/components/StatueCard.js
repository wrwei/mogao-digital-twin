/**
 * Statue Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 雕像 information in card format
 */
export default {
    name: 'StatueCard',
    props: {
        statue: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card statue-card" @click="$emit('select', statue)">
            <div class="card-header">
                <h3 class="card-title">{{ statue.name || '雕像' }}</h3>
                <span class="badge" :class="'badge-' + (statue.conservationStatus || 'unknown').toLowerCase()">
                    {{ statue.conservationStatus || '未知' }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ statue.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ statue.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ statue.label || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', statue)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', statue)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.statue.name || this.statue.gid || '雕像';
        },
        lastInspectionDateDisplay() {
            const value = this.statue.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
