const express = require('express');
const router = express.Router();
const AssetReferenceController = require('../controllers/AssetReferenceController');

/**
 * AssetReference Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new AssetReference
 * GET    /              - Get all AssetReference documents
 * GET    /gid/:gid      - Get AssetReference by GID
 * PUT    /gid/:gid      - Update AssetReference by GID
 * DELETE /gid/:gid      - Delete AssetReference by GID
 * GET    /:id           - Get AssetReference by ID
 * PUT    /:id           - Update AssetReference by ID
 * DELETE /:id           - Delete AssetReference by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', AssetReferenceController.create);
router.get('/', AssetReferenceController.getAll);
router.get('/gid/:gid', AssetReferenceController.getByGid);
router.put('/gid/:gid', AssetReferenceController.updateByGid);
router.delete('/gid/:gid', AssetReferenceController.deleteByGid);
router.get('/:id', AssetReferenceController.getById);
router.put('/:id', AssetReferenceController.update);
router.delete('/:id', AssetReferenceController.delete);

module.exports = router;
