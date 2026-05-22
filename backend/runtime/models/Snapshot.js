const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Snapshot — one fixed-pose camera frame ingested from a camera-type Sensor.
 *
 * Snapshots are the visual counterpart of EnvironmentSample: they share the
 * Sensor entity (a camera is a Sensor with `channels` containing 'image')
 * and the per-sensor-key authentication path. The binary lives on disk
 * under the snapshots root; only the path and metadata live in Mongo.
 *
 * Idempotent ingestion: a compound unique index on (sensor, contentHash)
 * silently rejects re-uploads of the same frame, mirroring the
 * EnvironmentSample dedup strategy.
 */
const SnapshotSchema = new Schema({
    gid:          { type: String, required: true, unique: true },
    sensor:       { type: Schema.Types.ObjectId, ref: 'Sensor', required: true, index: true },

    // What this frame is OF — denormalised for cheap range queries.
    artifactGid:  { type: String, default: null, index: true },
    caveGid:      { type: String, default: null, index: true },

    capturedAt:   { type: Date, required: true, index: true },

    // Image metadata — filled by the ingestion path.
    mimeType:     { type: String, required: true },                // image/jpeg | image/png
    width:        { type: Number, default: null },
    height:       { type: Number, default: null },
    bytes:        { type: Number, required: true },
    contentHash:  { type: String, required: true },                // sha256(file)

    // Filesystem path, relative to backend/runtime/snapshots/
    filePath:     { type: String, required: true },

    note:         { type: String }
}, {
    timestamps: true,
    collection: 'snapshots'
});

// Idempotent re-upload protection: same camera + same bytes = same record.
SnapshotSchema.index({ sensor: 1, contentHash: 1 }, { unique: true });

// Range queries by artefact in time order — the primary read path.
SnapshotSchema.index({ artifactGid: 1, capturedAt: -1 });

const Snapshot = mongoose.model('Snapshot', SnapshotSchema);
module.exports = { Snapshot, SnapshotSchema };
