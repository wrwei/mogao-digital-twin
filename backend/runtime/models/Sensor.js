const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Sensor — physical hygrothermal / light logger installed in a cave.
 *
 * A Sensor authenticates via an API key. The plaintext key is returned
 * once, at registration; only a bcrypt hash is stored.
 *
 * Linking: sensors attach to a cave (and optionally to specific artifacts
 * whose local environment they are deemed representative of). The
 * `/exhibits/:gid/environment` query resolves the artifact's cave and
 * aggregates samples from every sensor attached to that cave, plus any
 * explicitly listed overrides.
 */
const SensorSchema = new Schema({
    gid:          { type: String, required: true, unique: true },
    name:         { type: String, required: true },
    model:        { type: String },                            // e.g. 'HOBO MX2301A'
    serialNumber: { type: String },

    apiKeyHash:   { type: String, required: true },            // bcrypt hash of the secret
    apiKeyPrefix: { type: String, required: true, index: true }, // first 8 chars for lookup

    channels:     { type: [String], default: ['temperature', 'humidity'] },

    location: {
        cave:              { type: String },                   // Cave gid
        explicitArtifacts: { type: [String], default: [] },    // artifact gids this sensor specifically covers
        coordinates:       { type: Schema.Types.Mixed },       // { x, y, z } metres within the cave
        placementNote:     { type: String }
    },

    calibration: {
        date:     { type: Date },
        nextDue:  { type: Date },
        offsets:  { type: Schema.Types.Mixed },                // { temperature, humidity, lightKlux } additive corrections
        notes:    { type: String }
    },

    status: {
        active:       { type: Boolean, default: true },
        firstSeenAt:  { type: Date },
        lastSeenAt:   { type: Date },
        samplesTotal: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'sensors'
});

SensorSchema.index({ 'location.cave': 1 });

const Sensor = mongoose.model('Sensor', SensorSchema);
module.exports = { Sensor, SensorSchema };
