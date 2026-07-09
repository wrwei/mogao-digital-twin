/**
 * Deterioration Controller
 * Exposes deterioration model calculations as REST endpoints.
 */

const DeteriorationService = require('../../services/domain/DeteriorationService');

module.exports = {
    // POST /deterioration/assess — run all four models
    async assess(req, res) {
        try {
            const { T_celsius, RH_percent, light_klux, totalDays } = req.body;

            if (T_celsius == null || RH_percent == null || light_klux == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent, light_klux, totalDays'
                });
            }

            const result = DeteriorationService.assess(req.body);
            res.json(result);
        } catch (error) {
            console.error('Deterioration assess error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/assess-field — per-zone spatial composite (Stage 1).
    // Body: the assess() condition, plus optional `zones` array and `capillary`
    // tuning. Returns { zones: [...] } with a per-zone composite driven by a
    // capillary-rise moisture field and per-zone light exposure.
    async assessField(req, res) {
        try {
            const { T_celsius, RH_percent, light_klux, totalDays } = req.body;

            if (T_celsius == null || RH_percent == null || light_klux == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent, light_klux, totalDays'
                });
            }

            const { zones, grid, ...condition } = req.body;
            const result = DeteriorationService.compositeRiskField(condition, zones);
            const payload = { zones: result };
            // Optional (height x illumination) lookup grid for per-texel
            // Stage-2 rendering. Enabled with `grid: true` or `grid: {nH,nL}`.
            if (grid) {
                const nH = (grid.nH) || 8;
                const nL = (grid.nL) || 8;
                payload.grid = DeteriorationService.compositeRiskGrid(condition, nH, nL);
            }
            res.json(payload);
        } catch (error) {
            console.error('Deterioration assess-field error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/chemical — chemical pigment fading only
    async chemical(req, res) {
        try {
            const { T_celsius, RH_percent, light_klux, totalDays, params } = req.body;

            if (T_celsius == null || RH_percent == null || light_klux == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent, light_klux, totalDays'
                });
            }

            const result = DeteriorationService.chemicalFading(T_celsius, RH_percent, light_klux, totalDays, params);
            res.json(result);
        } catch (error) {
            console.error('Chemical fading error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/lifetime — Michalski lifetime multiplier only.
    // totalDays is optional; when provided, the response's visualEffect.intensity
    // reflects the equivalent ageing at reference conditions.
    async lifetime(req, res) {
        try {
            const { T_celsius, RH_percent, totalDays = 0, params } = req.body;

            if (T_celsius == null || RH_percent == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent'
                });
            }

            const result = DeteriorationService.lifetimeMultiplier(T_celsius, RH_percent, totalDays, params);
            res.json(result);
        } catch (error) {
            console.error('Lifetime multiplier error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/mould — VTT mould growth only
    async mould(req, res) {
        try {
            const { T_celsius, RH_percent, totalDays, prevMouldIndex, params } = req.body;

            if (T_celsius == null || RH_percent == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent, totalDays'
                });
            }

            const result = DeteriorationService.mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex, params);
            res.json(result);
        } catch (error) {
            console.error('Mould growth error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/salt — salt crystallization only
    async salt(req, res) {
        try {
            const { T_celsius, RH_percent, totalDays, params, RH_amplitude } = req.body;

            if (T_celsius == null || RH_percent == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: T_celsius, RH_percent, totalDays'
                });
            }

            const result = DeteriorationService.saltCrystallization(
                T_celsius, RH_percent, totalDays, params, RH_amplitude || 0
            );
            res.json(result);
        } catch (error) {
            console.error('Salt crystallization error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /deterioration/fatigue — hygro-mechanical fatigue only
    async fatigue(req, res) {
        try {
            const { RH_amplitude, totalDays, params } = req.body;
            if (RH_amplitude == null || totalDays == null) {
                return res.status(400).json({
                    error: 'Missing required parameters: RH_amplitude, totalDays'
                });
            }
            const result = DeteriorationService.fatigueDamage(RH_amplitude, totalDays, params);
            res.json(result);
        } catch (error) {
            console.error('Fatigue damage error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // GET /deterioration/defaults — return default parameter sets
    async defaults(req, res) {
        res.json({
            chemical: DeteriorationService.CHEMICAL_DEFAULTS,
            lifetime: DeteriorationService.LIFETIME_DEFAULTS,
            mould: DeteriorationService.MOULD_DEFAULTS,
            salt: DeteriorationService.SALT_DEFAULTS,
            fatigue: DeteriorationService.FATIGUE_DEFAULTS
        });
    }
};
