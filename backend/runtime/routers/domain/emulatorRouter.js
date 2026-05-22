/**
 * Emulator Router — admin-only synthetic data control plane.
 *
 * Mounted at /emulator behind the global authMiddleware (admin gate is
 * enforced in the controller, like MaintenanceController).
 */

const express = require('express');
const EmulatorController = require('../../controllers/domain/EmulatorController');

const router = express.Router();
router.get('/status',                        EmulatorController.status);
router.post('/sensors/:gid/start',           EmulatorController.start);
router.post('/sensors/:gid/stop',            EmulatorController.stop);
router.patch('/sensors/:gid/config',         EmulatorController.updateConfig);
router.post('/sensors/:gid/catchup',         EmulatorController.catchup);

module.exports = router;
