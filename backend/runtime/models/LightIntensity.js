const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * LightIntensity Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> EnvironmentCondition -> LightIntensity
 * All inherited properties are flattened into this schema.
 */
const LightIntensitySchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    timestamp: { type: Number },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    reading: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'lightintensities'
});

const LightIntensity = mongoose.model('LightIntensity', LightIntensitySchema);

module.exports = { LightIntensity, LightIntensitySchema };

