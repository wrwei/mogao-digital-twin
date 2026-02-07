/**
 * Defect Form Component
 * Auto-generated from mogao_dt.ecore
 * Create/Edit form for 缺陷
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'DefectForm',
    setup() {
        const { t } = useI18n();
        return { t };
    },
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
                name: this.defect?.name || '',                description: this.defect?.description || '',                defectType: this.defect?.defectType || '',                severity: this.defect?.severity || '',                detectionDate: this.defect?.detectionDate || null,                affectedArea: this.defect?.affectedArea || null,                treatmentHistory: this.defect?.treatmentHistory || '',                requiresImmediateAction: this.defect?.requiresImmediateAction || null,                reference: this.defect?.reference || {
                    gid: '',
                    modelLocation: '',
                    metadataLocation: '',
                    textureLocation: ''
                }
            },
            errors: {},
            loading: false,
            touched: {},
            files: {
                reference_modelLocation: null,
                reference_metadataLocation: null,
                reference_textureLocation: null
            }
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
            this.form.defectType = data.defectType || '';
            this.form.severity = data.severity || '';
            this.form.detectionDate = data.detectionDate || null;
            this.form.affectedArea = data.affectedArea || null;
            this.form.treatmentHistory = data.treatmentHistory || '';
            this.form.requiresImmediateAction = data.requiresImmediateAction || null;
            if (data.reference) {
                this.form.reference = { ...data.reference };
            }
        },

        async handleSubmit() {
            // Mark all fields as touched
            this.touched.name = true;
            this.touched.description = true;
            this.touched.defectType = true;
            this.touched.severity = true;
            this.touched.detectionDate = true;
            this.touched.affectedArea = true;
            this.touched.treatmentHistory = true;
            this.touched.requiresImmediateAction = true;
            this.touched['reference.gid'] = true;
            this.touched['reference.modelLocation'] = true;
            this.touched['reference.metadataLocation'] = true;
            this.touched['reference.textureLocation'] = true;

            if (!this.validate()) {
                this.$emit('error', this.t('validation.required', { field: '' }));
                return;
            }

            this.loading = true;
            try {
                // Upload files first and get server paths
                const uploadedPaths = await this.uploadFiles();

                // Replace file names with server paths in form
                for (const [key, path] of Object.entries(uploadedPaths)) {
                    const [refName, attrName] = key.split('_');
                    this.form[refName][attrName] = path;
                }

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
                this.$emit('error', error.response?.data?.message || error.message || this.t('actions.saveError', { entity: this.t('entities.defect') }));
            } finally {
                this.loading = false;
            }
        },

        validate() {
            this.errors = {};
            let isValid = true;

            // Validate name

            // Validate description

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
            this.form.defectType = '';
            this.form.severity = '';
            this.form.detectionDate = null;
            this.form.affectedArea = null;
            this.form.treatmentHistory = '';
            this.form.requiresImmediateAction = null;
            this.form.reference = {
                gid: '',
                modelLocation: '',
                metadataLocation: '',
                textureLocation: ''
            };
            this.errors = {};
            this.touched = {};
        },

        handleCancel() {
            this.resetForm();
            this.$emit('cancel');
        },

        markTouched(field) {
            this.touched[field] = true;
        },

        handleFileSelect(event, refName, attrName) {
            const file = event.target.files[0];
            if (file) {
                // Store the File object for upload
                this.files[`${refName}_${attrName}`] = file;
                // Display the filename
                this.form[refName][attrName] = file.name;
                this.markTouched(`${refName}.${attrName}`);
            }
        },

        async uploadFiles() {
            const uploadedPaths = {};

            for (const [key, file] of Object.entries(this.files)) {
                if (file) {
                    const [refName, attrName] = key.split('_');
                    const category = attrName.replace('Location', '').toLowerCase();

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('category', category);

                    try {
                        const response = await api.post('/api/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });

                        uploadedPaths[key] = response.data.path;
                    } catch (error) {
                        console.error(`Failed to upload ${file.name}:`, error);
                        throw new Error(`Failed to upload ${file.name}`);
                    }
                }
            }

            return uploadedPaths;
        }
    },
    template: `
        <form @submit.prevent="handleSubmit" class="form defect-form">
            <h2>{{ mode === 'create' ? t('common.create') : t('common.edit') }} {{ t('entities.defect') }}</h2>

            <div class="form-group" v-if="mode === 'edit' || true">
                <label class="form-label" for="name">
                    {{ t('fields.name') }}
                </label>

                <input
                    type="text"
                    id="name"
                    v-model="form.name"
                    @blur="markTouched('name')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.name && touched.name }"
                    :placeholder="t('fields.name')"
                />

                <span v-if="errors.name && touched.name" class="form-error">
                    {{ errors.name }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || true">
                <label class="form-label" for="description">
                    {{ t('fields.description') }}
                </label>

                <textarea
                    id="description"
                    v-model="form.description"
                    @blur="markTouched('description')"
                    class="form-textarea"
                    :class="{ 'form-textarea-error': errors.description && touched.description }"
                    :placeholder="t('fields.description')"
                    rows="4"
                ></textarea>


                <span v-if="errors.description && touched.description" class="form-error">
                    {{ errors.description }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="defectType">
                    {{ t('fields.defectType') }}
                </label>

                <select
                    id="defectType"
                    v-model="form.defectType"
                    @blur="markTouched('defectType')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.defectType && touched.defectType }"
                >
                    <option value="">{{ t('common.loading') }}</option>
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

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="severity">
                    {{ t('fields.severity') }}
                </label>

                <select
                    id="severity"
                    v-model="form.severity"
                    @blur="markTouched('severity')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.severity && touched.severity }"
                >
                    <option value="">{{ t('common.loading') }}</option>
                    <option value="minor">minor</option>
                    <option value="moderate">moderate</option>
                    <option value="severe">severe</option>
                    <option value="critical">critical</option>
                </select>


                <span v-if="errors.severity && touched.severity" class="form-error">
                    {{ errors.severity }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="detectionDate">
                    {{ t('fields.detectionDate') }}
                </label>

                <input
                    type="text"
                    id="detectionDate"
                    v-model="form.detectionDate"
                    @blur="markTouched('detectionDate')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.detectionDate && touched.detectionDate }"
                    :placeholder="t('fields.detectionDate')"
                />

                <span v-if="errors.detectionDate && touched.detectionDate" class="form-error">
                    {{ errors.detectionDate }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="affectedArea">
                    {{ t('fields.affectedArea') }}
                </label>

                <input
                    type="text"
                    id="affectedArea"
                    v-model="form.affectedArea"
                    @blur="markTouched('affectedArea')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.affectedArea && touched.affectedArea }"
                    :placeholder="t('fields.affectedArea')"
                />

                <span v-if="errors.affectedArea && touched.affectedArea" class="form-error">
                    {{ errors.affectedArea }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="treatmentHistory">
                    {{ t('fields.treatmentHistory') }}
                </label>

                <input
                    type="text"
                    id="treatmentHistory"
                    v-model="form.treatmentHistory"
                    @blur="markTouched('treatmentHistory')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.treatmentHistory && touched.treatmentHistory }"
                    :placeholder="t('fields.treatmentHistory')"
                />

                <span v-if="errors.treatmentHistory && touched.treatmentHistory" class="form-error">
                    {{ errors.treatmentHistory }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="requiresImmediateAction">
                    {{ t('fields.requiresImmediateAction') }}
                </label>

                <input
                    type="text"
                    id="requiresImmediateAction"
                    v-model="form.requiresImmediateAction"
                    @blur="markTouched('requiresImmediateAction')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.requiresImmediateAction && touched.requiresImmediateAction }"
                    :placeholder="t('fields.requiresImmediateAction')"
                />

                <span v-if="errors.requiresImmediateAction && touched.requiresImmediateAction" class="form-error">
                    {{ errors.requiresImmediateAction }}
                </span>
            </div>


            <fieldset class="form-fieldset" v-if="mode === 'edit'">
                <legend class="form-legend">{{ t('fields.reference') }}</legend>
                <div class="form-group">
                    <label class="form-label" for="reference_gid">
                        {{ t('fields.gid') }}
                    </label>
                    <input
                        type="text"
                        id="reference_gid"
                        v-model="form.reference.gid"
                        @blur="markTouched('reference.gid')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['reference.gid'] && touched['reference.gid'] }"
                        :placeholder="t('fields.gid')"
                    />
                    <span v-if="errors['reference.gid'] && touched['reference.gid']" class="form-error">
                        {{ errors['reference.gid'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="reference_modelLocation">
                        {{ t('fields.modelLocation') }}
                    </label>
                    <input
                        type="file"
                        id="reference_modelLocation"
                        @change="handleFileSelect($event, 'reference', 'modelLocation')"
                        @blur="markTouched('reference.modelLocation')"
                        class="form-input form-input-file"
                        :class="{ 'form-input-error': errors['reference.modelLocation'] && touched['reference.modelLocation'] }"
accept=".obj,.fbx,.gltf,.glb"                    />
                    <small v-if="form.reference.modelLocation" class="form-help">
                        {{ t('common.selected') }}: {{ form.reference.modelLocation }}
                    </small>
                    <span v-if="errors['reference.modelLocation'] && touched['reference.modelLocation']" class="form-error">
                        {{ errors['reference.modelLocation'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="reference_metadataLocation">
                        {{ t('fields.metadataLocation') }}
                    </label>
                    <input
                        type="file"
                        id="reference_metadataLocation"
                        @change="handleFileSelect($event, 'reference', 'metadataLocation')"
                        @blur="markTouched('reference.metadataLocation')"
                        class="form-input form-input-file"
                        :class="{ 'form-input-error': errors['reference.metadataLocation'] && touched['reference.metadataLocation'] }"
accept=".json,.xml,.txt"                    />
                    <small v-if="form.reference.metadataLocation" class="form-help">
                        {{ t('common.selected') }}: {{ form.reference.metadataLocation }}
                    </small>
                    <span v-if="errors['reference.metadataLocation'] && touched['reference.metadataLocation']" class="form-error">
                        {{ errors['reference.metadataLocation'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="reference_textureLocation">
                        {{ t('fields.textureLocation') }}
                    </label>
                    <input
                        type="file"
                        id="reference_textureLocation"
                        @change="handleFileSelect($event, 'reference', 'textureLocation')"
                        @blur="markTouched('reference.textureLocation')"
                        class="form-input form-input-file"
                        :class="{ 'form-input-error': errors['reference.textureLocation'] && touched['reference.textureLocation'] }"
accept=".jpg,.jpeg,.png,.bmp"                    />
                    <small v-if="form.reference.textureLocation" class="form-help">
                        {{ t('common.selected') }}: {{ form.reference.textureLocation }}
                    </small>
                    <span v-if="errors['reference.textureLocation'] && touched['reference.textureLocation']" class="form-error">
                        {{ errors['reference.textureLocation'] }}
                    </span>
                </div>
            </fieldset>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" @click="handleCancel" :disabled="loading">
                    {{ t('common.cancel') }}
                </button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <span v-if="loading">{{ t('common.loading') }}</span>
                    <span v-else>{{ mode === 'create' ? t('common.create') : t('common.save') }}</span>
                </button>
            </div>
        </form>
    `
};
