const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Parameter Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> UtilityElement -> Parameter
 * All inherited properties are flattened into this schema.
 */
const ParameterSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    expression: { type: String },
    value: { type: Number },
    unit: {
        type: String,
        enum: ['null', 'mm', 'K', 'RH', 'lux'],
        required: true    },
}, {
    timestamps: true,
    collection: 'parameters'
});

const Parameter = mongoose.model('Parameter', ParameterSchema);

module.exports = { Parameter, ParameterSchema };

