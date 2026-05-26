const multer = require('multer');
const TelemetryService = require('../../services/domain/TelemetryService');
const { Sensor } = require('../../models/Sensor');

// In-memory CSV upload (bounded at 20 MB — roughly 100k sample rows)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

module.exports = {

    // ── Sensor CRUD (admin) ──────────────────────────────────────────────

    async registerSensor(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can register sensors' });
            }
            if (!req.body.name) {
                return res.status(400).json({ error: 'name is required' });
            }
            const { sensor, apiKey } = await TelemetryService.registerSensor(req.body);
            const sensorOut = sensor.toObject();
            delete sensorOut.apiKeyHash;
            res.status(201).json({
                sensor: sensorOut,
                apiKey,
                note: 'Store this apiKey securely. It will not be shown again.'
            });
        } catch (err) {
            console.error('registerSensor error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    async listSensors(req, res) {
        try {
            const sensors = await TelemetryService.listSensors();
            res.json(sensors);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async getSensor(req, res) {
        try {
            const s = await TelemetryService.getSensor(req.params.gid);
            if (!s) return res.status(404).json({ error: 'Sensor not found' });
            res.json(s);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async deactivateSensor(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can deactivate sensors' });
            }
            const s = await TelemetryService.deactivateSensor(req.params.gid);
            if (!s) return res.status(404).json({ error: 'Sensor not found' });
            res.json(s);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async deleteSensor(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can delete sensors' });
            }
            const result = await TelemetryService.deleteSensor(req.params.gid);
            if (!result) return res.status(404).json({ error: 'Sensor not found' });
            res.json({ message: 'Sensor and all samples deleted', ...result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async clearSamples(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can clear samples' });
            }
            const result = await TelemetryService.clearSamples(req.params.gid);
            if (!result) return res.status(404).json({ error: 'Sensor not found' });
            res.json({ message: 'Samples cleared', ...result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async updateSensor(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can update sensors' });
            }
            const s = await TelemetryService.updateSensor(req.params.gid, req.body);
            if (!s) return res.status(404).json({ error: 'Sensor not found' });
            res.json(s);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async linkArtifact(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can link artifacts' });
            }
            const { artifactGid } = req.body;
            if (!artifactGid) return res.status(400).json({ error: 'artifactGid is required' });
            const s = await TelemetryService.linkArtifact(req.params.gid, artifactGid);
            if (!s) return res.status(404).json({ error: 'Sensor not found' });
            res.json(s);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async unlinkArtifact(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can unlink artifacts' });
            }
            const s = await TelemetryService.unlinkArtifact(req.params.gid, req.params.artifactGid);
            if (!s) return res.status(404).json({ error: 'Sensor not found' });
            res.json(s);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // ── Admin ingestion (no sensor key needed — JWT already authenticates) ──

    async adminIngestBatch(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can ingest via this endpoint' });
            }
            const sensor = await Sensor.findOne({ gid: req.params.gid });
            if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
            const { samples } = req.body;
            if (!Array.isArray(samples)) {
                return res.status(400).json({ error: 'samples must be an array' });
            }
            const result = await TelemetryService.ingestBatch(sensor, samples);
            res.status(201).json(result);
        } catch (err) {
            console.error('adminIngestBatch error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    async rotateKey(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can rotate sensor keys' });
            }
            const result = await TelemetryService.rotateKey(req.params.gid);
            if (!result) return res.status(404).json({ error: 'Sensor not found' });
            res.json({
                sensor: result.sensor,
                apiKey: result.apiKey,
                note: 'Store this apiKey securely. The previous key is now invalid and this new key will not be shown again.'
            });
        } catch (err) {
            console.error('rotateKey error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    async adminIngestCSV(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can ingest via this endpoint' });
            }
            if (!req.file) return res.status(400).json({ error: 'file field is required' });
            const sensor = await Sensor.findOne({ gid: req.params.gid });
            if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
            const csvText = req.file.buffer.toString('utf-8');
            const result = await TelemetryService.ingestCSV(sensor, csvText);
            res.status(201).json(result);
        } catch (err) {
            console.error('adminIngestCSV error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    // ── Sample ingestion (sensor-authenticated) ──────────────────────────

    /** POST /telemetry/samples — single-sample ingestion */
    async ingestSample(req, res) {
        try {
            const { temperature, humidity, lightKlux, timestamp } = req.body;
            if (!timestamp) {
                return res.status(400).json({ error: 'timestamp is required' });
            }
            const result = await TelemetryService.ingestBatch(req.sensor, [
                { timestamp, temperature, humidity, lightKlux }
            ]);
            if (result.rejected > 0) {
                return res.status(400).json(result);
            }
            res.status(201).json(result);
        } catch (err) {
            console.error('ingestSample error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /telemetry/samples/batch — batch ingestion */
    async ingestBatch(req, res) {
        try {
            const { samples } = req.body;
            if (!Array.isArray(samples)) {
                return res.status(400).json({ error: 'samples must be an array' });
            }
            if (samples.length > 10000) {
                return res.status(413).json({ error: 'Batch size exceeds 10000; split the upload.' });
            }
            const result = await TelemetryService.ingestBatch(req.sensor, samples);
            res.status(201).json(result);
        } catch (err) {
            console.error('ingestBatch error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /telemetry/samples/upload — CSV upload (multipart) */
    csvUploadMiddleware: csvUpload.single('file'),

    async ingestCSV(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'file field is required' });
            }
            const csvText = req.file.buffer.toString('utf-8');
            const result = await TelemetryService.ingestCSV(req.sensor, csvText);
            res.status(201).json(result);
        } catch (err) {
            console.error('ingestCSV error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /sensors/:gid/samples — per-sensor history.
     *
     * Query params: from, to (ISO timestamps); interval=raw|hourly|daily;
     * limit (max points returned by the aggregation pipeline).
     * Returns { samples, summary } in the same shape as the per-exhibit
     * endpoint, but scoped to a single sensor.
     */
    async getSensorSamples(req, res) {
        try {
            const sensor = await Sensor.findOne({ gid: req.params.gid });
            if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
            const { from, to, interval, limit } = req.query;
            const result = await TelemetryService.queryEnvironment([sensor._id], {
                from,
                to,
                interval: interval || 'raw',
                limit: limit ? Math.min(Number(limit), 50000) : 50000
            });
            res.json({ sensor: { gid: sensor.gid, name: sensor.name, channels: sensor.channels }, ...result });
        } catch (err) {
            console.error('getSensorSamples error:', err);
            res.status(500).json({ error: err.message });
        }
    }
};
