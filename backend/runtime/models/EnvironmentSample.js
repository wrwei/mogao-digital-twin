const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * EnvironmentSample — one timestep of hygrothermal+light data from a sensor.
 *
 * The sampling period is nominally 10 minutes (≈ 52,560 samples / sensor / year).
 * MongoDB handles this comfortably with a compound (sensor, timestamp) index.
 *
 * Channels are individually optional: a single-channel sensor (temperature-only
 * or humidity-only) writes the channel it owns and leaves the others null. At
 * least one of temperature / humidity must be present — enforced in the service.
 *
 * A compound unique index on (sensor, timestamp) prevents duplicate ingestion
 * if a logger re-uploads the same batch; duplicates are silently skipped.
 */
const EnvironmentSampleSchema = new Schema({
    sensor:      { type: Schema.Types.ObjectId, ref: 'Sensor', required: true, index: true },
    timestamp:   { type: Date, required: true, index: true },
    temperature: { type: Number, default: null },      // °C   (null = sensor doesn't own this channel)
    humidity:    { type: Number, default: null },      // %    (null = sensor doesn't own this channel)
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
