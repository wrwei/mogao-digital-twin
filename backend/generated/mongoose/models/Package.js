const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Package Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Package
 * All inherited properties are flattened into this schema.
 */
const PackageSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    objects: [{ type: Schema.Types.Mixed }],
}, {
    timestamps: true,
    collection: 'packages'
});

module.exports = { PackageSchema };

