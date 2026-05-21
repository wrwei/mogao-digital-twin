const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * DTElement Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * All inherited properties are flattened into this schema.
 */
const DTElementSchema = new Schema({
    gid: { type: String, required: true, unique: true },
}, {
    timestamps: true,
    collection: 'dtelements'
});

module.exports = { DTElementSchema };

