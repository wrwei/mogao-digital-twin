const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Defect Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> Defect
 * All inherited properties are flattened into this schema.
 */
const DefectSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    defectType: {
        type: String,
        enum: ['cracking', 'flaking', 'blistering', 'detachment', 'materialLoss', 'disruption', 'alveolization', 'saltEfflorescence', 'colorAlteration', 'acidAttack', 'paintLoss', 'microbialGrowth', 'blackSpots', 'lichenGrowth', 'insectDamage', 'waterSeepage', 'sootDeposition', 'erosion', 'structuralCollapse', 'graffiti']    },
    severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe', 'critical']    },
    detectionDate: { type: Number },
    affectedArea: { type: Number },
    treatmentHistory: { type: String },
    requiresImmediateAction: { type: Boolean },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'defects'
});

const Defect = mongoose.model('Defect', DefectSchema);

module.exports = { Defect, DefectSchema };

