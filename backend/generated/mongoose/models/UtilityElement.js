const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * UtilityElement Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> UtilityElement
 * All inherited properties are flattened into this schema.
 */
const UtilityElementSchema = new Schema({
    gid: { type: String, required: true, unique: true },
}, {
    timestamps: true,
    collection: 'utilityelements'
});

module.exports = { UtilityElementSchema };

