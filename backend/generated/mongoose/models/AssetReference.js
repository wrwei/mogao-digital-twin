const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * AssetReference Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> UtilityElement -> AssetReference
 * All inherited properties are flattened into this schema.
 */
const AssetReferenceSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    modelLocation: { type: String },
    metadataLocation: { type: String },
    textureLocation: { type: String },
}, {
    timestamps: true,
    collection: 'assetreferences'
});

const AssetReference = mongoose.model('AssetReference', AssetReferenceSchema);

module.exports = { AssetReference, AssetReferenceSchema };

