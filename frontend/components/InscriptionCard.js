/**
 * Inscription Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 铭文 information in card format
 */
export default {
    name: 'InscriptionCard',
    props: {
        inscription: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card inscription-card" @click="$emit('select', inscription)">
            <div class="card-header">
                <h3 class="card-title">{{ inscription.name || '铭文' }}</h3>
                <span class="badge" :class="'badge-' + (inscription.conservationStatus || 'unknown').toLowerCase()">
                    {{ inscription.conservationStatus || '未知' }}
                </span>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ inscription.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ inscription.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">label:</span>
                    <span class="field-value">{{ inscription.label || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', inscription)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', inscription)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.inscription.name || this.inscription.gid || '铭文';
        },
        lastInspectionDateDisplay() {
            const value = this.inscription.lastInspectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
