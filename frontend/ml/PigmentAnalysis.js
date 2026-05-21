/**
 * PigmentAnalysis — pigment-domain operations for the deterioration pipeline.
 *
 * Three responsibilities:
 *   1. Segment a texture into per-pixel pigment classes (delegates to PigmentIdentifier).
 *   2. Compute per-pigment Arrhenius parameters for a given environment.
 *   3. Apply those parameters to a texture via the off-thread worker.
 *
 * The pigment-deterioration worker and the PigmentIdentifier instance are
 * module-private singletons created lazily on first use.
 *
 * Stateless from the caller's perspective: callers pass inputs and receive
 * outputs; nothing about previous calls is retained except the worker /
 * identifier instances themselves.
 */
import { PigmentIdentifier } from './PigmentIdentifier.js';
import { PIGMENT_DATABASE, PIGMENT_NAMES } from './PigmentDatabase.js';

const R = 8.314;

let _identifier = null;
let _worker = null;

function getIdentifier() {
    if (!_identifier) _identifier = new PigmentIdentifier();
    return _identifier;
}

function getWorker() {
    if (!_worker) {
        _worker = new Worker('workers/pigment-deterioration-worker.js');
    }
    return _worker;
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
 * pigment-deterioration worker.
 *
 * Matches the formula in backend DeteriorationService.calculateRateConstant
 * but parameterised per pigment from PigmentDatabase rather than the
 * single-pigment defaults.
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

/**
 * Dispatch a per-pigment deterioration pass to the worker.
 * Buffers (pixelData, pigmentMap) are transferred ownership; the caller
 * must already have copied them if it needs to retain originals.
 *
 * @returns Promise resolving to { pixelData: ArrayBuffer, width, height }
 */
export function runDeteriorationWorker({ pixelData, pigmentMap, perPigmentParams, width, height, amplification = 3 }) {
    return new Promise((resolve, reject) => {
        const worker = getWorker();
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (err) => reject(err);
        worker.postMessage(
            { pixelData, pigmentMap, pigmentParams: perPigmentParams, width, height, amplification },
            [pixelData, pigmentMap]
        );
    });
}
