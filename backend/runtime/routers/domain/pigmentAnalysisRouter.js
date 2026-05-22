/**
 * Pigment Analysis Router — persistence + retrieval of the per-artefact
 * pigment-class segmentation.
 *
 * Two tracks (matches Snapshot's pattern):
 *   - publicRouter (GET /:artifactGid/map)  — binary serve, no JWT, so the
 *     frontend can `fetch` the bytes the same way it loads /exhibit_models.
 *   - adminRouter  (GET / list, POST upsert, DELETE)  — JWT required.
 *
 * Mounted in app.js: the public router goes before authMiddleware so the
 * map-binary route is reachable; the admin router sits behind it.
 */

const express = require('express');
const PigmentAnalysisController = require('../../controllers/domain/PigmentAnalysisController');

// Public: serve the binary pigmentMap so `fetch` works without a JWT.
const publicRouter = express.Router();
publicRouter.get('/:artifactGid/map', PigmentAnalysisController.serveMap);

// JWT-protected: get metadata, upsert, delete.
const adminRouter = express.Router();
adminRouter.get('/',                       PigmentAnalysisController.get);
adminRouter.post('/',
    PigmentAnalysisController.mapUploadMiddleware,
    PigmentAnalysisController.save);
adminRouter.delete('/:artifactGid',        PigmentAnalysisController.remove);

module.exports = { publicRouter, adminRouter };
