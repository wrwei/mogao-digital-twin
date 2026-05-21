const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Temperature Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> EnvironmentCondition -> Temperature
 * All inherited properties are flattened into this schema.
 */
const TemperatureSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    timestamp: { type: Number },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    reading: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'temperatures'
});

const Temperature = mongoose.model('Temperature', TemperatureSchema);

module.exports = { Temperature, TemperatureSchema };

