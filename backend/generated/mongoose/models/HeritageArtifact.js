const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * HeritageArtifact Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> HeritageArtifact
 * All inherited properties are flattened into this schema.
 */
const HeritageArtifactSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    label: { type: String },
    creationPeriod: { type: String },
    lastInspectionDate: { type: Date },
    inspectionNotes: { type: String },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    environmentConditions: [{ type: Schema.Types.Mixed }],
    defects: [{ type: Schema.Types.Mixed }],
}, {
    timestamps: true,
    collection: 'heritageartifacts'
});

module.exports = { HeritageArtifactSchema };

