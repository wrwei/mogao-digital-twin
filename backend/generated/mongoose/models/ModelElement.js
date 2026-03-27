const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ModelElement Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement
 * All inherited properties are flattened into this schema.
 */
const ModelElementSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
}, {
    timestamps: true,
    collection: 'modelelements'
});

module.exports = { ModelElementSchema };

