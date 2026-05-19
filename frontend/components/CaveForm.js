/**
 * Cave Form Component
 * Auto-generated from mogao_dt.ecore
 * Create/Edit form for 洞窟
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'CaveForm',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    props: {
        cave: {
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
                name: this.cave?.name || '',                description: this.cave?.description || '',                label: this.cave?.label || '',                creationPeriod: this.cave?.creationPeriod || '',                lastInspectionDate: this.cave?.lastInspectionDate || null,                inspectionNotes: this.cave?.inspectionNotes || '',                reference: this.cave?.reference || {
                    gid: '',
                    modelLocation: '',
                    metadataLocation: '',
                    textureLocation: ''
                },
                environmentConditions: this.cave?.environmentConditions || {
                    gid: '',
                    name: '',
                    description: '',
                    timestamp: null
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
        cave: {
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
            if (data.reference) {
                this.form.reference = { ...data.reference };
            }
            if (data.environmentConditions) {
                this.form.environmentConditions = { ...data.environmentConditions };
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
            this.touched['exhibits.gid'] = true;
            this.touched['exhibits.name'] = true;
            this.touched['exhibits.description'] = true;
            this.touched['exhibits.label'] = true;
            this.touched['exhibits.creationPeriod'] = true;
            this.touched['exhibits.lastInspectionDate'] = true;
            this.touched['exhibits.inspectionNotes'] = true;
            this.touched['exhibits.material'] = true;
            this.touched['exhibits.period'] = true;
            this.touched['exhibits.conservationStatus'] = true;

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
                    const response = await api.caves.create(this.form);
                    this.$emit('created', response.data);
                } else {
                    const gid = this.cave.gid;
                    await api.caves.update(gid, this.form);
                    this.$emit('updated', { ...this.cave, ...this.form });
                }
                this.resetForm();
            } catch (error) {
                console.error('Form submission error:', error);
                this.$emit('error', error.response?.data?.message || error.message || this.t('actions.saveError', { entity: this.t('entities.cave') }));
            } finally {
                this.loading = false;
            }
        },

        validate() {
            this.errors = {};
            let isValid = true;

            // Require a name on every artifact — the only universally
            // mandatory field across the metamodel.
            if (!this.form.name || !this.form.name.trim()) {
                this.errors.name = this.t('validation.required', { field: this.t('fields.name') })
                    || 'Name is required.';
                this.touched.name = true;
                isValid = false;
            }


            return isValid;
        },


        resetForm() {
            this.form.name = '';
            this.form.description = '';
            this.form.label = '';
            this.form.creationPeriod = '';
            this.form.lastInspectionDate = null;
            this.form.inspectionNotes = '';
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
                const allowedTypes = ['.obj', '.mtl', '.jpg', '.jpeg', '.png', '.gif', '.json', '.glb', '.gltf'];
                const maxSize = 100 * 1024 * 1024; // 100MB
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                if (!allowedTypes.includes(ext)) {
                    alert('File type not allowed: ' + ext);
                    event.target.value = '';
                    return;
                }
                if (file.size > maxSize) {
                    alert('File too large. Maximum size is 100MB.');
                    event.target.value = '';
                    return;
                }
                this.files[`${refName}_${attrName}`] = file;
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
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 120000 // 2 minutes for file uploads
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
        <form @submit.prevent="handleSubmit" class="form cave-form">
            <h2>{{ mode === 'create' ? t('common.create') : t('common.edit') }} {{ t('entities.cave') }}</h2>

            <div class="form-group">
                <label class="form-label" for="name">
                    {{ t('fields.name') }} <span class="form-required" aria-hidden="true">*</span>
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

            <div class="form-group">
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

            <div class="form-group">
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

            <div class="form-group">
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

            <div class="form-group">
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

            <div class="form-group">
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


            <fieldset class="form-fieldset">
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

            <fieldset class="form-fieldset">
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
