const express = require('express');
const router = express.Router();
const MuralController = require('../controllers/MuralController');

/**
 * Mural Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Mural
 * GET    /              - Get all Mural documents
 * GET    /gid/:gid      - Get Mural by GID
 * PUT    /gid/:gid      - Update Mural by GID
 * DELETE /gid/:gid      - Delete Mural by GID
 * GET    /:id           - Get Mural by ID
 * PUT    /:id           - Update Mural by ID
 * DELETE /:id           - Delete Mural by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', MuralController.create);
router.get('/', MuralController.getAll);
router.get('/gid/:gid', MuralController.getByGid);
router.put('/gid/:gid', MuralController.updateByGid);
router.delete('/gid/:gid', MuralController.deleteByGid);
router.get('/:id', MuralController.getById);
router.put('/:id', MuralController.update);
router.delete('/:id', MuralController.delete);

module.exports = router;
