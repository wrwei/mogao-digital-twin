const express = require('express');
const router = express.Router();
const HumidityController = require('../controllers/HumidityController');

/**
 * Humidity Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Humidity
 * GET    /              - Get all Humidity documents
 * GET    /gid/:gid      - Get Humidity by GID
 * PUT    /gid/:gid      - Update Humidity by GID
 * DELETE /gid/:gid      - Delete Humidity by GID
 * GET    /:id           - Get Humidity by ID
 * PUT    /:id           - Update Humidity by ID
 * DELETE /:id           - Delete Humidity by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', HumidityController.create);
router.get('/', HumidityController.getAll);
router.get('/gid/:gid', HumidityController.getByGid);
router.put('/gid/:gid', HumidityController.updateByGid);
router.delete('/gid/:gid', HumidityController.deleteByGid);
router.get('/:id', HumidityController.getById);
router.put('/:id', HumidityController.update);
router.delete('/:id', HumidityController.delete);

module.exports = router;
