const express = require('express');
const router = express.Router();
const CoordinatesController = require('../controllers/CoordinatesController');

/**
 * Coordinates Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Coordinates
 * GET    /              - Get all Coordinates documents
 * GET    /gid/:gid      - Get Coordinates by GID
 * PUT    /gid/:gid      - Update Coordinates by GID
 * DELETE /gid/:gid      - Delete Coordinates by GID
 * GET    /:id           - Get Coordinates by ID
 * PUT    /:id           - Update Coordinates by ID
 * DELETE /:id           - Delete Coordinates by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', CoordinatesController.create);
router.get('/', CoordinatesController.getAll);
router.get('/gid/:gid', CoordinatesController.getByGid);
router.put('/gid/:gid', CoordinatesController.updateByGid);
router.delete('/gid/:gid', CoordinatesController.deleteByGid);
router.get('/:id', CoordinatesController.getById);
router.put('/:id', CoordinatesController.update);
router.delete('/:id', CoordinatesController.delete);

module.exports = router;
