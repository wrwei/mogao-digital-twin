const express = require('express');
const router = express.Router();
const ParameterController = require('../controllers/ParameterController');

/**
 * Parameter Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new Parameter
 * GET    /              - Get all Parameter documents
 * GET    /gid/:gid      - Get Parameter by GID
 * PUT    /gid/:gid      - Update Parameter by GID
 * DELETE /gid/:gid      - Delete Parameter by GID
 * GET    /:id           - Get Parameter by ID
 * PUT    /:id           - Update Parameter by ID
 * DELETE /:id           - Delete Parameter by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', ParameterController.create);
router.get('/', ParameterController.getAll);
router.get('/gid/:gid', ParameterController.getByGid);
router.put('/gid/:gid', ParameterController.updateByGid);
router.delete('/gid/:gid', ParameterController.deleteByGid);
router.get('/:id', ParameterController.getById);
router.put('/:id', ParameterController.update);
router.delete('/:id', ParameterController.delete);

module.exports = router;
