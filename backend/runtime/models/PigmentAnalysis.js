const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * PigmentAnalysis — memoised output of the HSV-threshold pigment-class
 * segmenter for one artefact's current texture.
 *
 * Why persist:
 *   The classifier is deterministic from (texture pixels → class map), so the
 *   same texture always yields the same result. Caching it means a returning
 *   user gets the Pigment Analysis card AND the Environmental Simulation card
 *   appear immediately, with no client-side re-classification.
 *
 * Storage split:
 *   - The small structured fields (regionSummary, dimensions, textureHash)
 *     live here in Mongo for fast filtering and inspection.
 *   - The per-pixel pigmentMap binary (one byte per pixel, gzipped on the
 *     wire) is written to disk under `backend/runtime/pigment-maps/` and
 *     referenced by `mapPath`. Image-sized blobs do not belong in Mongo.
 *
 * Invalidation:
 *   `textureHash` is the basename of the texture URL at analysis time. When
 *   the texture is replaced (new UUID filename), the hash mismatches and the
 *   cached analysis is ignored, prompting the user to re-classify.
 */
const PigmentAnalysisSchema = new Schema({
    artifactGid:  { type: String, required: true, unique: true, index: true },

    // Summary — small, always returned in JSON.
    regionSummary: { type: Schema.Types.Mixed, default: [] },   // [{ id, name, displayName, rgb, count, percent }, ...]
    pigmentNames:  { type: [String], default: [] },             // class index → human-readable name

    // Pigment map — binary on disk.
    mapPath:       { type: String, required: true },            // relative to backend/runtime/pigment-maps/
    mapWidth:      { type: Number, required: true },
    mapHeight:     { type: Number, required: true },
    mapBytes:      { type: Number, required: true },            // gzipped size on disk
    mapEncoding:   { type: String, default: 'gzip' },           // 'gzip' | 'raw'

    // Source-texture identity for invalidation.
    textureHash:   { type: String, default: null }
}, {
    timestamps: true,
    collection: 'pigment_analyses'
});

const PigmentAnalysis = mongoose.model('PigmentAnalysis', PigmentAnalysisSchema);
module.exports = { PigmentAnalysis, PigmentAnalysisSchema };
