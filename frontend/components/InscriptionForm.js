/**
 * Inscription Form Component
 * Auto-generated from mogao_dt.ecore
 * Create/Edit form for 铭文
 */
export default {
    name: 'InscriptionForm',
    props: {
        inscription: {
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
                name: this.inscription?.name || '',
                description: this.inscription?.description || '',
                reference: this.inscription?.reference || '',
                label: this.inscription?.label || '',
                creationPeriod: this.inscription?.creationPeriod || '',
                lastInspectionDate: this.inscription?.lastInspectionDate || null,
                inspectionNotes: this.inscription?.inspectionNotes || '',
                material: this.inscription?.material || '',
                period: this.inscription?.period || '',
                conservationStatus: this.inscription?.conservationStatus || '',
                language: this.inscription?.language || '',
                content: this.inscription?.content || ''
            },
            errors: {},
            loading: false,
            touched: {}
        };
    },
    watch: {
        inscription: {
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
            this.form.label = data.label || '';
            this.form.creationPeriod = data.creationPeriod || '';
            this.form.lastInspectionDate = data.lastInspectionDate || null;
            this.form.inspectionNotes = data.inspectionNotes || '';
            this.form.material = data.material || '';
            this.form.period = data.period || '';
            this.form.conservationStatus = data.conservationStatus || '';
            this.form.language = data.language || '';
            this.form.content = data.content || '';
        },

        async handleSubmit() {
            // Mark all fields as touched
            this.touched.name = true;
            this.touched.description = true;
            this.touched.reference = true;
            this.touched.label = true;
            this.touched.creationPeriod = true;
            this.touched.lastInspectionDate = true;
            this.touched.inspectionNotes = true;
            this.touched.material = true;
            this.touched.period = true;
            this.touched.conservationStatus = true;
            this.touched.language = true;
            this.touched.content = true;

            if (!this.validate()) {
                this.$emit('error', '请填写所有必填字段');
                return;
            }

            this.loading = true;
            try {
                if (this.mode === 'create') {
                    const response = await api.inscriptions.create(this.form);
                    this.$emit('created', response.data);
                } else {
                    const gid = this.inscription.gid;
                    await api.inscriptions.update(gid, this.form);
                    this.$emit('updated', { ...this.inscription, ...this.form });
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

            // Validate label

            // Validate creationPeriod

            // Validate lastInspectionDate

            // Validate inspectionNotes

            // Validate material

            // Validate period

            // Validate conservationStatus

            // Validate language

            // Validate content

            return isValid;
        },


        resetForm() {
            this.form.name = '';
            this.form.description = '';
            this.form.reference = '';
            this.form.label = '';
            this.form.creationPeriod = '';
            this.form.lastInspectionDate = null;
            this.form.inspectionNotes = '';
            this.form.material = '';
            this.form.period = '';
            this.form.conservationStatus = '';
            this.form.language = '';
            this.form.content = '';
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
        <form @submit.prevent="handleSubmit" class="form inscription-form">
            <h2>{{ mode === 'create' ? '创建' : '编辑' }}铭文</h2>

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
                <label class="form-label" for="label">
                    label
                </label>

                <input
                    type="text"
                    id="label"
                    v-model="form.label"
                    @blur="markTouched('label')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.label && touched.label }"
                    placeholder="请输入label"
                />

                <span v-if="errors.label && touched.label" class="form-error">
                    {{ errors.label }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="creationPeriod">
                    creationPeriod
                </label>

                <input
                    type="text"
                    id="creationPeriod"
                    v-model="form.creationPeriod"
                    @blur="markTouched('creationPeriod')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.creationPeriod && touched.creationPeriod }"
                    placeholder="请输入creationPeriod"
                />

                <span v-if="errors.creationPeriod && touched.creationPeriod" class="form-error">
                    {{ errors.creationPeriod }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="lastInspectionDate">
                    lastInspectionDate
                </label>

                <input
                    type="text"
                    id="lastInspectionDate"
                    v-model="form.lastInspectionDate"
                    @blur="markTouched('lastInspectionDate')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.lastInspectionDate && touched.lastInspectionDate }"
                    placeholder="请输入lastInspectionDate"
                />

                <span v-if="errors.lastInspectionDate && touched.lastInspectionDate" class="form-error">
                    {{ errors.lastInspectionDate }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="inspectionNotes">
                    inspectionNotes
                </label>

                <input
                    type="text"
                    id="inspectionNotes"
                    v-model="form.inspectionNotes"
                    @blur="markTouched('inspectionNotes')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.inspectionNotes && touched.inspectionNotes }"
                    placeholder="请输入inspectionNotes"
                />

                <span v-if="errors.inspectionNotes && touched.inspectionNotes" class="form-error">
                    {{ errors.inspectionNotes }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="material">
                    材质
                </label>

                <input
                    type="text"
                    id="material"
                    v-model="form.material"
                    @blur="markTouched('material')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.material && touched.material }"
                    placeholder="请输入材质"
                />

                <span v-if="errors.material && touched.material" class="form-error">
                    {{ errors.material }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="period">
                    period
                </label>

                <input
                    type="text"
                    id="period"
                    v-model="form.period"
                    @blur="markTouched('period')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.period && touched.period }"
                    placeholder="请输入period"
                />

                <span v-if="errors.period && touched.period" class="form-error">
                    {{ errors.period }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="conservationStatus">
                    保护状态
                </label>

                <select
                    id="conservationStatus"
                    v-model="form.conservationStatus"
                    @blur="markTouched('conservationStatus')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.conservationStatus && touched.conservationStatus }"
                >
                    <option value="">请选择</option>
                    <option value="excellent">excellent</option>
                    <option value="good">good</option>
                    <option value="fair">fair</option>
                    <option value="poor">poor</option>
                    <option value="critical">critical</option>
                </select>


                <span v-if="errors.conservationStatus && touched.conservationStatus" class="form-error">
                    {{ errors.conservationStatus }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="language">
                    语言
                </label>

                <input
                    type="text"
                    id="language"
                    v-model="form.language"
                    @blur="markTouched('language')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.language && touched.language }"
                    placeholder="请输入语言"
                />

                <span v-if="errors.language && touched.language" class="form-error">
                    {{ errors.language }}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label" for="content">
                    content
                </label>

                <input
                    type="text"
                    id="content"
                    v-model="form.content"
                    @blur="markTouched('content')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.content && touched.content }"
                    placeholder="请输入content"
                />

                <span v-if="errors.content && touched.content" class="form-error">
                    {{ errors.content }}
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
