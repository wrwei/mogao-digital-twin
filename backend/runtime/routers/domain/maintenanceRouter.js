const express = require('express');
const router = express.Router();
const MaintenanceController = require('../../controllers/domain/MaintenanceController');

// Maintenance queue — all artifacts scored and sorted by priority
router.get('/queue',             MaintenanceController.queue);
router.get('/artifact/:gid',     MaintenanceController.artifactScore);

// Anomalies across the fleet
router.get('/anomalies',         MaintenanceController.allAnomalies);

module.exports = router;
