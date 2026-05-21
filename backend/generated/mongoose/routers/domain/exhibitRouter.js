const express = require('express');
const router = express.Router();
const ExhibitController = require('../../controllers/domain/ExhibitController');

/**
 * Exhibit Routes
 * Cross-entity query endpoints for all exhibit types (Statue, Mural, Painting, Inscription).
 * Migrated from Micronaut EOL ExhibitOperations.
 *
 * GET    /                      - Get all exhibits across all types
 * GET    /critical              - Get exhibits in critical condition
 * GET    /with-defects          - Get exhibits that have defects
 * GET    /requiring-attention   - Get exhibits with critical/severe defects
 * GET    /status/:status        - Filter by conservation status
 * GET    /material/:material    - Filter by material
 * GET    /period/:period        - Filter by period
 * PUT    /:gid/inspection       - Record an inspection
 * PUT    /:gid/conservation-status - Update conservation status
 * PUT    /:gid/coordinates      - Set coordinates
 */

// Query endpoints (specific paths before parameterized)
router.get('/critical', ExhibitController.getCritical);
router.get('/with-defects', ExhibitController.getWithDefects);
router.get('/requiring-attention', ExhibitController.getRequiringAttention);
router.get('/status/:status', ExhibitController.getByStatus);
router.get('/material/:material', ExhibitController.getByMaterial);
router.get('/period/:period', ExhibitController.getByPeriod);
router.get('/', ExhibitController.getAll);

// Environment query (time-series T/RH/light for an exhibit)
router.get('/:gid/environment', ExhibitController.getEnvironment);

// Deterioration replay (historical damage integration + optional forecast)
router.get('/:gid/deterioration/replay', ExhibitController.replayDeterioration);

// Mutation endpoints
router.put('/:gid/inspection', ExhibitController.setInspection);
router.put('/:gid/conservation-status', ExhibitController.updateConservationStatus);
router.put('/:gid/coordinates', ExhibitController.setCoordinates);

// Defects: per-exhibit observation log
router.get('/:gid/defects',                   ExhibitController.listDefects);
router.post('/:gid/defects',                  ExhibitController.addDefect);
router.put('/:gid/defects/:defectGid',        ExhibitController.updateDefect);
router.delete('/:gid/defects/:defectGid',     ExhibitController.removeDefect);

module.exports = router;
