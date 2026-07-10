/**
 * Unit tests for the five deterioration model functions.
 *
 * These are pure-function tests: no database, no network, no mocks.
 * They lock in the calibration described in the paper and catch accidental
 * regressions in the numerical behaviour of each model.
 */

const D = require('../services/domain/DeteriorationService');

// A small tolerance for floating-point comparison
const approx = (got, exp, tol = 1e-3) => Math.abs(got - exp) <= tol;

// ── 1. Paltakari–Karlsson sorption isotherm ─────────────────────────────────
describe('calculateMoistureContent (Paltakari–Karlsson)', () => {
    // T is in degrees CELSIUS (the fitted constants only give a real, positive
    // moisture content for T < 171; the operating range is ~0–40 °C).
    test('produces a physical equilibrium moisture content at mid-range conditions', () => {
        const M = D.calculateMoistureContent(0.5, 20);
        expect(Number.isFinite(M)).toBe(true);
        expect(M).toBeGreaterThan(0);
        // physical EMC for a paint layer is a few percent, not hundreds
        expect(M).toBeLessThan(0.3);
    });

    test('finite and physical across the full RH/T operating range', () => {
        for (const T_c of [0, 20, 40]) {
            for (const rh of [0.1, 0.3, 0.5, 0.7, 0.9]) {
                const M = D.calculateMoistureContent(rh, T_c);
                expect(Number.isFinite(M)).toBe(true);
                expect(M).toBeGreaterThan(0);
                expect(M).toBeLessThan(0.3);
            }
        }
    });

    test('moisture content rises monotonically with RH', () => {
        const lo = D.calculateMoistureContent(0.2, 20);
        const hi = D.calculateMoistureContent(0.8, 20);
        expect(hi).toBeGreaterThan(lo);
    });

    test('boundary protection: RH=0 and RH=1 do not diverge', () => {
        expect(Number.isFinite(D.calculateMoistureContent(0, 20))).toBe(true);
        expect(Number.isFinite(D.calculateMoistureContent(1, 20))).toBe(true);
    });
});

// ── 2. Chemical fading (Model 1) ────────────────────────────────────────────
describe('chemicalFading (Model 1)', () => {
    test('zero exposure yields zero degradation', () => {
        const r = D.chemicalFading(20, 50, 0.15, 0);
        expect(r.degradationFactor).toBeCloseTo(1.0, 6);
        expect(r.scientificDegradation).toBeCloseTo(0, 6);
        expect(r.label).toBe('low');
    });

    test('mogao200 preset produces the documented ~48% degradation', () => {
        const r = D.chemicalFading(13, 35, 2, 200 * 365.25);
        // API observed value: 48.27% → label 'high'
        expect(r.scientificDegradation).toBeGreaterThan(40);
        expect(r.scientificDegradation).toBeLessThan(60);
        expect(r.label).toBe('high');
    });

    test('higher light gives faster fading (monotonic)', () => {
        const low  = D.chemicalFading(20, 50, 0.15, 100 * 365.25).scientificDegradation;
        const high = D.chemicalFading(20, 50, 20, 100 * 365.25).scientificDegradation;
        expect(high).toBeGreaterThan(low);
    });

    test('label crosses the documented thresholds', () => {
        // Pick conditions that produce each band
        expect(D.chemicalFading(20, 50, 0.15,  10 * 365.25).label).toBe('low');
        expect(D.chemicalFading(28, 75, 5,    200 * 365.25).label).toMatch(/moderate|high|critical/);
    });
});

// ── 3. Michalski lifetime multiplier (Model 2) ─────────────────────────────
describe('lifetimeMultiplier (Model 2)', () => {
    test('reference conditions give multiplier == 1.0', () => {
        const r = D.lifetimeMultiplier(20, 50);
        expect(r.multiplier).toBeCloseTo(1.0, 3);
    });

    test('Mogao cold/dry gives ~3.2x longer life (documented)', () => {
        const r = D.lifetimeMultiplier(13, 35);
        expect(r.multiplier).toBeGreaterThan(2.5);
        expect(r.multiplier).toBeLessThan(4.0);
        expect(r.label).toBe('longer');
    });

    test('tropical humid gives sub-unity multiplier', () => {
        const r = D.lifetimeMultiplier(28, 75);
        expect(r.multiplier).toBeLessThan(0.5);
        expect(r.label).toBe('shorter');
    });

    test('extreme conditions give very short multiplier', () => {
        const r = D.lifetimeMultiplier(40, 100);
        expect(r.multiplier).toBeLessThan(0.15);
    });
});

// ── 4. VTT mould growth (Model 3) ──────────────────────────────────────────
describe('mouldGrowth (Model 3, Hukka–Viitanen)', () => {
    test('critical RH polynomial at reference temperatures', () => {
        expect(D.mouldCriticalRH(20)).toBeCloseTo(80.6, 0);
        expect(D.mouldCriticalRH(25)).toBeCloseTo(81.1, 0);
        expect(D.mouldCriticalRH(30)).toBeCloseTo(79.9, 0);
        expect(D.mouldCriticalRH(40)).toBeCloseTo(64.4, 0);
    });

    test('no growth below critical RH regardless of exposure', () => {
        // Mogao: RH=35 is FAR below rhCrit(13)≈80.6
        const r = D.mouldGrowth(13, 35, 365 * 200, 0);
        expect(r.mouldIndex).toBe(0);
        expect(r.isAboveThreshold).toBe(false);
    });

    test('extreme warm+humid drives index to saturation', () => {
        const r = D.mouldGrowth(40, 100, 365 * 10, 0);
        expect(r.mouldIndex).toBe(6);
        expect(r.label).toBe('critical');
    });

    test('poor storage hits moderate mould over 50 years', () => {
        const r = D.mouldGrowth(30, 80, 365 * 50, 0);
        // At T=30 RH=80, just above rhCrit≈79.9, gives ~3.6 over 50y
        expect(r.mouldIndex).toBeGreaterThan(2.5);
        expect(r.mouldIndex).toBeLessThan(5);
        expect(r.isAboveThreshold).toBe(true);
    });
});

// ── 5. Salt crystallisation (Model 4) ──────────────────────────────────────
describe('saltCrystallization (Model 4)', () => {
    test('DRH is temperature-dependent (two-phase Steiger)', () => {
        // Mirabilite at 13 C: DRH = 98.5 - 0.33*13 ≈ 94.2
        // Thenardite at 40 C: DRH = 82.0 + 0.15*40 = 88.0 → 13 C is higher
        expect(D.saltDeliquescenceRH(13)).toBeGreaterThan(D.saltDeliquescenceRH(40));
    });

    test('phase switches at the 32.4 C peritectic', () => {
        expect(D.saltPhase(32.3).name).toBe('mirabilite');
        expect(D.saltPhase(32.5).name).toBe('thenardite');
    });

    test('Mogao dry conditions produce high pressure (not zero)', () => {
        const r = D.saltCrystallization(13, 35, 200 * 365.25, {}, 15);
        // Mirabilite phase (T<32.4). Steiger ideal-solution form Δp = νRT/Vm·ln(S)
        // with ν=3 gives ≈40 MPa — the subject of the static-pressure caveat in the paper.
        expect(r.phase).toBe('mirabilite');
        expect(r.pressure_MPa).toBeGreaterThan(30);
        expect(r.isCrystallizing).toBe(true);
        expect(r.label).toBe('critical');
    });

    test('RH above DRH gives no crystallisation (zero pressure)', () => {
        // T=40 → thenardite, DRH = 82.0 + 0.15*40 = 88.0; RH=100 > 88 → dissolved
        const r = D.saltCrystallization(40, 100, 10 * 365.25);
        expect(r.phase).toBe('thenardite');
        expect(r.isCrystallizing).toBe(false);
        expect(r.pressure_MPa).toBe(0);
    });
});

// ── 6. Hygro-mechanical fatigue (Model 5) ──────────────────────────────────
describe('fatigueDamage (Model 5, Basquin + Miner)', () => {
    test('zero amplitude yields zero damage', () => {
        const r = D.fatigueDamage(0, 200 * 365.25);
        expect(r.cumulativeDamage).toBe(0);
        expect(r.label).toBe('low');
    });

    test('ΔRH=20% over 50 years reaches first-crack onset', () => {
        // Per paper: D ≈ 1.2 at 50y, crossing threshold at ~43y
        const r = D.fatigueDamage(20, 50 * 365.25);
        expect(r.cumulativeDamage).toBeGreaterThan(1.0);
        expect(r.cumulativeDamage).toBeLessThan(1.5);
        expect(r.label).toBe('high');
    });

    test('ΔRH=30% over 50 years drives severe damage', () => {
        // Per paper: D ≈ 13 at 50y
        const r = D.fatigueDamage(30, 50 * 365.25);
        expect(r.cumulativeDamage).toBeGreaterThan(5);
        expect(r.label).toBe('critical');
    });

    test('low amplitude over 100 years stays below threshold', () => {
        // Museum-buffered (ΔRH=5%) — D ≈ 0.001
        const r = D.fatigueDamage(5, 100 * 365.25);
        expect(r.cumulativeDamage).toBeLessThan(0.1);
        expect(r.label).toBe('low');
    });

    test('Basquin scaling: doubling amplitude ≈ 2^6 increase in damage', () => {
        const d10 = D.fatigueDamage(10, 50 * 365.25).cumulativeDamage;
        const d20 = D.fatigueDamage(20, 50 * 365.25).cumulativeDamage;
        // Ratio should be close to 2^6 = 64 (within 5% for b=6)
        expect(d20 / d10).toBeCloseTo(64, -0.5);
    });
});

// ── 7. Combined assess() wiring ────────────────────────────────────────────
describe('assess (all models)', () => {
    test('returns all five model channels', () => {
        const r = D.assess({
            T_celsius: 20, RH_percent: 50, light_klux: 0.15,
            totalDays: 100 * 365.25, RH_amplitude: 5
        });
        expect(r).toHaveProperty('chemical');
        expect(r).toHaveProperty('lifetime');
        expect(r).toHaveProperty('mould');
        expect(r).toHaveProperty('saltCryst');
        expect(r).toHaveProperty('fatigue');
    });

    test('museum 100y reproduces the expected preset profile', () => {
        const r = D.assess({
            T_celsius: 20, RH_percent: 50, light_klux: 0.15,
            totalDays: 100 * 365.25, RH_amplitude: 5
        });
        // Reference conditions → LM ≈ 1, mould = 0, fatigue D ≪ 1
        expect(r.lifetime.multiplier).toBeCloseTo(1.0, 2);
        expect(r.mould.mouldIndex).toBe(0);
        expect(r.fatigue.cumulativeDamage).toBeLessThan(0.1);
    });
});

// ── 8. compositeRisk() — paper Eq. eq:composite ─────────────────────────────
describe('compositeRisk (Eq. composite)', () => {
    test('assess() attaches a composite channel with the right shape', () => {
        const r = D.assess({
            T_celsius: 20, RH_percent: 50, light_klux: 0.15,
            totalDays: 100 * 365.25, RH_amplitude: 5
        });
        expect(r).toHaveProperty('composite');
        expect(r.composite).toHaveProperty('value');
        expect(r.composite).toHaveProperty('dominant');
        expect(r.composite.components).toHaveProperty('chemical');
        expect(r.composite.components).toHaveProperty('lifetime');
        expect(r.composite.components).toHaveProperty('mould');
        expect(r.composite.components).toHaveProperty('salt');
        expect(r.composite.components).toHaveProperty('fatigue');
    });

    test('composite is the max of the five normalised channels, clamped to [0,1]', () => {
        const r = D.assess({
            T_celsius: 20, RH_percent: 50, light_klux: 0.15,
            totalDays: 100 * 365.25, RH_amplitude: 5
        });
        const c = r.composite.components;
        const expected = Math.max(c.chemical, c.lifetime, c.mould, c.salt, c.fatigue);
        expect(r.composite.value).toBeCloseTo(expected, 10);
        expect(r.composite.value).toBeGreaterThanOrEqual(0);
        expect(r.composite.value).toBeLessThanOrEqual(1);
        // dominant label points at the argmax channel
        expect(c[r.composite.dominant === 'saltCryst' ? 'salt' : r.composite.dominant])
            .toBeCloseTo(r.composite.value, 10);
    });

    test('salt saturates the composite when crystallisation pressure exceeds substrate strength', () => {
        // High T + high RH drives Δp/σ_t well past 1, so the salt sub-index
        // saturates and the clamped composite reaches its ceiling of 1.
        const r = D.assess({
            T_celsius: 30, RH_percent: 80, light_klux: 0,
            totalDays: 50 * 365.25, RH_amplitude: 0
        });
        expect(r.composite.components.salt).toBe(1); // clamped from Δp/σ_t ≫ 1
        expect(r.composite.value).toBe(1);           // clamped composite ceiling
    });

    test('saltAvailability (α_s) scales the salt sub-index; defaults to 1', () => {
        // Δp/σ_t ≫ 1 so the raw salt sub-index clamps to 1; α_s then scales it.
        const channels = {
            chemical: { risk: 5 },          // 0.05
            lifetime: { multiplier: 10 },   // 0.10
            mould: { mouldIndex: 0 },
            saltCryst: { damageRatio: 5 },  // clamps to 1 before α_s
            fatigue: { cumulativeDamage: 0 }
        };
        // default α_s = 1 → salt fully available (base / worst zone)
        expect(D.compositeRisk(channels).components.salt).toBe(1);
        // α_s = 0.3 → salt sub-index scaled to 0.3
        expect(D.compositeRisk(channels, { saltAvailability: 0.3 }).components.salt)
            .toBeCloseTo(0.3, 10);
        // α_s = 0 → no soluble salt reaches the zone → no salt risk
        const dry = D.compositeRisk(channels, { saltAvailability: 0 });
        expect(dry.components.salt).toBe(0);
        expect(dry.dominant).toBe('lifetime'); // 0.10 now leads
    });

    test('salt is the argmax when it is the only saturated channel', () => {
        // Salt-only synthetic: every other channel below salt.
        const comp = D.compositeRisk({
            chemical: { risk: 10 },        // 0.10
            lifetime: { multiplier: 1.5 }, // 0.67
            mould: { mouldIndex: 0 },      // 0
            saltCryst: { damageRatio: 0.95 },
            fatigue: { cumulativeDamage: 0 }
        });
        expect(comp.dominant).toBe('salt');
        expect(comp.value).toBeCloseTo(0.95, 10);
    });

    test('compositeRisk falls back to min(1,1/LM) when only a multiplier is given', () => {
        // No visualEffect.intensity (no time info) → rate-ratio fallback.
        const channels = {
            chemical: { risk: 30 },      // 0.30
            lifetime: { multiplier: 2 }, // min(1, 0.5) = 0.50
            mould: { mouldIndex: 1.2 },  // 0.20
            saltCryst: { damageRatio: 0.10 },
            fatigue: { cumulativeDamage: 0.30 } // 0.10
        };
        const comp = D.compositeRisk(channels);
        expect(comp.value).toBeCloseTo(0.50, 10);
        expect(comp.dominant).toBe('lifetime');
    });

    test('lifetime sub-index uses consumption (visualEffect.intensity) when present', () => {
        // Consumption form: intensity = elapsed / (LM · L_ref). A small
        // consumption must NOT saturate even though LM < 1 (harsh condition).
        const channels = {
            chemical: { risk: 5 },
            lifetime: { multiplier: 0.3, visualEffect: { intensity: 0.12 } },
            mould: { mouldIndex: 0 },
            saltCryst: { damageRatio: 0 },
            fatigue: { cumulativeDamage: 0 }
        };
        const comp = D.compositeRisk(channels);
        expect(comp.components.lifetime).toBeCloseTo(0.12, 10);
        // chemical 0.05 < lifetime 0.12 → lifetime leads, well below saturation
        expect(comp.value).toBeCloseTo(0.12, 10);
        expect(comp.dominant).toBe('lifetime');
    });

    test('scalar composite varies spatially across zones (no cliff-saturation)', () => {
        // Interior 30y: with the consumption-form lifetime term the whole-object
        // composite must differ between base and face rather than both being 1.
        const field = D.compositeRiskField({
            T_celsius: 16, RH_percent: 40, light_klux: 1,
            totalDays: 30 * 365.25, RH_amplitude: 6
        });
        const base = field.find(z => z.id === 'base');
        const face = field.find(z => z.id === 'face');
        expect(base.composite.value).toBeGreaterThan(face.composite.value);
        expect(base.composite.value).toBeLessThan(1);  // not cliff-saturated
    });
});

// ── 9. capillaryRH + compositeRiskField — Stage-1 spatial model ─────────────
describe('capillaryRH (capillary-rise moisture field)', () => {
    test('RH is elevated at the base and decays to ambient with height', () => {
        const amb = 40;
        const base = D.capillaryRH(0, amb);
        const mid  = D.capillaryRH(0.5, amb);
        const top  = D.capillaryRH(1, amb);
        expect(base).toBeGreaterThan(mid);
        expect(mid).toBeGreaterThan(top);
        expect(top).toBeGreaterThanOrEqual(amb);   // never below ambient
        expect(base).toBeLessThanOrEqual(100);      // clamped
    });

    test('base surcharge lifts RH by the configured amount at h=0', () => {
        expect(D.capillaryRH(0, 40, { baseSurcharge: 25 })).toBeCloseTo(65, 6);
    });

    test('clamps to 100 when ambient + surcharge exceeds saturation', () => {
        expect(D.capillaryRH(0, 90, { baseSurcharge: 25 })).toBe(100);
    });
});

describe('compositeRiskField (per-zone spatial composite)', () => {
    test('returns one entry per zone with a composite and local drivers', () => {
        const field = D.compositeRiskField({
            T_celsius: 25, RH_percent: 55, light_klux: 5,
            totalDays: 50 * 365.25, RH_amplitude: 10
        });
        expect(field.length).toBe(3); // DEFAULT_ZONES
        for (const z of field) {
            expect(z).toHaveProperty('RH_local');
            expect(z).toHaveProperty('composite');
            expect(z.composite.value).toBeGreaterThanOrEqual(0);
            expect(z.composite.value).toBeLessThanOrEqual(1);
        }
    });

    test('base zone sees higher local RH than the face zone (capillary rise)', () => {
        const field = D.compositeRiskField({
            T_celsius: 25, RH_percent: 55, light_klux: 5,
            totalDays: 50 * 365.25, RH_amplitude: 10
        });
        const base = field.find(z => z.id === 'base');
        const face = field.find(z => z.id === 'face');
        expect(base.RH_local).toBeGreaterThan(face.RH_local);
    });

    test('salt sub-index decreases with height (capillary availability)', () => {
        // Poor-storage 50y: salt saturates on RH everywhere, so the spatial
        // signal must come from availability decaying with height.
        const field = D.compositeRiskField({
            T_celsius: 28, RH_percent: 60, light_klux: 5,
            totalDays: 50 * 365.25, RH_amplitude: 15
        });
        const base = field.find(z => z.id === 'base');
        const torso = field.find(z => z.id === 'torso');
        const face = field.find(z => z.id === 'face');
        expect(base.composite.components.salt).toBeGreaterThan(torso.composite.components.salt);
        expect(torso.composite.components.salt).toBeGreaterThan(face.composite.components.salt);
        expect(base.saltAvailability).toBeGreaterThan(face.saltAvailability);
    });

    test('compositeRiskGrid returns an nH x nL lookup grid, monotone in height', () => {
        const g = D.compositeRiskGrid({
            T_celsius: 16, RH_percent: 40, light_klux: 1,
            totalDays: 30 * 365.25, RH_amplitude: 6
        }, 5, 4);
        expect(g.nH).toBe(5);
        expect(g.nL).toBe(4);
        expect(g.value.length).toBe(5);
        expect(g.value[0].length).toBe(4);
        // height index 0 = base (wettest, most salt) -> higher composite than crown
        const baseRow = g.value[0];
        const crownRow = g.value[4];
        const avg = (r) => r.reduce((a, b) => a + b, 0) / r.length;
        expect(avg(baseRow)).toBeGreaterThan(avg(crownRow));
        // every cell in [0,1]
        for (const row of g.value) for (const v of row) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });

    test('accepts custom zones and honours per-zone light scaling', () => {
        const field = D.compositeRiskField(
            { T_celsius: 20, RH_percent: 50, light_klux: 10, totalDays: 3652.5, RH_amplitude: 5 },
            [{ id: 'lit', name: 'lit', height: 0.9, lightScale: 1.0 },
             { id: 'dark', name: 'dark', height: 0.9, lightScale: 0.0 }]
        );
        const lit = field.find(z => z.id === 'lit');
        const dark = field.find(z => z.id === 'dark');
        expect(lit.light_klux).toBeCloseTo(10, 6);
        expect(dark.light_klux).toBe(0);
    });
});
