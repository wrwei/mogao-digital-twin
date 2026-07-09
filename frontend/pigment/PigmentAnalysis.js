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
 * Per-pigment Arrhenius rate constant — Paltakari–Karlsson sorption
 * isotherm × Arrhenius temperature factor × light factor. Identical
 * structure to the backend's `calculateRateConstant` in
 * backend/runtime/services/domain/DeteriorationService.js — kept in
 * lockstep deliberately. If you change the equation in one place,
 * change it in the other.
 */
function _arrheniusRateConstant(p, T_kelvin, RH_fraction, light_klux) {
    // Paltakari–Karlsson isotherm evaluated in CELSIUS (see backend
    // DeteriorationService.calculateMoistureContent for the unit rationale);
    // the base is positive only for T < 171, i.e. the Celsius range.
    const T_celsius = T_kelvin - 273.15;
    const H2O = Math.pow(
        Math.log(1 - Math.min(RH_fraction, 0.999)) / (1.67 * T_celsius - 285.655),
        1 / (2.491 - 0.012 * T_celsius)
    );
    const k_dark = p.k0_dark * Math.pow(H2O, p.q) * Math.exp(-p.Ea_dark / (R * T_kelvin));
    const k_light = light_klux > 0
        ? p.k0_light * Math.pow(light_klux, p.p) * Math.pow(H2O, p.q) * Math.exp(-p.Ea_light / (R * T_kelvin))
        : 0;
    return k_dark + k_light;
}

/**
 * Compute per-pigment Arrhenius rate constants and resulting degradation
 * factor for the given environment. The output payload is what the
 * effects worker's `chemical-pigment` mode consumes for per-pixel fading.
 *
 * Runs client-side so the renderer doesn't need a network round-trip
 * on every slider drag. The math mirrors the single-pigment backend
 * implementation (see DeteriorationService.calculateRateConstant)
 * but iterates over every PigmentDatabase entry instead of using the
 * single CHEMICAL_DEFAULTS block.
 *
 * @param env { T_celsius, RH_percent, light_klux, totalDays }
 * @returns { [pigmentId]: { degradationFactor, targetRGB, fadedRGB, agingTint } }
 */
export function computePerPigmentParams({ T_celsius, RH_percent, light_klux, totalDays }) {
    const T_kelvin = T_celsius + 273.15;
    const RH_fraction = RH_percent / 100;
    const params = {};

    for (const name of PIGMENT_NAMES) {
        const p = PIGMENT_DATABASE[name];
        const k = _arrheniusRateConstant(p, T_kelvin, RH_fraction, light_klux);
        params[p.id] = {
            degradationFactor: Math.exp(-k * totalDays),
            fadedRGB: p.fadedRGB,
            targetRGB: p.targetRGB,
            agingTint: p.agingTint || null
        };
    }

    return params;
}
