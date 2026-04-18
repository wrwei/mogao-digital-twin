/**
 * Telemetry Router
 *
 * Two authentication regimes:
 *   - /sensors (admin CRUD) uses the normal authMiddleware (JWT-based)
 *   - /samples (data ingestion) uses sensorAuth (X-Sensor-Key header)
 *
 * The sensor-authenticated routes are mounted FIRST in app.js, before the
 * global authMiddleware, so the sensor key alone is sufficient for ingestion.
 */

const express = require('express');
const TelemetryController = require('../controllers/TelemetryController');
const { sensorAuth } = require('../middleware/sensorAuth');

// ── Sensor-authenticated router (for loggers pushing data) ───────────────
const sensorRouter = express.Router();
sensorRouter.use(sensorAuth);
sensorRouter.post('/samples',        TelemetryController.ingestSample);
sensorRouter.post('/samples/batch',  TelemetryController.ingestBatch);
sensorRouter.post(
    '/samples/upload',
    TelemetryController.csvUploadMiddleware,
    TelemetryController.ingestCSV
);

// ── Admin-authenticated router (for sensor management) ──────────────────
const adminRouter = express.Router();
adminRouter.post('/',          TelemetryController.registerSensor);
adminRouter.get('/',           TelemetryController.listSensors);
adminRouter.get('/:gid',       TelemetryController.getSensor);
adminRouter.delete('/:gid',    TelemetryController.deactivateSensor);

module.exports = { sensorRouter, adminRouter };
