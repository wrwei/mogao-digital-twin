const fs = require('fs');
const multer = require('multer');
const PigmentAnalysisService = require('../../services/domain/PigmentAnalysisService');

// Per-artefact pigmentMap blob: client sends gzip-compressed bytes via
// multipart so the wire transfer is reasonable for 8K textures.
const MAX_MAP_BYTES = 64 * 1024 * 1024;  // 64 MB compressed — generous cap
const mapUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_MAP_BYTES }
});

module.exports = {

    mapUploadMiddleware: mapUpload.single('map'),

    /** GET /pigment-analyses?artifactGid=...  — metadata only (JWT). */
    async get(req, res) {
        try {
            const { artifactGid } = req.query;
            if (!artifactGid) return res.status(400).json({ error: 'artifactGid is required' });
            const a = await PigmentAnalysisService.get(artifactGid);
            if (!a) return res.status(404).json({ error: 'No analysis recorded for this artefact' });
            res.json({
                artifactGid:   a.artifactGid,
                regionSummary: a.regionSummary,
                pigmentNames:  a.pigmentNames,
                mapWidth:      a.mapWidth,
                mapHeight:     a.mapHeight,
                mapBytes:      a.mapBytes,
                mapEncoding:   a.mapEncoding,
                textureHash:   a.textureHash,
                createdAt:     a.createdAt,
                updatedAt:     a.updatedAt
            });
        } catch (err) {
            console.error('PigmentAnalysis.get error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /pigment-analyses/:artifactGid/map  — raw binary, public (matches /exhibit_models pattern). */
    async serveMap(req, res) {
        try {
            const a = await PigmentAnalysisService.get(req.params.artifactGid);
            if (!a) return res.status(404).json({ error: 'No analysis for this artefact' });
            const abs = PigmentAnalysisService.absolutePathFor(a);
            if (!fs.existsSync(abs)) return res.status(410).json({ error: 'Map file missing on disk' });
            // Opaque binary — the client decompresses (if encoded) and
            // re-creates a Uint8Array from the bytes.
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('X-Map-Encoding', a.mapEncoding || 'raw');
            res.setHeader('X-Map-Width',    String(a.mapWidth));
            res.setHeader('X-Map-Height',   String(a.mapHeight));
            res.setHeader('Cache-Control',  'private, max-age=3600');
            fs.createReadStream(abs).pipe(res);
        } catch (err) {
            console.error('PigmentAnalysis.serveMap error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /pigment-analyses  — upsert. Body: multipart with `map` blob + JSON fields. */
    async save(req, res) {
        try {
            if (!req.file) return res.status(400).json({ error: 'map file field is required' });
            const { artifactGid } = req.body;
            if (!artifactGid) return res.status(400).json({ error: 'artifactGid is required' });
            const meta = {
                regionSummary: req.body.regionSummary ? JSON.parse(req.body.regionSummary) : [],
                pigmentNames:  req.body.pigmentNames  ? JSON.parse(req.body.pigmentNames)  : [],
                mapWidth:      req.body.mapWidth,
                mapHeight:     req.body.mapHeight,
                textureHash:   req.body.textureHash || null,
                mapEncoding:   req.body.mapEncoding || 'gzip'
            };
            const saved = await PigmentAnalysisService.upsert(artifactGid, req.file.buffer, meta);
            res.status(201).json({
                artifactGid:   saved.artifactGid,
                regionSummary: saved.regionSummary,
                mapWidth:      saved.mapWidth,
                mapHeight:     saved.mapHeight,
                mapBytes:      saved.mapBytes,
                mapEncoding:   saved.mapEncoding,
                createdAt:     saved.createdAt,
                updatedAt:     saved.updatedAt
            });
        } catch (err) {
            console.error('PigmentAnalysis.save error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** DELETE /pigment-analyses/:artifactGid — admin-only. */
    async remove(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can delete pigment analyses' });
            }
            const removed = await PigmentAnalysisService.remove(req.params.artifactGid);
            if (!removed) return res.status(404).json({ error: 'No analysis to remove' });
            res.json({ deleted: removed.artifactGid });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
