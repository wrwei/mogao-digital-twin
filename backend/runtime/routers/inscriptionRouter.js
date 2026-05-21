const express = require('express');
const router = express.Router();
const InscriptionController = require('../controllers/InscriptionController');

/**
 * Inscription Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Inscription
 * GET    /              - Get all Inscription documents
 * GET    /gid/:gid      - Get Inscription by GID
 * PUT    /gid/:gid      - Update Inscription by GID
 * DELETE /gid/:gid      - Delete Inscription by GID
 * GET    /:id           - Get Inscription by ID
 * PUT    /:id           - Update Inscription by ID
 * DELETE /:id           - Delete Inscription by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', InscriptionController.create);
router.get('/', InscriptionController.getAll);
router.get('/gid/:gid', InscriptionController.getByGid);
router.put('/gid/:gid', InscriptionController.updateByGid);
router.delete('/gid/:gid', InscriptionController.deleteByGid);
router.get('/:id', InscriptionController.getById);
router.put('/:id', InscriptionController.update);
router.delete('/:id', InscriptionController.delete);

module.exports = router;
