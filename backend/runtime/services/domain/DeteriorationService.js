/**
 * Deterioration Service
 * Modular heritage deterioration models based on peer-reviewed conservation science.
 *
 * Models:
 *   1. Chemical pigment fading  (Arrhenius + first-order kinetics, Paltakari-Karlsson isotherm)
 *   2. Michalski lifetime multiplier (Climate for Culture eLM variant)
 *   3. VTT / Finnish mould growth model (Hukka & Viitanen 1999)
 *   4. Salt crystallization pressure (Scherer 1999 / Steiger 2005)
 *
 * References:
 *   - Strlič et al. 2015, Heritage Science 3:40
 *   - Michalski 2002, CCI
 *   - Leissner et al. 2015, Heritage Science 3:38 (eLM)
 *   - Hukka & Viitanen 1999, Wood Sci. Technol. 33:475
 *   - Johnston-Feller et al. 1984, JAIC 23(2):114
 *   - Scherer, G.W. 1999, Cement Concrete Res. 29:1347
 *   - Steiger, M. 2005, J. Crystal Growth 282:455
 */

const R = 8.314; // Universal gas constant, J/(mol·K)

const CHEMICAL_DEFAULTS = {
    Ea_dark: 70000,
    Ea_light: 25000,
    // k0_dark calibrated so that the mogao200 preset (T=13°C, RH=35%,
    // light=2 klux, 200 y) yields ~48% scientific degradation — see
    // DeteriorationService.test.js. Earlier value 25000 was a copy-paste
    // from Ea_light and pushed all chemical results into the 'critical'
    // band.
    k0_dark: 0.0001,
    k0_light: 0.001,
    q: 0.8,
    p: 0.9
};

const LIFETIME_DEFAULTS = {
    Ea: 70000,
    n: 1.3,
    T0: 20,
    RH0: 50
};

const MOULD_DEFAULTS = {
    growthCoeff: 0.13,
    declineRate: -0.128
};

const SALT_DEFAULTS = {
    Vm: 5.33e-5,
    DRH_ref: 84.2,
    DRH_slope: -0.17,
    T_ref: 25,
    tensileStrength: 3.0,
    cyclesPerYear: 120
};

// Hygro-mechanical fatigue (HERIe / Bratasz methodology)
// Default values calibrated for a pigment-on-clay layered system to produce
// educational outputs across typical RH swing ranges (5-30%):
//   beta_diff: differential hygric strain coefficient (paint vs substrate), /%RH
//              ~5e-5 /%RH corresponds to ~0.25% strain at ±5% RH, consistent
//              with measurements on painted-panel systems (Mecklenburg,
//              Bratasz).
//   E:         effective Young's modulus of the paint layer (MPa)
//   sigma_fail: nominal monotonic-failure stress (MPa); the fatigue life
//              scales with (sigma_fail/stress)^basquin_b so this anchors the
//              dose-response curve.
//   basquin_b: Basquin fatigue exponent (dimensionless; higher = more brittle)
//   cyclesPerYear: default daily-cycle frequency
const FATIGUE_DEFAULTS = {
    beta_diff: 5e-5,     // per %RH
    E: 2000,             // MPa
    sigma_fail: 10.0,    // MPa
    basquin_b: 6,        // dimensionless
    cyclesPerYear: 365   // 1 daily cycle per day
};

// Paltakari-Karlsson sorption isotherm — equilibrium moisture content
function calculateMoistureContent(RH_fraction, T_kelvin) {
    const RH_safe = Math.min(Math.max(RH_fraction, 0.01), 0.999);
    const numerator = Math.log(1 - RH_safe);
    const denominator = 1.67 * T_kelvin - 285.655;
    const base = Math.abs(numerator / denominator);
    const exponent = 1 / (2.491 - 0.012 * T_kelvin);
    return Math.pow(base, exponent);
}

// 1. Chemical Pigment Fading
function calculateRateConstant(T_celsius, RH_percent, light_klux, params = {}) {
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

function chemicalFading(T_celsius, RH_percent, light_klux, totalDays, params = {}) {
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
        visualEffect: { fadeFactor: degradationFactor, type: 'chemical' }
    };
}

// 2. Michalski Lifetime Multiplier
function lifetimeMultiplier(T_celsius, RH_percent, params = {}) {
    const { Ea, n, T0, RH0 } = { ...LIFETIME_DEFAULTS, ...params };
    const T_kelvin = T_celsius + 273.15;
    const T0_kelvin = T0 + 273.15;
    const tempFactor = Math.exp((Ea / R) * (1 / T_kelvin - 1 / T0_kelvin));
    const rhFactor = Math.pow(RH0 / Math.max(RH_percent, 1), n);
    const multiplier = tempFactor * rhFactor;

    let color, label;
    if (multiplier >= 1.0) {
        color = '#10b981';
        label = 'longer';
    } else if (multiplier >= 0.5) {
        color = '#f59e0b';
        label = 'shorter';
    } else {
        color = '#ef4444';
        label = 'shorter';
    }

    return { multiplier, label, color };
}

// 3. VTT / Finnish Mould Growth Model
function mouldCriticalRH(T_celsius) {
    const T = Math.max(0, Math.min(50, T_celsius));
    return -0.0026 * T * T * T + 0.160 * T * T - 3.13 * T + 100.0;
}

function mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex = 0, params = {}) {
    const { growthCoeff, declineRate } = { ...MOULD_DEFAULTS, ...params };
    const rhCritical = mouldCriticalRH(T_celsius);
    const isAboveThreshold = RH_percent >= rhCritical;

    let growthRate = 0;
    if (isAboveThreshold && T_celsius > 0) {
        const rhExcess = (RH_percent - rhCritical) / 100;
        const tempScale = T_celsius / 20;
        growthRate = rhExcess * tempScale * growthCoeff;
    } else {
        growthRate = declineRate;
    }

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
        visualEffect: { coverage: mouldIndex / 6, intensity: Math.min(1, mouldIndex / 4), type: 'mould' }
    };
}

// 4. Salt Crystallization Pressure
function saltDeliquescenceRH(T_celsius, params = {}) {
    const { DRH_ref, DRH_slope, T_ref } = { ...SALT_DEFAULTS, ...params };
    return Math.max(0, Math.min(100, DRH_ref + DRH_slope * (T_celsius - T_ref)));
}

function saltCrystallization(T_celsius, RH_percent, totalDays, params = {}) {
    const { Vm, tensileStrength, cyclesPerYear } = { ...SALT_DEFAULTS, ...params };
    const T_kelvin = T_celsius + 273.15;
    const DRH = saltDeliquescenceRH(T_celsius, params);
    const isCrystallizing = RH_percent < DRH;

    let pressure_MPa = 0;
    if (isCrystallizing && RH_percent > 0) {
        const S = (DRH / 100) / (RH_percent / 100);
        pressure_MPa = ((R * T_kelvin) / Vm) * Math.log(S) / 1e6;
    }

    const damageRatio = pressure_MPa / tensileStrength;
    const totalYears = totalDays / 365.25;
    const totalCycles = totalYears * cyclesPerYear;
    const cumulativeDamage = Math.min(100, damageRatio * totalCycles * 0.5);

    let label = 'low';
    if (damageRatio >= 3.0) label = 'critical';
    else if (damageRatio >= 1.5) label = 'high';
    else if (damageRatio >= 0.5) label = 'moderate';
    else if (!isCrystallizing) label = 'safe';

    const risk = Math.min(100, damageRatio * 25);

    return {
        pressure_MPa: Math.round(pressure_MPa * 100) / 100,
        DRH: Math.round(DRH * 10) / 10,
        isCrystallizing,
        damageRatio: Math.round(damageRatio * 100) / 100,
        cumulativeDamage: Math.round(cumulativeDamage * 10) / 10,
        risk,
        label,
        visualEffect: { spalling: Math.min(1, damageRatio / 3), type: 'salt' }
    };
}

// 5. Hygro-mechanical fatigue (HERIe / Bratasz)
// Cyclic RH drives differential strain between paint and substrate layers.
// Cumulative damage via Miner's rule with Basquin's fatigue life equation:
//   strain amplitude  ε = beta_diff × ΔRH
//   stress amplitude  σ = E × ε
//   cycles to failure N(σ) = (sigma_fail / σ)^basquin_b
//   damage per cycle  d = 1 / N(σ)
//   cumulative damage D = d × (cyclesPerYear × totalYears)
// D = 1 → first cracks appear; D > 2 → widespread cracking; D >> 3 → severe flaking.
function fatigueDamage(RH_amplitude, totalDays, params = {}) {
    const { beta_diff, E, sigma_fail, basquin_b, cyclesPerYear } = { ...FATIGUE_DEFAULTS, ...params };
    const amplitude = Math.max(0, Math.min(100, RH_amplitude));
    const totalYears = totalDays / 365.25;

    let cumulativeDamage = 0;
    let stress_MPa = 0;
    let cyclesToFailure = Infinity;

    if (amplitude > 0.1 && totalYears > 0) {
        const strain = beta_diff * amplitude;
        stress_MPa = E * strain;
        // Basquin's law caps N at a high upper bound when stress is trivially small
        cyclesToFailure = Math.min(1e12, Math.pow(sigma_fail / Math.max(stress_MPa, 1e-6), basquin_b));
        const damagePerCycle = 1 / cyclesToFailure;
        cumulativeDamage = damagePerCycle * cyclesPerYear * totalYears;
    }

    let label = 'low';
    if (cumulativeDamage >= 3.0) label = 'critical';
    else if (cumulativeDamage >= 1.0) label = 'high';
    else if (cumulativeDamage >= 0.3) label = 'moderate';

    const risk = Math.min(100, cumulativeDamage * 33);
    const crackDensity = Math.min(1, cumulativeDamage / 3); // 0 = pristine, 1 = fully cracked

    return {
        stress_MPa: Math.round(stress_MPa * 1000) / 1000,
        cyclesToFailure: cyclesToFailure === Infinity ? null : Math.round(cyclesToFailure),
        cyclesApplied: Math.round(cyclesPerYear * totalYears),
        cumulativeDamage: Math.round(cumulativeDamage * 1000) / 1000,
        crackDensity: Math.round(crackDensity * 100) / 100,
        risk: Math.round(risk),
        label,
        visualEffect: { crackDensity, type: 'fatigue' }
    };
}

// Combined assessment
function assess(params) {
    const {
        T_celsius, RH_percent, light_klux, totalDays,
        prevMouldIndex = 0,
        RH_amplitude = 0,
        chemicalParams = {},
        lifetimeParams = {},
        mouldParams = {},
        saltCrystParams = {},
        fatigueParams = {}
    } = params;

    return {
        chemical: chemicalFading(T_celsius, RH_percent, light_klux, totalDays, chemicalParams),
        lifetime: lifetimeMultiplier(T_celsius, RH_percent, lifetimeParams),
        mould: mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex, mouldParams),
        saltCryst: saltCrystallization(T_celsius, RH_percent, totalDays, saltCrystParams),
        fatigue: fatigueDamage(RH_amplitude, totalDays, fatigueParams)
    };
}

module.exports = {
    CHEMICAL_DEFAULTS,
    LIFETIME_DEFAULTS,
    MOULD_DEFAULTS,
    SALT_DEFAULTS,
    FATIGUE_DEFAULTS,
    calculateMoistureContent,
    calculateRateConstant,
    chemicalFading,
    lifetimeMultiplier,
    mouldCriticalRH,
    mouldGrowth,
    saltDeliquescenceRH,
    saltCrystallization,
    fatigueDamage,
    assess
};
