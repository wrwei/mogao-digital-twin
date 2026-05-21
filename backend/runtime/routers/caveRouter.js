const express = require('express');
const router = express.Router();
const CaveController = require('../controllers/CaveController');

/**
 * Cave Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Cave
 * GET    /              - Get all Cave documents
 * GET    /gid/:gid      - Get Cave by GID
 * PUT    /gid/:gid      - Update Cave by GID
 * DELETE /gid/:gid      - Delete Cave by GID
 * GET    /:id           - Get Cave by ID
 * PUT    /:id           - Update Cave by ID
 * DELETE /:id           - Delete Cave by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', CaveController.create);
router.get('/', CaveController.getAll);
router.get('/gid/:gid', CaveController.getByGid);
router.put('/gid/:gid', CaveController.updateByGid);
router.delete('/gid/:gid', CaveController.deleteByGid);
router.get('/:id', CaveController.getById);
router.put('/:id', CaveController.update);
router.delete('/:id', CaveController.delete);

module.exports = router;
