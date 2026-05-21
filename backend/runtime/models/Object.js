const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Object Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object
 * All inherited properties are flattened into this schema.
 */
const ObjectSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'objects'
});

module.exports = { ObjectSchema };

