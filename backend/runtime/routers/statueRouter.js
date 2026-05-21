const express = require('express');
const router = express.Router();
const StatueController = require('../controllers/StatueController');

/**
 * Statue Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Statue
 * GET    /              - Get all Statue documents
 * GET    /gid/:gid      - Get Statue by GID
 * PUT    /gid/:gid      - Update Statue by GID
 * DELETE /gid/:gid      - Delete Statue by GID
 * GET    /:id           - Get Statue by ID
 * PUT    /:id           - Update Statue by ID
 * DELETE /:id           - Delete Statue by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', StatueController.create);
router.get('/', StatueController.getAll);
router.get('/gid/:gid', StatueController.getByGid);
router.put('/gid/:gid', StatueController.updateByGid);
router.delete('/gid/:gid', StatueController.deleteByGid);
router.get('/:id', StatueController.getById);
router.put('/:id', StatueController.update);
router.delete('/:id', StatueController.delete);

module.exports = router;
