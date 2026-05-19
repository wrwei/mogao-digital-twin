const express = require('express');
const router = express.Router();
const LightIntensityController = require('../controllers/LightIntensityController');

/**
 * LightIntensity Routes
 * Auto-generated from mogao_dt.ecore metamodel
 *
 * POST   /              - Create a new LightIntensity
 * GET    /              - Get all LightIntensity documents
 * GET    /gid/:gid      - Get LightIntensity by GID
 * PUT    /gid/:gid      - Update LightIntensity by GID
 * DELETE /gid/:gid      - Delete LightIntensity by GID
 * GET    /:id           - Get LightIntensity by ID
 * PUT    /:id           - Update LightIntensity by ID
 * DELETE /:id           - Delete LightIntensity by ID
 *
 * The /gid/:gid routes are registered BEFORE the /:id routes so that
 * Express does not interpret the literal string "gid" as a Mongo ObjectId.
 */

router.post('/', LightIntensityController.create);
router.get('/', LightIntensityController.getAll);
router.get('/gid/:gid', LightIntensityController.getByGid);
router.put('/gid/:gid', LightIntensityController.updateByGid);
router.delete('/gid/:gid', LightIntensityController.deleteByGid);
router.get('/:id', LightIntensityController.getById);
router.put('/:id', LightIntensityController.update);
router.delete('/:id', LightIntensityController.delete);

module.exports = router;
