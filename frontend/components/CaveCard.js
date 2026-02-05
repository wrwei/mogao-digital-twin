/**
 * Cave Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 洞窟 information in card format
 */
export default {
    name: 'CaveCard',
    props: {
        cave: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card cave-card" @click="$emit('select', cave)">
            <div class="card-header">
                <h3 class="card-title">{{ cave.name || '洞窟' }}</h3>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ cave.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ cave.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ cave.label || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', cave)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', cave)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.cave.name || this.cave.gid || '洞窟';
        },
        lastInspectionDateDisplay() {
            const value = this.cave.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
