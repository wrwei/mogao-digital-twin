const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Humidity Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> ModelElement -> Object -> EnvironmentCondition -> Humidity
 * All inherited properties are flattened into this schema.
 */
const HumiditySchema = new Schema({
    gid: { type: String, required: true, unique: true },
    name: { type: String },
    description: { type: String },
    timestamp: { type: Number },
    reference: { type: Schema.Types.Mixed },
    coordinates: { type: Schema.Types.Mixed },
    reading: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
    collection: 'humidities'
});

const Humidity = mongoose.model('Humidity', HumiditySchema);

module.exports = { Humidity, HumiditySchema };

