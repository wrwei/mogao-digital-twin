const express = require('express');
const router = express.Router();
const DTPackageController = require('../controllers/DTPackageController');

/**
 * DTPackage Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new DTPackage
 * GET    /              - Get all DTPackage documents
 * GET    /gid/:gid      - Get DTPackage by GID
 * PUT    /gid/:gid      - Update DTPackage by GID
 * DELETE /gid/:gid      - Delete DTPackage by GID
 * GET    /:id           - Get DTPackage by ID
 * PUT    /:id           - Update DTPackage by ID
 * DELETE /:id           - Delete DTPackage by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', DTPackageController.create);
router.get('/', DTPackageController.getAll);
router.get('/gid/:gid', DTPackageController.getByGid);
router.put('/gid/:gid', DTPackageController.updateByGid);
router.delete('/gid/:gid', DTPackageController.deleteByGid);
router.get('/:id', DTPackageController.getById);
router.put('/:id', DTPackageController.update);
router.delete('/:id', DTPackageController.delete);

module.exports = router;
