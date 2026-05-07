const express = require('express');
const router = express.Router();
const DefectController = require('../controllers/DefectController');

/**
 * Defect Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Defect
 * GET    /              - Get all Defect documents
 * GET    /gid/:gid      - Get Defect by GID
 * PUT    /gid/:gid      - Update Defect by GID
 * DELETE /gid/:gid      - Delete Defect by GID
 * GET    /:id           - Get Defect by ID
 * PUT    /:id           - Update Defect by ID
 * DELETE /:id           - Delete Defect by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', DefectController.create);
router.get('/', DefectController.getAll);
router.get('/gid/:gid', DefectController.getByGid);
router.put('/gid/:gid', DefectController.updateByGid);
router.delete('/gid/:gid', DefectController.deleteByGid);
router.get('/:id', DefectController.getById);
router.put('/:id', DefectController.update);
router.delete('/:id', DefectController.delete);

module.exports = router;
