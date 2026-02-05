/**
 * Mural Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 壁画 information in card format
 */
export default {
    name: 'MuralCard',
    props: {
        mural: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card mural-card" @click="$emit('select', mural)">
            <div class="card-header">
                <h3 class="card-title">{{ mural.name || '壁画' }}</h3>
                <span class="badge" :class="'badge-' + (mural.conservationStatus || 'unknown').toLowerCase()">
                    {{ mural.conservationStatus || '未知' }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ mural.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ mural.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ mural.label || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', mural)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', mural)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.mural.name || this.mural.gid || '壁画';
        },
        lastInspectionDateDisplay() {
            const value = this.mural.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
