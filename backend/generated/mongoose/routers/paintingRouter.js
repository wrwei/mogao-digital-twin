const express = require('express');
const router = express.Router();
const PaintingController = require('../controllers/PaintingController');

/**
 * Painting Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Painting
 * GET    /              - Get all Painting documents
 * GET    /gid/:gid      - Get Painting by GID
 * PUT    /gid/:gid      - Update Painting by GID
 * DELETE /gid/:gid      - Delete Painting by GID
 * GET    /:id           - Get Painting by ID
 * PUT    /:id           - Update Painting by ID
 * DELETE /:id           - Delete Painting by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', PaintingController.create);
router.get('/', PaintingController.getAll);
router.get('/gid/:gid', PaintingController.getByGid);
router.put('/gid/:gid', PaintingController.updateByGid);
router.delete('/gid/:gid', PaintingController.deleteByGid);
router.get('/:id', PaintingController.getById);
router.put('/:id', PaintingController.update);
router.delete('/:id', PaintingController.delete);

module.exports = router;
