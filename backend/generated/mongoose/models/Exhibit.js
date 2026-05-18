const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Exhibit Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> HeritageArtifact -> Exhibit
 * All inherited properties are flattened into this schema.
 */
const ExhibitSchema = new Schema({
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
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    environmentConditions: [{ type: Schema.Types.Mixed }],
    defects: [{ type: Schema.Types.Mixed }],
}, {
    timestamps: true,
    collection: 'exhibits'
});

module.exports = { ExhibitSchema };

