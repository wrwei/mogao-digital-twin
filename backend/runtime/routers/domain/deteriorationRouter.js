/**
 * Deterioration Router
 * Endpoints for heritage deterioration model calculations.
 */

const express = require('express');
const router = express.Router();
const DeteriorationController = require('../../controllers/domain/DeteriorationController');

// Combined assessment — all five models
router.post('/assess', DeteriorationController.assess);

// Per-zone spatial composite (Stage-1 capillary-rise moisture field)
router.post('/assess-field', DeteriorationController.assessField);

// Individual models
router.post('/chemical', DeteriorationController.chemical);
router.post('/lifetime', DeteriorationController.lifetime);
router.post('/mould', DeteriorationController.mould);
router.post('/salt', DeteriorationController.salt);
router.post('/fatigue', DeteriorationController.fatigue);

// Default parameter sets
router.get('/defaults', DeteriorationController.defaults);

module.exports = router;
