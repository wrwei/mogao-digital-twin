/**
 * Snapshot Router — camera-frame ingestion + retrieval.
 *
 * Same two-track authentication as Telemetry:
 *   - sensorRouter (POST /ingest)  — X-Sensor-Key (camera-side push)
 *   - adminRouter  (everything else) — JWT (conservator UI / admin)
 *
 * The sensorRouter is mounted before the global authMiddleware in app.js;
 * the adminRouter sits behind it.
 */

const express = require('express');
const SnapshotController = require('../../controllers/domain/SnapshotController');
const { sensorAuth } = require('../../middleware/sensorAuth');

// ── Camera-authenticated router (cameras push frames) ───────────────────
// Mounted at /snapshots/ingest in app.js so the X-Sensor-Key gate only
// applies to the push path, not to admin reads under /snapshots.
const sensorRouter = express.Router();
sensorRouter.use(sensorAuth);
sensorRouter.post(
    '/',
    SnapshotController.frameUploadMiddleware,
    SnapshotController.ingestFrame
);

// ── Public image-serve router ───────────────────────────────────────────
// Binary assets follow the /exhibit_models pattern: served without JWT so
// `<img src="...">` works directly. Mounted before authMiddleware in app.js.
// (Production deployments should front this with signed URLs or a proxy.)
const publicRouter = express.Router();
publicRouter.get('/:gid/image', SnapshotController.serveImage);

// ── JWT-authenticated router (UI list / delete) ─────────────────────────
const adminRouter = express.Router();
adminRouter.get('/',        SnapshotController.listForArtefact);
adminRouter.delete('/:gid', SnapshotController.deleteSnapshot);

module.exports = { sensorRouter, publicRouter, adminRouter };
