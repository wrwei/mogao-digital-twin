/**
 * Painting Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 绘画 information in card format
 */
export default {
    name: 'PaintingCard',
    props: {
        painting: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card painting-card" @click="$emit('select', painting)">
            <div class="card-header">
                <h3 class="card-title">{{ painting.name || '绘画' }}</h3>
                <span class="badge" :class="'badge-' + (painting.conservationStatus || 'unknown').toLowerCase()">
                    {{ painting.conservationStatus || '未知' }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ painting.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ painting.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ painting.label || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', painting)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', painting)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.painting.name || this.painting.gid || '绘画';
        },
        lastInspectionDateDisplay() {
            const value = this.painting.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
