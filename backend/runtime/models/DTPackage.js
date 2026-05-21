const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * DTPackage Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Package -> DTPackage
 * All inherited properties are flattened into this schema.
 */
const DTPackageSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    objects: [{ type: Schema.Types.Mixed }],
    importPackages: [{ type: Schema.Types.Mixed }],
}, {
    timestamps: true,
    collection: 'dtpackages'
});

const DTPackage = mongoose.model('DTPackage', DTPackageSchema);

module.exports = { DTPackage, DTPackageSchema };

