const multer = require('multer');
const TelemetryService = require('../services/TelemetryService');

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
    }
};
