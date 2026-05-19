const express = require('express');
const router = express.Router();
const TemperatureController = require('../controllers/TemperatureController');

/**
 * Temperature Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Temperature
 * GET    /              - Get all Temperature documents
 * GET    /gid/:gid      - Get Temperature by GID
 * PUT    /gid/:gid      - Update Temperature by GID
 * DELETE /gid/:gid      - Delete Temperature by GID
 * GET    /:id           - Get Temperature by ID
 * PUT    /:id           - Update Temperature by ID
 * DELETE /:id           - Delete Temperature by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', TemperatureController.create);
router.get('/', TemperatureController.getAll);
router.get('/gid/:gid', TemperatureController.getByGid);
router.put('/gid/:gid', TemperatureController.updateByGid);
router.delete('/gid/:gid', TemperatureController.deleteByGid);
router.get('/:id', TemperatureController.getById);
router.put('/:id', TemperatureController.update);
router.delete('/:id', TemperatureController.delete);

module.exports = router;
