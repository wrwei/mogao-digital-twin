const fs = require('fs');
const multer = require('multer');
const SnapshotService = require('../../services/domain/SnapshotService');
const { Sensor } = require('../../models/Sensor');

// In-memory upload, capped to keep a stray 100 MP photo from OOM-ing the process.
const MAX_FRAME_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const frameUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FRAME_BYTES },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
        else cb(new Error(`Unsupported image type: ${file.mimetype}`));
    }
});

module.exports = {

    /** Multipart middleware — call before ingestFrame in the route. */
    frameUploadMiddleware: frameUpload.single('frame'),

    /** POST /snapshots/ingest (sensor-authenticated). */
    async ingestFrame(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'frame file field is required' });
            }
            const { capturedAt, artifactGid, caveGid, width, height, note } = req.body;
            const meta = {
                capturedAt,
                artifactGid,
                caveGid,
                width: width ? Number(width) : null,
                height: height ? Number(height) : null,
                note
            };
            const { snapshot, deduped } = await SnapshotService.ingestFrame(
                req.sensor, req.file.buffer, req.file.mimetype, meta
            );
            res.status(deduped ? 200 : 201).json({
                snapshot: {
                    gid: snapshot.gid,
                    capturedAt: snapshot.capturedAt,
                    mimeType: snapshot.mimeType,
                    bytes: snapshot.bytes,
                    artifactGid: snapshot.artifactGid,
                    caveGid: snapshot.caveGid
                },
                deduped
            });
        } catch (err) {
            console.error('ingestFrame error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /snapshots?artifactGid=...  — metadata listing for a UI strip. */
    async listForArtefact(req, res) {
        try {
            const { artifactGid, limit } = req.query;
            if (!artifactGid) return res.status(400).json({ error: 'artifactGid query param required' });
            const snapshots = await SnapshotService.listForArtefact(artifactGid, {
                limit: limit ? Number(limit) : 100
            });
            res.json(snapshots.map(s => ({
                gid: s.gid,
                capturedAt: s.capturedAt,
                mimeType: s.mimeType,
                width: s.width,
                height: s.height,
                bytes: s.bytes,
                artifactGid: s.artifactGid,
                caveGid: s.caveGid,
                note: s.note
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /sensors/:gid/snapshots?from=&to=&limit=  — per-camera history. */
    async listForSensor(req, res) {
        try {
            const sensor = await Sensor.findOne({ gid: req.params.gid });
            if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
            const { from, to, limit } = req.query;
            const snapshots = await SnapshotService.listForSensor(sensor._id, {
                from,
                to,
                limit: limit ? Number(limit) : 100
            });
            res.json({
                sensor: { gid: sensor.gid, name: sensor.name, channels: sensor.channels },
                snapshots: snapshots.map(s => ({
                    gid: s.gid,
                    capturedAt: s.capturedAt,
                    mimeType: s.mimeType,
                    width: s.width,
                    height: s.height,
                    bytes: s.bytes,
                    artifactGid: s.artifactGid,
                    caveGid: s.caveGid,
                    note: s.note
                }))
            });
        } catch (err) {
            console.error('listForSensor error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /snapshots/:gid/image — serve the binary. */
    async serveImage(req, res) {
        try {
            const snapshot = await SnapshotService.getByGid(req.params.gid);
            if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
            const abs = SnapshotService.absolutePathFor(snapshot);
            if (!fs.existsSync(abs)) {
                return res.status(410).json({ error: 'Snapshot file is missing on disk' });
            }
            res.setHeader('Content-Type', snapshot.mimeType);
            res.setHeader('Cache-Control', 'private, max-age=3600');
            fs.createReadStream(abs).pipe(res);
        } catch (err) {
            console.error('serveImage error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** DELETE /snapshots/:gid  — admin-only. */
    async deleteSnapshot(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can delete snapshots' });
            }
            const removed = await SnapshotService.deleteByGid(req.params.gid);
            if (!removed) return res.status(404).json({ error: 'Snapshot not found' });
            res.json({ deleted: removed.gid });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
