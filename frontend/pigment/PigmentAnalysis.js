/**
 * PigmentAnalysis — pigment-domain operations consumed by the
 * deterioration pipeline.
 *
 * Two responsibilities:
 *   1. Segment a texture into per-pixel pigment classes (HSV decision
 *      tree, delegates to PigmentIdentifier).
 *   2. Compute per-pigment Arrhenius parameters for a given environment.
 *      The output object is the `perPigmentParams` payload that
 *      DeteriorationRenderer's `chemical-pigment` mode consumes.
 *
 * The PigmentIdentifier instance is a module-private singleton created
 * lazily on first use. Per-pixel rendering happens off-thread in
 * `frontend/workers/effects-worker.js` via DeteriorationRenderer —
 * this module does not own a Web Worker.
 */
import { PigmentIdentifier } from './PigmentIdentifier.js';
import { PIGMENT_DATABASE, PIGMENT_NAMES } from './PigmentDatabase.js';

const R = 8.314;

let _identifier = null;

function getIdentifier() {
    if (!_identifier) _identifier = new PigmentIdentifier();
    return _identifier;
}

/**
 * Segment a texture into pigment classes.
 * @returns Promise resolving to { pigmentMap, pigmentNames, confidence, regionSummary }
 */
export async function identifyPigments(pixelData, width, height) {
    return getIdentifier().identify(pixelData, width, height);
}

/**
 * Compute per-pigment Arrhenius rate constants and resulting degradation
 * factor for the given environment, returning a payload shaped for the
 * effects worker's `chemical-pigment` mode.
 *
 * Matches the formula in backend DeteriorationService.calculateRateConstant
 * but parameterised per pigment from PigmentDatabase rather than the
 * single-pigment defaults. The duplication is deliberate: this runs
 * client-side so per-pixel rendering doesn't need a network round-trip.
 *
 * @param env { T_celsius, RH_percent, light_klux, totalDays }
 * @returns { [pigmentId]: { degradationFactor, targetRGB, fadedRGB, agingTint } }
 */
export function computePerPigmentParams({ T_celsius, RH_percent, light_klux, totalDays }) {
    const T = T_celsius + 273.15;
    const RH = RH_percent / 100;
    const params = {};

    for (const name of PIGMENT_NAMES) {
        const p = PIGMENT_DATABASE[name];
        const H2O = Math.pow(
            Math.abs(Math.log(1 - Math.min(RH, 0.999)) / (1.67 * T - 285.655)),
            1 / (2.491 - 0.012 * T)
        );
        const k_dark = p.k0_dark * Math.pow(Math.abs(H2O), p.q) * Math.exp(-p.Ea_dark / (R * T));
        const k_light = light_klux > 0
            ? p.k0_light * Math.pow(light_klux, p.p) * Math.pow(Math.abs(H2O), p.q) * Math.exp(-p.Ea_light / (R * T))
            : 0;
        const k = k_dark + k_light;
        params[p.id] = {
            degradationFactor: Math.exp(-k * totalDays),
            fadedRGB: p.fadedRGB,
            targetRGB: p.targetRGB,
            agingTint: p.agingTint || null
        };
    }

    return params;
}
