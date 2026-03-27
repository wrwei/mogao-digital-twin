const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * EnvironmentCondition Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> EnvironmentCondition
 * All inherited properties are flattened into this schema.
 */
const EnvironmentConditionSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    timestamp: { type: Number },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'environmentconditions'
});

module.exports = { EnvironmentConditionSchema };

