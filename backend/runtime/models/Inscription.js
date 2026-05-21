const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Inscription Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> HeritageArtifact -> Exhibit -> Inscription
 * All inherited properties are flattened into this schema.
 */
const InscriptionSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    label: { type: String },
    creationPeriod: { type: String },
    lastInspectionDate: { type: Date },
    inspectionNotes: { type: String },
    material: { type: String },
    period: { type: String },
    conservationStatus: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'critical']    },
    language: { type: String },
    content: { type: String },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    environmentConditions: [{ type: Schema.Types.Mixed }],
    defects: [{ type: Schema.Types.Mixed }],
}, {
    timestamps: true,
    collection: 'inscriptions'
});

const Inscription = mongoose.model('Inscription', InscriptionSchema);

module.exports = { Inscription, InscriptionSchema };

