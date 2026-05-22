const fs = require('fs');
const path = require('path');
const { PigmentAnalysis } = require('../../models/PigmentAnalysis');

const STORAGE_ROOT = path.join(__dirname, '..', '..', 'pigment-maps');

function ensureDir() {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

function pathFor(artifactGid) {
    // One file per artefact — overwritten when a new analysis is uploaded.
    // The filesystem name uses the artefact gid so it's traceable from disk.
    const safe = String(artifactGid).replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(STORAGE_ROOT, `${safe}.bin`);
}

/**
 * Upsert the analysis record for an artefact, writing the (already-encoded)
 * pigmentMap binary to disk.
 *
 * @param artifactGid     string
 * @param mapBuffer       Buffer — the pigmentMap bytes (gzipped from the client)
 * @param meta            { regionSummary, pigmentNames, mapWidth, mapHeight, textureHash, mapEncoding }
 */
async function upsert(artifactGid, mapBuffer, meta) {
    ensureDir();
    const abs = pathFor(artifactGid);
    fs.writeFileSync(abs, mapBuffer);

    const update = {
        artifactGid,
        regionSummary: meta.regionSummary || [],
        pigmentNames:  meta.pigmentNames || [],
        mapPath:       path.basename(abs),
        mapWidth:      Number(meta.mapWidth),
        mapHeight:     Number(meta.mapHeight),
        mapBytes:      mapBuffer.length,
        mapEncoding:   meta.mapEncoding || 'gzip',
        textureHash:   meta.textureHash || null
    };
    return PigmentAnalysis.findOneAndUpdate(
        { artifactGid },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

async function get(artifactGid) {
    return PigmentAnalysis.findOne({ artifactGid });
}

function absolutePathFor(analysis) {
    return path.join(STORAGE_ROOT, analysis.mapPath);
}

async function remove(artifactGid) {
    const existing = await PigmentAnalysis.findOne({ artifactGid });
    if (!existing) return null;
    try { fs.unlinkSync(absolutePathFor(existing)); } catch (_) { /* already gone */ }
    await existing.deleteOne();
    return existing;
}

module.exports = {
    upsert,
    get,
    remove,
    absolutePathFor,
    STORAGE_ROOT
};
