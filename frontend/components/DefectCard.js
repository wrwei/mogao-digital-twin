/**
 * Defect Card Component
 * Auto-generated from mogao_dt.ecore
 * Displays 缺陷 information in card format
 */
export default {
    name: 'DefectCard',
    props: {
        defect: {
            type: Object,
            required: true
        }
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card defect-card" @click="$emit('select', defect)">
            <div class="card-header">
                <h3 class="card-title">{{ defect.name || '缺陷' }}</h3>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <span class="field-label">描述:</span>
                    <span class="field-value">{{ defect.description || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">reference:</span>
                    <span class="field-value">{{ defect.reference || 'N/A' }}</span>
                </div>
                <div class="card-field">
                    <span class="field-label">缺陷类型:</span>
                    <span class="field-value">{{ defect.defectType || 'N/A' }}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', defect)" title="编辑">
                    ✏️ 编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', defect)" title="删除">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `,
    computed: {
        displayName() {
            return this.defect.name || this.defect.gid || '缺陷';
        },
        detectionDateDisplay() {
            const value = this.defect.detectionDate;
            if (!value) return 'N/A';
            return value;
        }    }
};
