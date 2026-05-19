const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * EnvironmentSample — one timestep of hygrothermal+light data from a sensor.
 *
 * The sampling period is nominally 10 minutes (≈ 52,560 samples / sensor / year).
 * MongoDB handles this comfortably with a compound (sensor, timestamp) index.
 *
 * lightKlux is optional — most Mogao cave interiors have no illumination,
 * so many sensors will omit that channel.
 *
 * A compound unique index on (sensor, timestamp) prevents duplicate ingestion
 * if a logger re-uploads the same batch; duplicates are silently skipped.
 */
const EnvironmentSampleSchema = new Schema({
    sensor:      { type: Schema.Types.ObjectId, ref: 'Sensor', required: true, index: true },
    timestamp:   { type: Date, required: true, index: true },
    temperature: { type: Number, required: true },     // °C
    humidity:    { type: Number, required: true },     // %
    lightKlux:   { type: Number, default: null },      // klux (null = not measured)

    raw:         { type: Boolean, default: true },     // false for imputed / corrected samples
    note:        { type: String }
}, {
    timestamps: true,
    collection: 'environment_samples'
});

// Unique compound index for idempotent ingestion
EnvironmentSampleSchema.index({ sensor: 1, timestamp: 1 }, { unique: true });

// Range queries by sensor in time order
EnvironmentSampleSchema.index({ sensor: 1, timestamp: -1 });

const EnvironmentSample = mongoose.model('EnvironmentSample', EnvironmentSampleSchema);
module.exports = { EnvironmentSample, EnvironmentSampleSchema };
