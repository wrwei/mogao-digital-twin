/**
 * Deterioration Router
 * Endpoints for heritage deterioration model calculations.
 */

const express = require('express');
const router = express.Router();
const DeteriorationController = require('../controllers/DeteriorationController');

// Combined assessment — all four models
router.post('/assess', DeteriorationController.assess);

// Individual models
router.post('/chemical', DeteriorationController.chemical);
router.post('/lifetime', DeteriorationController.lifetime);
router.post('/mould', DeteriorationController.mould);
router.post('/salt', DeteriorationController.salt);
router.post('/fatigue', DeteriorationController.fatigue);

// Default parameter sets
router.get('/defaults', DeteriorationController.defaults);

module.exports = router;
