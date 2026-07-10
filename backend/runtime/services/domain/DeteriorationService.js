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
    // DeteriorationService.test.js.
    //
    // These k0 values were rescaled by (H2O_old/H2O_new)^q ≈ 1597 when the
    // Paltakari–Karlsson isotherm was corrected from a Kelvin+abs surrogate
    // (EMC ~ hundreds) to the physical Celsius form (EMC ~ 0.06 at the anchor);
    // the rescaling preserves k_dark exactly at the mogao200 anchor point.
    // NOTE: because the corrected isotherm has a different RH/T response SHAPE
    // than the old surrogate, matching the single anchor does not reproduce the
    // old curve away from it — the renderer's visual dynamics across the full
    // T/RH range may warrant re-tuning. This does not affect any manuscript
    // number: the reported Ea come from the two-arm rate ratio, not this kernel.
    k0_dark: 0.159651,
    k0_light: 1.59651,
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

// Two-phase Na2SO4 system (Steiger & Asmussen 2008). Mirabilite (Na2SO4.10H2O)
// is the stable hydrate below the 32.4 C peritectic; thenardite (Na2SO4) above
// it. Each phase has its own molar volume and deliquescence-RH line. Matches the
// paper (Methods Eq. eq:steiger) and experiments/_make_figure_salt.py.
const SALT_DEFAULTS = {
    nu: 3,                 // Na2SO4 -> 2 Na+ + SO4^2- (Steiger dissociation factor)
    T_peritectic: 32.4,    // C, mirabilite <-> thenardite transition
    mirabilite: { Vm: 218e-6, DRH_intercept: 98.5, DRH_slope: -0.33 },  // T < 32.4 C
    thenardite: { Vm: 53.3e-6, DRH_intercept: 82.0, DRH_slope:  0.15 },  // T >= 32.4 C
    tensileStrength: 0.5,  // MPa, upper bound of the 0.1-0.5 MPa substrate band (conservative)
    cyclesPerYear: 120
};

// Select the stable salt phase for a given temperature.
function saltPhase(T_celsius, params = {}) {
    const P = { ...SALT_DEFAULTS, ...params };
    return T_celsius < P.T_peritectic
        ? { name: 'mirabilite', ...P.mirabilite }
        : { name: 'thenardite', ...P.thenardite };
}

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

// Paltakari-Karlsson sorption isotherm — equilibrium moisture content.
// T is in degrees CELSIUS: the fitted constants (1.67*T-285.655 and
// 2.491-0.012*T) make the base ln(1-RH)/(1.67*T-285.655) POSITIVE only for
// T < 171, i.e. the Celsius range, giving a physical EMC of a few percent.
// (An earlier revision passed T in Kelvin and masked the resulting negative
// base with Math.abs(); that produced non-physical EMC ~ hundreds. The k0
// constants below were rescaled when this was corrected so the mogao200
// calibration anchor is preserved — see CHEMICAL_DEFAULTS.)
function calculateMoistureContent(RH_fraction, T_celsius) {
    const RH_safe = Math.min(Math.max(RH_fraction, 0.01), 0.999);
    const numerator = Math.log(1 - RH_safe);
    const denominator = 1.67 * T_celsius - 285.655;
    const exponent = 1 / (2.491 - 0.012 * T_celsius);
    return Math.pow(numerator / denominator, exponent);
}

// 1. Chemical Pigment Fading
//
// NOTE: this formula is intentionally duplicated client-side in
//   frontend/pigment/PigmentAnalysis.js → computePerPigmentParams()
// where it runs per-pigment-class for the per-pixel renderer. The
// server-side version is the authoritative one; if you change the
// equation here, mirror the change there. The duplication exists to
// avoid a per-slider-tick network round-trip during simulation.
function calculateRateConstant(T_celsius, RH_percent, light_klux, params = {}) {
    const T_kelvin = T_celsius + 273.15;
    const RH_fraction = RH_percent / 100.0;
    const { Ea_dark, Ea_light, k0_dark, k0_light, q, p } = { ...CHEMICAL_DEFAULTS, ...params };
    const H2O = calculateMoistureContent(RH_fraction, T_celsius);
    const k_dark = k0_dark * Math.pow(H2O, q) * Math.exp(-Ea_dark / (R * T_kelvin));
    const k_light = light_klux > 0
        ? k0_light * Math.pow(light_klux, p) * Math.pow(H2O, q) * Math.exp(-Ea_light / (R * T_kelvin))
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
        visualEffect: {
            type: 'chemical',
            intensity: 1 - degradationFactor,   // 0 = pristine, 1 = fully degraded
            coverage: 1,                        // uniform across the texture
            fadeFactor: degradationFactor
        }
    };
}

// 2. Michalski Lifetime Multiplier
// `totalDays` is optional — it's only needed to populate visualEffect.
// Reference span: 200 years at the reference conditions (20 °C, 50 % RH).
const LIFETIME_REFERENCE_YEARS = 200;
function lifetimeMultiplier(T_celsius, RH_percent, totalDays = 0, params = {}) {
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

    // Convert elapsed real-time to effective ageing at reference conditions.
    // multiplier > 1 ⇒ slower ageing ⇒ shorter effectiveYears.
    const actualYears = Math.max(0, (totalDays || 0) / 365.25);
    const effectiveYears = multiplier > 0 ? actualYears / multiplier : 0;
    const intensity = Math.min(1, effectiveYears / LIFETIME_REFERENCE_YEARS);

    return {
        multiplier, label, color,
        effectiveYears,
        visualEffect: {
            type: 'lifetime',
            intensity,
            coverage: 1,
            effectiveYears
        }
    };
}

// 3. VTT / Finnish Mould Growth Model
function mouldCriticalRH(T_celsius) {
    const T = Math.max(0, Math.min(50, T_celsius));
    return -0.0026 * T * T * T + 0.160 * T * T - 3.13 * T + 100.0;
}

// Per-step mould-index update used by both the "scrub from zero" branch
// inside mouldGrowth() and the parallel implementation in
// frontend/services/SimulationEngine.js → _tick() (the playback loop
// can't round-trip the API every 100 ms). The formula is deliberately
// the same in both places; keep them in sync.
function _stepMouldIndex(prevMouldIndex, growthRate, daysElapsed) {
    return Math.max(0, Math.min(6, prevMouldIndex + growthRate * daysElapsed));
}

// mouldGrowth has two operating regimes:
//   1. **Scrub** (prevMouldIndex === 0 && totalDays > 0): integrate
//      from zero over `totalDays` at the current (T, RH). One-shot
//      query for a chosen exposure span at constant environment.
//   2. **Steady-state read** (prevMouldIndex > 0): return the index
//      unchanged. Per-step integration during real-time playback
//      lives in SimulationEngine._tick(); this endpoint is just for
//      reporting the current value back to the UI.
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
        // Regime 1: scrub-from-zero. Integrate uniformly across the span.
        mouldIndex = _stepMouldIndex(0, growthRate, totalDays);
    } else {
        // Regime 2: steady-state read. SimulationEngine owns the live accumulator.
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
            type: 'mould',
            intensity: Math.min(1, mouldIndex / 4),
            coverage: mouldIndex / 6,
            mouldIndex,
            rhCritical: Math.round(rhCritical * 10) / 10,
            isAboveThreshold
        }
    };
}

// 4. Salt Crystallization Pressure
function saltDeliquescenceRH(T_celsius, params = {}) {
    const phase = saltPhase(T_celsius, params);
    // Linear fits to the Steiger-Asmussen Pitzer curves:
    //   DRH_mir(T) = 98.5 - 0.33*T_C  ;  DRH_the(T) = 82.0 + 0.15*T_C
    return Math.max(0, Math.min(100, phase.DRH_intercept + phase.DRH_slope * T_celsius));
}

function saltCrystallization(T_celsius, RH_percent, totalDays, params = {}, RH_amplitude = 0) {
    const P = { ...SALT_DEFAULTS, ...params };
    const { nu, tensileStrength, cyclesPerYear } = P;
    const T_kelvin = T_celsius + 273.15;
    const phase = saltPhase(T_celsius, params);   // mirabilite < 32.4 C, thenardite above
    const Vm = phase.Vm;
    const DRH = saltDeliquescenceRH(T_celsius, params);

    // Real-world RH cycles. Evaluate pressure at the cycle TROUGH where
    // supersaturation peaks — the wet half of the cycle contributes
    // essentially zero pressure because RH there exceeds DRH. Previously the
    // model used the mean RH only, so a "Poor Storage 80 % ± 20 %" preset
    // computed pressure at RH=80 (just below DRH=83 → barely damaging)
    // and missed the genuinely damaging trough at RH=60.
    const RH_trough = Math.max(0.01, RH_percent - (RH_amplitude || 0) / 2);
    const isCrystallizing = RH_trough < DRH;

    let pressure_MPa = 0;
    if (isCrystallizing && RH_trough > 0) {
        const S = (DRH / 100) / (RH_trough / 100);
        // Steiger ideal-solution form: Δp = ν R T / Vm · ln(S)  (Methods Eq. eq:steiger)
        pressure_MPa = ((nu * R * T_kelvin) / Vm) * Math.log(S) / 1e6;
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

    // Visual effect scales with the accumulated damage over the exposure
    // period, NOT the instantaneous damageRatio. Salt damage is a long-term
    // accretion: a 50-year poor-storage scenario should clearly show
    // efflorescence even if any one snapshot's pressure is "moderate", and
    // a 1-day snapshot at the same RH shouldn't fake decades of damage.
    const cumNorm = Math.min(1, cumulativeDamage / 100);
    return {
        pressure_MPa: Math.round(pressure_MPa * 100) / 100,
        phase: phase.name,
        DRH: Math.round(DRH * 10) / 10,
        RH_trough: Math.round(RH_trough * 10) / 10,
        isCrystallizing,
        damageRatio: Math.round(damageRatio * 100) / 100,
        cumulativeDamage: Math.round(cumulativeDamage * 10) / 10,
        risk,
        label,
        visualEffect: {
            type: 'salt',
            intensity: cumNorm,
            coverage: cumNorm,
            spalling: Math.min(1, cumNorm * 1.5),
            damageRatio: Math.round(damageRatio * 100) / 100
        }
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
        visualEffect: {
            type: 'fatigue',
            intensity: Math.min(1, cumulativeDamage / 3),
            coverage: crackDensity,
            crackDensity,
            cumulativeDamage: Math.round(cumulativeDamage * 1000) / 1000
        }
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

    const channels = {
        chemical: chemicalFading(T_celsius, RH_percent, light_klux, totalDays, chemicalParams),
        lifetime: lifetimeMultiplier(T_celsius, RH_percent, totalDays, lifetimeParams),
        mould: mouldGrowth(T_celsius, RH_percent, totalDays, prevMouldIndex, mouldParams),
        saltCryst: saltCrystallization(T_celsius, RH_percent, totalDays, saltCrystParams, RH_amplitude),
        fatigue: fatigueDamage(RH_amplitude, totalDays, fatigueParams)
    };
    channels.composite = compositeRisk(channels);
    return channels;
}

/**
 * Composite deterioration index for one spatial zone (paper Eq. eq:composite).
 *
 * Each of the five mechanisms is normalised to a 0-1 risk scale and the
 * composite is the conservative (maximum-risk) aggregation:
 *
 *   R_composite = max( ΔE_chem / ΔE_max,          // chemical fading
 *                      min(1, 1 / LM),            // Michalski lifetime multiplier
 *                      M / 6,                     // VTT mould index
 *                      α_s · Δp / σ_t,            // salt crystallisation pressure
 *                      D / 3 )                    // Basquin-Miner fatigue damage
 *
 * clamped to [0, 1]. The per-channel normalised sub-indices are returned
 * alongside the scalar so callers can drive per-mechanism overlays and see
 * which mechanism dominates a zone.
 *
 * @param {object} channels - the five-model object returned by assess()
 *   (or any object exposing .chemical/.lifetime/.mould/.saltCryst/.fatigue).
 * @param {object} [opts]
 * @param {number} [opts.saltAvailability=1] - salt-supply factor α_s ∈ [0,1]
 *   (paper Eq. eq:composite) scaling the normalised salt sub-index. Defaults to
 *   1 (the base / worst-zone case where soluble salt is fully available), so the
 *   bare scalar composite is that worst-zone evaluation; compositeRiskField()
 *   passes the height-decayed α_s per zone.
 * @returns {{value:number, dominant:string, components:object}}
 */
function compositeRisk(channels, opts = {}) {
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    // ΔE_chem / ΔE_max: chemical.risk is min(100, scientificDegradation),
    // i.e. the fractional colour change already expressed on a 0-100 scale.
    const chem = clamp01((channels.chemical?.risk ?? 0) / 100);
    // Michalski lifetime consumption: the fraction of the reference service
    // life used up under the local condition, = elapsed / (LM · L_ref). The
    // lifetime kernel already computes this as visualEffect.intensity
    // (= min(1, effectiveYears / LIFETIME_REFERENCE_YEARS)). This grows with
    // both exposure time and harshness and — unlike the earlier rate-ratio
    // form min(1, 1/LM) — does not cliff-saturate the instant LM < 1, so the
    // composite varies spatially through the local-RH-driven LM field.
    // Fall back to the rate-ratio form for callers that supply only a
    // multiplier (no time information).
    const lt = channels.lifetime || {};
    let life;
    if (lt.visualEffect && lt.visualEffect.intensity != null) {
        life = clamp01(lt.visualEffect.intensity);
    } else if (lt.multiplier != null) {
        life = clamp01(lt.multiplier > 0 ? 1 / lt.multiplier : 1);
    } else {
        life = 0;
    }
    // M / 6: VTT mould index on its native 0-6 scale.
    const mould = clamp01((channels.mould?.mouldIndex ?? 0) / 6);
    // α_s · Δp/σ_t: the salt kernel exposes Δp/σ_t as damageRatio. The
    // crystallisation pressure exceeds substrate tensile strength wherever the
    // interior is sub-deliquescent (Δp/σ_t ≫ 1 → sub-index clamps to 1), so the
    // spatial differentiator is salt AVAILABILITY: the supply factor α_s ∈ [0,1]
    // scales the normalised salt sub-index by the fraction of soluble salt that
    // capillary transport delivers to the zone (α_s = 1 at the salt-fed base).
    const saltAvailability = clamp01(opts.saltAvailability == null ? 1 : opts.saltAvailability);
    const salt = clamp01(channels.saltCryst?.damageRatio ?? 0) * saltAvailability;
    // D / 3: Miner cumulative fatigue damage.
    const fatigue = clamp01((channels.fatigue?.cumulativeDamage ?? 0) / 3);

    const components = { chemical: chem, lifetime: life, mould, salt, fatigue };
    let dominant = 'chemical', value = chem;
    for (const [k, v] of Object.entries(components)) {
        if (v > value) { value = v; dominant = k; }
    }
    return { value, dominant, components };
}

/**
 * Capillary-rise local relative humidity for a point at normalised height h
 * above the base contact (Stage-1 per-zone spatial model).
 *
 * Soluble salts and moisture are delivered to the porous clay substrate by
 * capillary rise from the base, so local RH is elevated near the ground and
 * decays exponentially toward the ambient value with height (see the salt
 * crystallisation subsection of the manuscript). We model:
 *
 *   RH_local(h) = RH_amb + (RH_base - RH_amb) * exp(-h / lambda)
 *
 * with h in [0, 1] (0 = base contact, 1 = crown) and lambda the dimensionless
 * capillary decay length. RH_base is the ambient value lifted by a capillary
 * surcharge, clamped to 100 %.
 *
 * @param {number} h            normalised height in [0, 1]
 * @param {number} RH_amb       ambient (bulk-air) relative humidity, %
 * @param {object} [opts]
 * @param {number} [opts.lambda=0.35]         capillary decay length
 * @param {number} [opts.baseSurcharge=25]    RH points added at the base contact
 * @returns {number} local RH in %, clamped to [RH_amb, 100]
 */
function capillaryRH(h, RH_amb, opts = {}) {
    const { lambda = 0.35, baseSurcharge = 25 } = opts;
    const hh = Math.max(0, Math.min(1, h));
    const RH_base = Math.min(100, RH_amb + baseSurcharge);
    const local = RH_amb + (RH_base - RH_amb) * Math.exp(-hh / lambda);
    return Math.max(RH_amb, Math.min(100, local));
}

/**
 * Per-zone spatial composite deterioration index (Stage-1 spatial model).
 *
 * Evaluates the five-mechanism composite (Eq. eq:composite) independently for
 * each spatial zone, applying zone-local environmental drivers derived from
 * the global condition:
 *   - RH is lifted near the base by capillary rise (capillaryRH), so salt and
 *     mould activate preferentially on lower zones;
 *   - light dose is scaled per zone (lit faces vs shadowed recesses), so the
 *     photolytic/lifetime pathways vary with exposure.
 * Temperature, fatigue amplitude and exposure duration are shared globally.
 *
 * @param {object} params - the same shape assess() takes (global condition),
 *   PLUS optional { capillary: {lambda, baseSurcharge} } tuning.
 * @param {Array<object>} zones - [{ id, name, height, lightScale }], where
 *   height in [0,1] is the zone centroid height above the base and lightScale
 *   in [0,1] scales the global illuminance for that zone (default 1).
 * @returns {Array<object>} per-zone [{ id, name, height, RH_local, light_klux,
 *   composite:{value,dominant,components} }], plus the driving assess() channels.
 */
// Canonical Stage-1 vertical zoning of a seated figure (base -> crown), used
// when the caller does not supply its own zones. Heights are zone centroids in
// [0, 1]; lightScale approximates exposure (recessed base shadowed, face lit).
const DEFAULT_ZONES = [
    { id: 'base',    name: 'Base / lower drapery', height: 0.12, lightScale: 0.5 },
    { id: 'torso',   name: 'Torso / mid drapery',  height: 0.50, lightScale: 0.8 },
    { id: 'face',    name: 'Face / crown',         height: 0.85, lightScale: 1.0 }
];

function compositeRiskField(params, zones) {
    const { capillary = {}, light_klux = 0, RH_percent, ...rest } = params;
    const saltLambda = capillary.saltLambda == null ? 0.25 : capillary.saltLambda;
    zones = (zones && zones.length) ? zones : DEFAULT_ZONES;
    return (zones || []).map((z) => {
        const height = Math.max(0, Math.min(1, z.height ?? 0.5));
        const lightScale = z.lightScale == null ? 1 : Math.max(0, z.lightScale);
        const RH_local = capillaryRH(height, RH_percent, capillary);
        const light_local = light_klux * lightScale;
        const channels = assess({
            ...rest,
            RH_percent: RH_local,
            light_klux: light_local
        });

        // Crystallisation pressure exceeds substrate tensile strength wherever
        // sulfate is present, so the salt sub-index saturates on RH alone. The
        // spatial differentiator is salt AVAILABILITY: capillary transport
        // concentrates soluble salt at the base, and little reaches the crown.
        // Model availability as exponential decay with height and scale the
        // salt channel by it (a zone with no salt has no salt risk, whatever
        // the local RH). An explicit per-zone `saltAvailability` overrides this.
        const saltAvailability = z.saltAvailability == null
            ? Math.exp(-height / saltLambda)
            : Math.max(0, Math.min(1, z.saltAvailability));
        // Crystallisation pressure saturates the salt sub-index (Δp/σ_t ≫ 1)
        // wherever salt is present, so the zone's salt risk is set by the
        // fraction of soluble salt that reaches this height. Pass the
        // height-decayed availability α_s through to compositeRisk (paper
        // Eq. eq:composite), which scales the normalised salt sub-index by it;
        // the returned per-zone channels keep the ungated damageRatio.
        const composite = compositeRisk(channels, { saltAvailability });

        return {
            id: z.id,
            name: z.name,
            height,
            RH_local: Math.round(RH_local * 10) / 10,
            light_klux: Math.round(light_local * 1000) / 1000,
            saltAvailability: Math.round(saltAvailability * 1000) / 1000,
            composite,
            channels
        };
    });
}

/**
 * Precompute the composite index over an (height x illumination) lookup grid
 * for per-texel Stage-2 rendering. Running the full kernel stack at every
 * texture pixel is prohibitive, so the runtime evaluates a small grid here and
 * the client bilinearly samples it against the baked height/illumination maps.
 *
 * Each grid node is treated as a synthetic zone at the given normalised height
 * (feeding capillaryRH + salt availability) and illumination scale (scaling the
 * global light dose). The returned grid is row-major over height (outer) then
 * illumination (inner).
 *
 * @param {object} params - assess() condition (+ optional capillary tuning).
 * @param {number} [nH=8]  - height samples in [0,1].
 * @param {number} [nL=8]  - illumination-scale samples in [0,1].
 * @returns {{nH,nL, value:number[][], dominant:string[][]}}
 */
function compositeRiskGrid(params, nH = 8, nL = 8) {
    const zones = [];
    for (let ih = 0; ih < nH; ih++) {
        const height = nH === 1 ? 0.5 : ih / (nH - 1);
        for (let il = 0; il < nL; il++) {
            const lightScale = nL === 1 ? 1 : il / (nL - 1);
            zones.push({ id: `${ih}_${il}`, name: `${ih}_${il}`, height, lightScale });
        }
    }
    const field = compositeRiskField(params, zones);
    const value = [], dominant = [];
    let k = 0;
    for (let ih = 0; ih < nH; ih++) {
        const vrow = [], drow = [];
        for (let il = 0; il < nL; il++) {
            const c = field[k++].composite;
            vrow.push(Math.round(c.value * 1000) / 1000);
            drow.push(c.dominant);
        }
        value.push(vrow);
        dominant.push(drow);
    }
    return { nH, nL, value, dominant };
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
    saltPhase,
    saltDeliquescenceRH,
    saltCrystallization,
    fatigueDamage,
    compositeRisk,
    capillaryRH,
    compositeRiskField,
    compositeRiskGrid,
    DEFAULT_ZONES,
    assess
};
