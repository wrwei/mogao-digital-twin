/**
 * Deterioration Engine
 * Modular heritage deterioration models based on peer-reviewed conservation science.
 *
 * Models implemented:
 *   1. Chemical pigment fading  (Arrhenius + first-order kinetics, Paltakari-Karlsson isotherm)
 *   2. Michalski lifetime multiplier (Climate for Culture eLM variant)
 *   3. VTT / Finnish mould growth model (Hukka & Viitanen 1999)
 *
 * References:
 *   - Strlič et al. 2015, Heritage Science 3:40
 *   - Michalski 2002, CCI
 *   - Leissner et al. 2015, Heritage Science 3:38  (eLM)
 *   - Hukka & Viitanen 1999, Wood Sci. Technol. 33:475
 *   - Johnston-Feller et al. 1984, JAIC 23(2):114
 */

// ── Constants ────────────────────────────────────────────────────────────────
const R = 8.314; // Universal gas constant, J/(mol·K)

// ── Default parameter sets ───────────────────────────────────────────────────

export const CHEMICAL_DEFAULTS = {
    Ea_dark: 70000,     // J/mol — activation energy, dark oxidation (linseed oil)
    Ea_light: 25000,    // J/mol — activation energy, photofading
    k0_dark: 0.0001,    // Pre-exponential factor, dark ageing
    k0_light: 0.001,    // Pre-exponential factor, light fading
    q: 0.8,             // Reaction order w.r.t. water
    p: 0.9              // Light reciprocity exponent
};

export const LIFETIME_DEFAULTS = {
    Ea: 70000,          // J/mol — activation energy
    n: 1.3,             // Humidity exponent (Climate for Culture)
    T0: 20,             // Reference temperature °C
    RH0: 50             // Reference humidity %
};

export const MOULD_DEFAULTS = {
    growthCoeff: 0.13,  // Growth rate coefficient
    declineRate: -0.128 // Decline rate per day when dry
};

// ── Moisture helpers ─────────────────────────────────────────────────────────

/**
 * Paltakari-Karlsson sorption isotherm — equilibrium moisture content.
 * [H₂O] = |ln(1 − RH) / (1.67·T − 285.655)|^(1/(2.491 − 0.012·T))
 *
 * @param {number} RH_fraction  Relative humidity as 0-1
 * @param {number} T_kelvin     Absolute temperature in K
 * @returns {number} Dimensionless moisture content proxy
 */
export function calculateMoistureContent(RH_fraction, T_kelvin) {
    const RH_safe = Math.min(Math.max(RH_fraction, 0.01), 0.999);
    const numerator = Math.log(1 - RH_safe);
    const denominator = 1.67 * T_kelvin - 285.655;
    const base = Math.abs(numerator / denominator);
    const exponent = 1 / (2.491 - 0.012 * T_kelvin);
    return Math.pow(base, exponent);
}

// ── 1. Chemical Pigment Fading ───────────────────────────────────────────────

/**
 * Composite rate constant for chemical pigment degradation.
 * k = k_dark + k_light
 * k_dark  = k0_dark  · [H₂O]^q · exp(−Ea_dark  / RT)
 * k_light = k0_light · I^p      · [H₂O]^q · exp(−Ea_light / RT)
 *
 * @param {number} T_celsius   Temperature in °C
 * @param {number} RH_percent  Relative humidity in %
 * @param {number} light_klux  Light intensity in klux (0 = dark storage)
 * @param {object} [params]    Optional parameter overrides
 * @returns {number} Rate constant per day
 */
export function calculateRateConstant(T_celsius, RH_percent, light_klux, params = {}) {
    const T_kelvin = T_celsius + 273.15;
    const RH_fraction = RH_percent / 100.0;

    const { Ea_dark, Ea_light, k0_dark, k0_light, q, p } = { ...CHEMICAL_DEFAULTS, ...params };

    const H2O = calculateMoistureContent(RH_fraction, T_kelvin);

    const k_dark = k0_dark * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_dark / (R * T_kelvin));
    const k_light = light_klux > 0
        ? k0_light * Math.pow(light_klux, p) * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_light / (R * T_kelvin))
        : 0;

    return k_dark + k_light;
}

/**
 * Chemical fading assessment.
 *
 * @param {number} T_celsius
 * @param {number} RH_percent
 * @param {number} light_klux
 * @param {number} totalDays   Total exposure in days
 * @param {object} [params]    Optional parameter overrides
 * @returns {{ rateConstant: number, degradationFactor: number, scientificDegradation: number,
 *             risk: number, label: string, visualEffect: object }}
 */
export function chemicalFading(T_celsius, RH_percent, light_klux, totalDays, params = {}) {
    const rateConstant = calculateRateConstant(T_celsius, RH_percent, light_klux, params);
    const degradationFactor = Math.exp(-rateConstant * totalDays);
    const scientificDegradation = (1 - degradationFactor) * 100;

    let label = 'low';
    if (scientificDegradation > 50) label = 'critical';
    else if (scientificDegradation > 20) label = 'high';
    else if (scientificDegradation > 5) label = 'moderate';

    return {
        rateConstant,
        degradationFactor,
        scientificDegradation,
        risk: Math.min(100, scientificDegradation),
        label,
        visualEffect: {
            fadeFactor: degradationFactor,
            type: 'chemical'
        }
    };
}

// ── 2. Michalski Lifetime Multiplier ─────────────────────────────────────────

/**
 * Climate for Culture equivalent Lifetime Multiplier (eLM).
 *   LM = exp[(Ea/R)·(1/T − 1/T₀)] · (RH₀/RH)^n
 *
 * LM > 1 means the object lasts longer than at reference conditions.
 * LM < 1 means it degrades faster.
 *
 * @param {number} T_celsius
 * @param {number} RH_percent
 * @param {object} [params]  Optional parameter overrides
 * @returns {{ multiplier: number, label: string, color: string }}
 */
export function lifetimeMultiplier(T_celsius, RH_percent, params = {}) {
    const { Ea, n, T0, RH0 } = { ...LIFETIME_DEFAULTS, ...params };

    const T_kelvin = T_celsius + 273.15;
    const T0_kelvin = T0 + 273.15;

    const tempFactor = Math.exp((Ea / R) * (1 / T_kelvin - 1 / T0_kelvin));
    const rhFactor = Math.pow(RH0 / Math.max(RH_percent, 1), n);
    const multiplier = tempFactor * rhFactor;

    let color, label;
    if (multiplier >= 1.0) {
        color = '#10b981'; // green
        label = 'longer';
    } else if (multiplier >= 0.5) {
        color = '#f59e0b'; // orange
        label = 'shorter';
    } else {
        color = '#ef4444'; // red
        label = 'shorter';
    }

    return { multiplier, label, color };
}

// ── 3. VTT / Finnish Mould Growth Model ──────────────────────────────────────

/**
 * Critical RH threshold below which no mould grows.
 *   RH_crit = −0.0026·T³ + 0.160·T² − 3.13·T + 100.0
 * Valid for T = 0-50 °C.
 *
 * @param {number} T_celsius
 * @returns {number} Critical RH in %
 */
export function mouldCriticalRH(T_celsius) {
    const T = Math.max(0, Math.min(50, T_celsius));
    return -0.0026 * T * T * T + 0.160 * T * T - 3.13 * T + 100.0;
}

/**
 * VTT mould growth assessment.
 *
 * @param {number} T_celsius
 * @param {number} RH_percent
 * @param {number} totalDays   Cumulative exposure time
 * @param {number} [prevMouldIndex=0]  Running mould index (for incremental updates)
 * @param {object} [params]    Optional parameter overrides
 * @returns {{ mouldIndex: number, rhCritical: number, isAboveThreshold: boolean,
 *             risk: number, label: string, growthRate: number,
 *             visualEffect: { coverage: number, intensity: number } }}
 */
export function mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex = 0, params = {}) {
    const { growthCoeff, declineRate } = { ...MOULD_DEFAULTS, ...params };

    const rhCritical = mouldCriticalRH(T_celsius);
    const isAboveThreshold = RH_percent >= rhCritical;

    // Growth / decline rate per day
    let growthRate = 0;
    if (isAboveThreshold && T_celsius > 0) {
        const rhExcess = (RH_percent - rhCritical) / 100;
        const tempScale = T_celsius / 20;
        growthRate = rhExcess * tempScale * growthCoeff;
    } else {
        growthRate = declineRate;
    }

    // For static (non-incremental) mode, compute M from scratch
    let mouldIndex;
    if (prevMouldIndex === 0 && totalDays > 0 && isAboveThreshold) {
        mouldIndex = Math.min(6, growthRate * totalDays);
    } else {
        mouldIndex = prevMouldIndex;
    }
    mouldIndex = Math.max(0, Math.min(6, mouldIndex));

    const risk = (mouldIndex / 6) * 100;
    let label = 'low';
    if (mouldIndex >= 4) label = 'critical';
    else if (mouldIndex >= 2) label = 'high';
    else if (mouldIndex >= 1) label = 'moderate';

    return {
        mouldIndex,
        rhCritical: Math.round(rhCritical * 10) / 10,
        isAboveThreshold,
        risk,
        label,
        growthRate,
        visualEffect: {
            coverage: mouldIndex / 6,    // 0-1
            intensity: Math.min(1, mouldIndex / 4), // saturates at M=4
            type: 'mould'
        }
    };
}

// ── Combined assessment ──────────────────────────────────────────────────────

/**
 * Run all deterioration models and return combined results.
 *
 * @param {object} params
 * @param {number} params.T_celsius
 * @param {number} params.RH_percent
 * @param {number} params.light_klux
 * @param {number} params.totalDays
 * @param {number} [params.prevMouldIndex=0]
 * @param {object} [params.chemicalParams]   Chemical model overrides
 * @param {object} [params.lifetimeParams]   Lifetime model overrides
 * @param {object} [params.mouldParams]      Mould model overrides
 * @returns {{ chemical: object, lifetime: object, mould: object }}
 */
export function assess(params) {
    const {
        T_celsius, RH_percent, light_klux, totalDays,
        prevMouldIndex = 0,
        chemicalParams = {},
        lifetimeParams = {},
        mouldParams = {}
    } = params;

    return {
        chemical: chemicalFading(T_celsius, RH_percent, light_klux, totalDays, chemicalParams),
        lifetime: lifetimeMultiplier(T_celsius, RH_percent, lifetimeParams),
        mould: mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex, mouldParams)
    };
}
