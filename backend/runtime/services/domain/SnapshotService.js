const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Snapshot } = require('../../models/Snapshot');

const STORAGE_ROOT = path.join(__dirname, '..', '..', 'snapshots');

function mimeToExt(mimeType) {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg';
    if (mimeType === 'image/webp') return '.webp';
    throw new Error(`Unsupported image mimeType: ${mimeType}`);
}

function dayBucket(date) {
    const iso = date.toISOString();
    return iso.slice(0, 10); // YYYY-MM-DD
}

/**
 * Persist one frame to disk and create the matching Snapshot record.
 *
 * @param sensor        Sensor document (from req.sensor or admin lookup)
 * @param buffer        Image bytes (Buffer)
 * @param mimeType      'image/jpeg' | 'image/png' | 'image/webp'
 * @param meta          { capturedAt?, artifactGid?, caveGid?, width?, height?, note? }
 * @returns { snapshot, deduped: boolean }
 */
async function ingestFrame(sensor, buffer, mimeType, meta = {}) {
    const ext = mimeToExt(mimeType);
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Dedup before touching the filesystem.
    const existing = await Snapshot.findOne({ sensor: sensor._id, contentHash });
    if (existing) return { snapshot: existing, deduped: true };

    const capturedAt = meta.capturedAt ? new Date(meta.capturedAt) : new Date();
    const bucket = dayBucket(capturedAt);
    const gid = uuidv4();
    const relPath = path.join(bucket, `${gid}${ext}`);
    const absPath = path.join(STORAGE_ROOT, relPath);

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, buffer);

    // Resolve artefact/cave: explicit meta wins, otherwise inherit from the sensor.
    const artifactGid = meta.artifactGid
        || (sensor.location && sensor.location.explicitArtifacts && sensor.location.explicitArtifacts[0])
        || null;
    const caveGid = meta.caveGid || (sensor.location && sensor.location.cave) || null;

    const snapshot = await Snapshot.create({
        gid,
        sensor: sensor._id,
        artifactGid,
        caveGid,
        capturedAt,
        mimeType,
        width: meta.width || null,
        height: meta.height || null,
        bytes: buffer.length,
        contentHash,
        filePath: relPath.split(path.sep).join('/'),  // posix-style for portability
        note: meta.note || undefined
    });

    return { snapshot, deduped: false };
}

async function listForArtefact(artifactGid, { limit = 100 } = {}) {
    return Snapshot.find({ artifactGid })
        .sort({ capturedAt: -1 })
        .limit(Math.min(limit, 500));
}

async function listForSensor(sensorObjectId, { from, to, limit = 100 } = {}) {
    const query = { sensor: sensorObjectId };
    if (from || to) {
        query.capturedAt = {};
        if (from) query.capturedAt.$gte = new Date(from);
        if (to)   query.capturedAt.$lte = new Date(to);
    }
    return Snapshot.find(query)
        .sort({ capturedAt: -1 })
        .limit(Math.min(limit, 500));
}

async function getByGid(gid) {
    return Snapshot.findOne({ gid });
}

function absolutePathFor(snapshot) {
    return path.join(STORAGE_ROOT, snapshot.filePath);
}

async function deleteByGid(gid) {
    const snapshot = await Snapshot.findOne({ gid });
    if (!snapshot) return null;
    const abs = absolutePathFor(snapshot);
    try { fs.unlinkSync(abs); } catch (_) { /* already gone */ }
    await snapshot.deleteOne();
    return snapshot;
}

module.exports = {
    ingestFrame,
    listForArtefact,
    listForSensor,
    getByGid,
    absolutePathFor,
    deleteByGid,
    STORAGE_ROOT
};
