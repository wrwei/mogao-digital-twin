/**
 * Defect Form Component
 * Auto-generated from mogao_dt.ecore
 * Create/Edit form for 缺陷
 */
export default {
    name: 'DefectForm',
    props: {
        defect: {
            type: Object,
            default: null
        },
        mode: {
            type: String,
            default: 'create', // 'create' or 'edit'
            validator: (value) => ['create', 'edit'].includes(value)
        }
    },
    emits: ['created', 'updated', 'cancel', 'error'],
    data() {
        return {
            form: {
                name: this.defect?.name || '',
                description: this.defect?.description || '',
                reference: this.defect?.reference || '',
                defectType: this.defect?.defectType || '',
                severity: this.defect?.severity || '',
                detectionDate: this.defect?.detectionDate || null,
                affectedArea: this.defect?.affectedArea || null,
                treatmentHistory: this.defect?.treatmentHistory || '',
                requiresImmediateAction: this.defect?.requiresImmediateAction || null
            },
            errors: {},
            loading: false,
            touched: {}
        };
    },
    watch: {
        defect: {
            handler(newVal) {
                if (newVal && this.mode === 'edit') {
                    this.loadFormData(newVal);
                }
            },
            immediate: true
        }
    },
    methods: {
        loadFormData(data) {
            this.form.name = data.name || '';
            this.form.description = data.description || '';
            this.form.reference = data.reference || '';
            this.form.defectType = data.defectType || '';
            this.form.severity = data.severity || '';
            this.form.detectionDate = data.detectionDate || null;
            this.form.affectedArea = data.affectedArea || null;
            this.form.treatmentHistory = data.treatmentHistory || '';
            this.form.requiresImmediateAction = data.requiresImmediateAction || null;
        },

        async handleSubmit() {
            // Mark all fields as touched
            this.touched.name = true;
            this.touched.description = true;
            this.touched.reference = true;
            this.touched.defectType = true;
            this.touched.severity = true;
            this.touched.detectionDate = true;
            this.touched.affectedArea = true;
            this.touched.treatmentHistory = true;
            this.touched.requiresImmediateAction = true;

            if (!this.validate()) {
                this.$emit('error', '请填写所有必填字段');
                return;
            }

            this.loading = true;
            try {
                if (this.mode === 'create') {
                    const response = await api.defects.create(this.form);
                    this.$emit('created', response.data);
                } else {
                    const gid = this.defect.gid;
                    await api.defects.update(gid, this.form);
                    this.$emit('updated', { ...this.defect, ...this.form });
                }
                this.resetForm();
            } catch (error) {
                console.error('Form submission error:', error);
                this.$emit('error', error.response?.data?.message || error.message || '保存失败');
            } finally {
                this.loading = false;
            }
        },

        validate() {
            this.errors = {};
            let isValid = true;

            // Validate name

            // Validate description

            // Validate reference

            // Validate defectType

            // Validate severity

            // Validate detectionDate

            // Validate affectedArea

            // Validate treatmentHistory

            // Validate requiresImmediateAction

            return isValid;
        },


        resetForm() {
            this.form.name = '';
            this.form.description = '';
            this.form.reference = '';
            this.form.defectType = '';
            this.form.severity = '';
            this.form.detectionDate = null;
            this.form.affectedArea = null;
            this.form.treatmentHistory = '';
            this.form.requiresImmediateAction = null;
            this.errors = {};
            this.touched = {};
        },

        handleCancel() {
            this.resetForm();
            this.$emit('cancel');
        },

        markTouched(field) {
            this.touched[field] = true;
        }
    },
    template: `
        <form @submit.prevent="handleSubmit" class="form defect-form">
            <h2>{{ mode === 'create' ? '创建' : '编辑' }}缺陷</h2>

            <div class="form-group">
                <label class="form-label" for="name">
                    名称
                </label>

                <input
                    type="text"
                    id="name"
                    v-model="form.name"
                    @blur="markTouched('name')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.name && touched.name }"
                    placeholder="请输入名称"
                />

                <span v-if="errors.name && touched.name" class="form-error">
                    {{ errors.name }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="description">
                    描述
                </label>

                <textarea
                    id="description"
                    v-model="form.description"
                    @blur="markTouched('description')"
                    class="form-textarea"
                    :class="{ 'form-textarea-error': errors.description && touched.description }"
                    placeholder="请输入描述"
                    rows="4"
                ></textarea>


                <span v-if="errors.description && touched.description" class="form-error">
                    {{ errors.description }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="reference">
                    reference
                </label>

                <input
                    type="text"
                    id="reference"
                    v-model="form.reference"
                    @blur="markTouched('reference')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.reference && touched.reference }"
                    placeholder="请输入reference"
                />

                <span v-if="errors.reference && touched.reference" class="form-error">
                    {{ errors.reference }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="defectType">
                    缺陷类型
                </label>

                <select
                    id="defectType"
                    v-model="form.defectType"
                    @blur="markTouched('defectType')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.defectType && touched.defectType }"
                >
                    <option value="">请选择</option>
                    <option value="cracking">cracking</option>
                    <option value="flaking">flaking</option>
                    <option value="blistering">blistering</option>
                    <option value="detachment">detachment</option>
                    <option value="materialLoss">materialLoss</option>
                    <option value="disruption">disruption</option>
                    <option value="alveolization">alveolization</option>
                    <option value="saltEfflorescence">saltEfflorescence</option>
                    <option value="colorAlteration">colorAlteration</option>
                    <option value="acidAttack">acidAttack</option>
                    <option value="paintLoss">paintLoss</option>
                    <option value="microbialGrowth">microbialGrowth</option>
                    <option value="blackSpots">blackSpots</option>
                    <option value="lichenGrowth">lichenGrowth</option>
                    <option value="insectDamage">insectDamage</option>
                    <option value="waterSeepage">waterSeepage</option>
                    <option value="sootDeposition">sootDeposition</option>
                    <option value="erosion">erosion</option>
                    <option value="structuralCollapse">structuralCollapse</option>
                    <option value="graffiti">graffiti</option>
                </select>


                <span v-if="errors.defectType && touched.defectType" class="form-error">
                    {{ errors.defectType }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="severity">
                    严重程度
                </label>

                <select
                    id="severity"
                    v-model="form.severity"
                    @blur="markTouched('severity')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.severity && touched.severity }"
                >
                    <option value="">请选择</option>
                    <option value="minor">minor</option>
                    <option value="moderate">moderate</option>
                    <option value="severe">severe</option>
                    <option value="critical">critical</option>
                </select>


                <span v-if="errors.severity && touched.severity" class="form-error">
                    {{ errors.severity }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="detectionDate">
                    detectionDate
                </label>

                <input
                    type="text"
                    id="detectionDate"
                    v-model="form.detectionDate"
                    @blur="markTouched('detectionDate')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.detectionDate && touched.detectionDate }"
                    placeholder="请输入detectionDate"
                />

                <span v-if="errors.detectionDate && touched.detectionDate" class="form-error">
                    {{ errors.detectionDate }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="affectedArea">
                    affectedArea
                </label>

                <input
                    type="text"
                    id="affectedArea"
                    v-model="form.affectedArea"
                    @blur="markTouched('affectedArea')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.affectedArea && touched.affectedArea }"
                    placeholder="请输入affectedArea"
                />

                <span v-if="errors.affectedArea && touched.affectedArea" class="form-error">
                    {{ errors.affectedArea }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="treatmentHistory">
                    treatmentHistory
                </label>

                <input
                    type="text"
                    id="treatmentHistory"
                    v-model="form.treatmentHistory"
                    @blur="markTouched('treatmentHistory')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.treatmentHistory && touched.treatmentHistory }"
                    placeholder="请输入treatmentHistory"
                />

                <span v-if="errors.treatmentHistory && touched.treatmentHistory" class="form-error">
                    {{ errors.treatmentHistory }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="requiresImmediateAction">
                    requiresImmediateAction
                </label>

                <input
                    type="text"
                    id="requiresImmediateAction"
                    v-model="form.requiresImmediateAction"
                    @blur="markTouched('requiresImmediateAction')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.requiresImmediateAction && touched.requiresImmediateAction }"
                    placeholder="请输入requiresImmediateAction"
                />

                <span v-if="errors.requiresImmediateAction && touched.requiresImmediateAction" class="form-error">
                    {{ errors.requiresImmediateAction }}
                </span>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" @click="handleCancel" :disabled="loading">
                    取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <span v-if="loading">保存中...</span>
                    <span v-else>{{ mode === 'create' ? '创建' : '更新' }}</span>
                </button>
            </div>
        </form>
    `
};
