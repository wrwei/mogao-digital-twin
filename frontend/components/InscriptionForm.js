/**
 * Inscription Form Component
 * Auto-generated from mogao_dt.ecore
 * Create/Edit form for 铭文
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'InscriptionForm',
    setup() {
        const { t } = useI18n();
        return { t };
    },
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
                name: this.inscription?.name || '',                description: this.inscription?.description || '',                label: this.inscription?.label || '',                creationPeriod: this.inscription?.creationPeriod || '',                lastInspectionDate: this.inscription?.lastInspectionDate || null,                inspectionNotes: this.inscription?.inspectionNotes || '',                material: this.inscription?.material || '',                period: this.inscription?.period || '',                conservationStatus: this.inscription?.conservationStatus || '',                language: this.inscription?.language || '',                content: this.inscription?.content || '',                reference: this.inscription?.reference || {
                    gid: '',
                    modelLocation: '',
                    metadataLocation: '',
                    textureLocation: ''
                },
                environmentConditions: this.inscription?.environmentConditions || {
                    gid: '',
                    name: '',
                    description: '',
                    timestamp: null
                },
                defects: this.inscription?.defects || {
                    gid: '',
                    name: '',
                    description: '',
                    defectType: '',
                    severity: '',
                    detectionDate: null,
                    affectedArea: null,
                    treatmentHistory: '',
                    requiresImmediateAction: null
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
            this.form.label = data.label || '';
            this.form.creationPeriod = data.creationPeriod || '';
            this.form.lastInspectionDate = data.lastInspectionDate || null;
            this.form.inspectionNotes = data.inspectionNotes || '';
            this.form.material = data.material || '';
            this.form.period = data.period || '';
            this.form.conservationStatus = data.conservationStatus || '';
            this.form.language = data.language || '';
            this.form.content = data.content || '';
            if (data.reference) {
                this.form.reference = { ...data.reference };
            }
            if (data.environmentConditions) {
                this.form.environmentConditions = { ...data.environmentConditions };
            }
            if (data.defects) {
                this.form.defects = { ...data.defects };
            }
        },

        async handleSubmit() {
            // Mark all fields as touched
            this.touched.name = true;
            this.touched.description = true;
            this.touched.label = true;
            this.touched.creationPeriod = true;
            this.touched.lastInspectionDate = true;
            this.touched.inspectionNotes = true;
            this.touched.material = true;
            this.touched.period = true;
            this.touched.conservationStatus = true;
            this.touched.language = true;
            this.touched.content = true;
            this.touched['reference.gid'] = true;
            this.touched['reference.modelLocation'] = true;
            this.touched['reference.metadataLocation'] = true;
            this.touched['reference.textureLocation'] = true;
            this.touched['environmentConditions.gid'] = true;
            this.touched['environmentConditions.name'] = true;
            this.touched['environmentConditions.description'] = true;
            this.touched['environmentConditions.timestamp'] = true;
            this.touched['defects.gid'] = true;
            this.touched['defects.name'] = true;
            this.touched['defects.description'] = true;
            this.touched['defects.defectType'] = true;
            this.touched['defects.severity'] = true;
            this.touched['defects.detectionDate'] = true;
            this.touched['defects.affectedArea'] = true;
            this.touched['defects.treatmentHistory'] = true;
            this.touched['defects.requiresImmediateAction'] = true;

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
                this.$emit('error', error.response?.data?.message || error.message || this.t('actions.saveError', { entity: this.t('entities.inscription') }));
            } finally {
                this.loading = false;
            }
        },

        validate() {
            this.errors = {};
            let isValid = true;

            // Validate name

            // Validate description

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
            this.form.label = '';
            this.form.creationPeriod = '';
            this.form.lastInspectionDate = null;
            this.form.inspectionNotes = '';
            this.form.material = '';
            this.form.period = '';
            this.form.conservationStatus = '';
            this.form.language = '';
            this.form.content = '';
            this.form.reference = {
                gid: '',
                modelLocation: '',
                metadataLocation: '',
                textureLocation: ''
            };
            this.form.environmentConditions = {
                gid: '',
                name: '',
                description: '',
                timestamp: null
            };
            this.form.defects = {
                gid: '',
                name: '',
                description: '',
                defectType: '',
                severity: '',
                detectionDate: null,
                affectedArea: null,
                treatmentHistory: '',
                requiresImmediateAction: null
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
        <form @submit.prevent="handleSubmit" class="form inscription-form">
            <h2>{{ mode === 'create' ? t('common.create') : t('common.edit') }} {{ t('entities.inscription') }}</h2>

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

            <div class="form-group" v-if="mode === 'edit' || true">
                <label class="form-label" for="label">
                    {{ t('fields.label') }}
                </label>

                <input
                    type="text"
                    id="label"
                    v-model="form.label"
                    @blur="markTouched('label')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.label && touched.label }"
                    :placeholder="t('fields.label')"
                />

                <span v-if="errors.label && touched.label" class="form-error">
                    {{ errors.label }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="creationPeriod">
                    {{ t('fields.creationPeriod') }}
                </label>

                <input
                    type="text"
                    id="creationPeriod"
                    v-model="form.creationPeriod"
                    @blur="markTouched('creationPeriod')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.creationPeriod && touched.creationPeriod }"
                    :placeholder="t('fields.creationPeriod')"
                />

                <span v-if="errors.creationPeriod && touched.creationPeriod" class="form-error">
                    {{ errors.creationPeriod }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="lastInspectionDate">
                    {{ t('fields.lastInspectionDate') }}
                </label>

                <input
                    type="text"
                    id="lastInspectionDate"
                    v-model="form.lastInspectionDate"
                    @blur="markTouched('lastInspectionDate')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.lastInspectionDate && touched.lastInspectionDate }"
                    :placeholder="t('fields.lastInspectionDate')"
                />

                <span v-if="errors.lastInspectionDate && touched.lastInspectionDate" class="form-error">
                    {{ errors.lastInspectionDate }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="inspectionNotes">
                    {{ t('fields.inspectionNotes') }}
                </label>

                <input
                    type="text"
                    id="inspectionNotes"
                    v-model="form.inspectionNotes"
                    @blur="markTouched('inspectionNotes')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.inspectionNotes && touched.inspectionNotes }"
                    :placeholder="t('fields.inspectionNotes')"
                />

                <span v-if="errors.inspectionNotes && touched.inspectionNotes" class="form-error">
                    {{ errors.inspectionNotes }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="material">
                    {{ t('fields.material') }}
                </label>

                <input
                    type="text"
                    id="material"
                    v-model="form.material"
                    @blur="markTouched('material')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.material && touched.material }"
                    :placeholder="t('fields.material')"
                />

                <span v-if="errors.material && touched.material" class="form-error">
                    {{ errors.material }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="period">
                    {{ t('fields.period') }}
                </label>

                <input
                    type="text"
                    id="period"
                    v-model="form.period"
                    @blur="markTouched('period')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.period && touched.period }"
                    :placeholder="t('fields.period')"
                />

                <span v-if="errors.period && touched.period" class="form-error">
                    {{ errors.period }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="conservationStatus">
                    {{ t('fields.conservationStatus') }}
                </label>

                <select
                    id="conservationStatus"
                    v-model="form.conservationStatus"
                    @blur="markTouched('conservationStatus')"
                    class="form-select"
                    :class="{ 'form-select-error': errors.conservationStatus && touched.conservationStatus }"
                >
                    <option value="">{{ t('common.loading') }}</option>
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

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="language">
                    {{ t('fields.language') }}
                </label>

                <input
                    type="text"
                    id="language"
                    v-model="form.language"
                    @blur="markTouched('language')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.language && touched.language }"
                    :placeholder="t('fields.language')"
                />

                <span v-if="errors.language && touched.language" class="form-error">
                    {{ errors.language }}
                </span>
            </div>

            <div class="form-group" v-if="mode === 'edit' || false">
                <label class="form-label" for="content">
                    {{ t('fields.content') }}
                </label>

                <input
                    type="text"
                    id="content"
                    v-model="form.content"
                    @blur="markTouched('content')"
                    class="form-input"
                    :class="{ 'form-input-error': errors.content && touched.content }"
                    :placeholder="t('fields.content')"
                />

                <span v-if="errors.content && touched.content" class="form-error">
                    {{ errors.content }}
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

            <fieldset class="form-fieldset" v-if="mode === 'edit'">
                <legend class="form-legend">{{ t('fields.environmentConditions') }}</legend>
                <div class="form-group">
                    <label class="form-label" for="environmentConditions_gid">
                        {{ t('fields.gid') }}
                    </label>
                    <input
                        type="text"
                        id="environmentConditions_gid"
                        v-model="form.environmentConditions.gid"
                        @blur="markTouched('environmentConditions.gid')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['environmentConditions.gid'] && touched['environmentConditions.gid'] }"
                        :placeholder="t('fields.gid')"
                    />
                    <span v-if="errors['environmentConditions.gid'] && touched['environmentConditions.gid']" class="form-error">
                        {{ errors['environmentConditions.gid'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="environmentConditions_name">
                        {{ t('fields.name') }}
                    </label>
                    <input
                        type="text"
                        id="environmentConditions_name"
                        v-model="form.environmentConditions.name"
                        @blur="markTouched('environmentConditions.name')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['environmentConditions.name'] && touched['environmentConditions.name'] }"
                        :placeholder="t('fields.name')"
                    />
                    <span v-if="errors['environmentConditions.name'] && touched['environmentConditions.name']" class="form-error">
                        {{ errors['environmentConditions.name'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="environmentConditions_description">
                        {{ t('fields.description') }}
                    </label>
                    <input
                        type="text"
                        id="environmentConditions_description"
                        v-model="form.environmentConditions.description"
                        @blur="markTouched('environmentConditions.description')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['environmentConditions.description'] && touched['environmentConditions.description'] }"
                        :placeholder="t('fields.description')"
                    />
                    <span v-if="errors['environmentConditions.description'] && touched['environmentConditions.description']" class="form-error">
                        {{ errors['environmentConditions.description'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="environmentConditions_timestamp">
                        {{ t('fields.timestamp') }}
                    </label>
                    <input
                        type="text"
                        id="environmentConditions_timestamp"
                        v-model="form.environmentConditions.timestamp"
                        @blur="markTouched('environmentConditions.timestamp')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['environmentConditions.timestamp'] && touched['environmentConditions.timestamp'] }"
                        :placeholder="t('fields.timestamp')"
                    />
                    <span v-if="errors['environmentConditions.timestamp'] && touched['environmentConditions.timestamp']" class="form-error">
                        {{ errors['environmentConditions.timestamp'] }}
                    </span>
                </div>
            </fieldset>

            <fieldset class="form-fieldset" v-if="mode === 'edit'">
                <legend class="form-legend">{{ t('fields.defects') }}</legend>
                <div class="form-group">
                    <label class="form-label" for="defects_gid">
                        {{ t('fields.gid') }}
                    </label>
                    <input
                        type="text"
                        id="defects_gid"
                        v-model="form.defects.gid"
                        @blur="markTouched('defects.gid')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.gid'] && touched['defects.gid'] }"
                        :placeholder="t('fields.gid')"
                    />
                    <span v-if="errors['defects.gid'] && touched['defects.gid']" class="form-error">
                        {{ errors['defects.gid'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_name">
                        {{ t('fields.name') }}
                    </label>
                    <input
                        type="text"
                        id="defects_name"
                        v-model="form.defects.name"
                        @blur="markTouched('defects.name')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.name'] && touched['defects.name'] }"
                        :placeholder="t('fields.name')"
                    />
                    <span v-if="errors['defects.name'] && touched['defects.name']" class="form-error">
                        {{ errors['defects.name'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_description">
                        {{ t('fields.description') }}
                    </label>
                    <input
                        type="text"
                        id="defects_description"
                        v-model="form.defects.description"
                        @blur="markTouched('defects.description')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.description'] && touched['defects.description'] }"
                        :placeholder="t('fields.description')"
                    />
                    <span v-if="errors['defects.description'] && touched['defects.description']" class="form-error">
                        {{ errors['defects.description'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_defectType">
                        {{ t('fields.defectType') }}
                    </label>
                    <input
                        type="text"
                        id="defects_defectType"
                        v-model="form.defects.defectType"
                        @blur="markTouched('defects.defectType')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.defectType'] && touched['defects.defectType'] }"
                        :placeholder="t('fields.defectType')"
                    />
                    <span v-if="errors['defects.defectType'] && touched['defects.defectType']" class="form-error">
                        {{ errors['defects.defectType'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_severity">
                        {{ t('fields.severity') }}
                    </label>
                    <input
                        type="text"
                        id="defects_severity"
                        v-model="form.defects.severity"
                        @blur="markTouched('defects.severity')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.severity'] && touched['defects.severity'] }"
                        :placeholder="t('fields.severity')"
                    />
                    <span v-if="errors['defects.severity'] && touched['defects.severity']" class="form-error">
                        {{ errors['defects.severity'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_detectionDate">
                        {{ t('fields.detectionDate') }}
                    </label>
                    <input
                        type="text"
                        id="defects_detectionDate"
                        v-model="form.defects.detectionDate"
                        @blur="markTouched('defects.detectionDate')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.detectionDate'] && touched['defects.detectionDate'] }"
                        :placeholder="t('fields.detectionDate')"
                    />
                    <span v-if="errors['defects.detectionDate'] && touched['defects.detectionDate']" class="form-error">
                        {{ errors['defects.detectionDate'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_affectedArea">
                        {{ t('fields.affectedArea') }}
                    </label>
                    <input
                        type="text"
                        id="defects_affectedArea"
                        v-model="form.defects.affectedArea"
                        @blur="markTouched('defects.affectedArea')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.affectedArea'] && touched['defects.affectedArea'] }"
                        :placeholder="t('fields.affectedArea')"
                    />
                    <span v-if="errors['defects.affectedArea'] && touched['defects.affectedArea']" class="form-error">
                        {{ errors['defects.affectedArea'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_treatmentHistory">
                        {{ t('fields.treatmentHistory') }}
                    </label>
                    <input
                        type="text"
                        id="defects_treatmentHistory"
                        v-model="form.defects.treatmentHistory"
                        @blur="markTouched('defects.treatmentHistory')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.treatmentHistory'] && touched['defects.treatmentHistory'] }"
                        :placeholder="t('fields.treatmentHistory')"
                    />
                    <span v-if="errors['defects.treatmentHistory'] && touched['defects.treatmentHistory']" class="form-error">
                        {{ errors['defects.treatmentHistory'] }}
                    </span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="defects_requiresImmediateAction">
                        {{ t('fields.requiresImmediateAction') }}
                    </label>
                    <input
                        type="text"
                        id="defects_requiresImmediateAction"
                        v-model="form.defects.requiresImmediateAction"
                        @blur="markTouched('defects.requiresImmediateAction')"
                        class="form-input"
                        :class="{ 'form-input-error': errors['defects.requiresImmediateAction'] && touched['defects.requiresImmediateAction'] }"
                        :placeholder="t('fields.requiresImmediateAction')"
                    />
                    <span v-if="errors['defects.requiresImmediateAction'] && touched['defects.requiresImmediateAction']" class="form-error">
                        {{ errors['defects.requiresImmediateAction'] }}
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
