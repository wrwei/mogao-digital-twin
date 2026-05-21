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
    test('produces a finite positive value at mid-range conditions', () => {
        const M = D.calculateMoistureContent(0.5, 293.15);
        expect(Number.isFinite(M)).toBe(true);
        expect(M).toBeGreaterThan(0);
    });

    test('finite and positive across the full RH/T operating range', () => {
        for (const T_k of [273.15, 293.15, 313.15]) {
            for (const rh of [0.1, 0.3, 0.5, 0.7, 0.9]) {
                const M = D.calculateMoistureContent(rh, T_k);
                expect(Number.isFinite(M)).toBe(true);
                expect(M).toBeGreaterThan(0);
            }
        }
    });

    test('boundary protection: RH=0 and RH=1 do not diverge', () => {
        expect(Number.isFinite(D.calculateMoistureContent(0, 293.15))).toBe(true);
        expect(Number.isFinite(D.calculateMoistureContent(1, 293.15))).toBe(true);
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
    test('DRH is temperature-dependent (linearised)', () => {
        // Default slope is -0.17 with T_ref=25 → higher T gives lower DRH
        expect(D.saltDeliquescenceRH(13)).toBeGreaterThan(D.saltDeliquescenceRH(40));
    });

    test('Mogao dry conditions produce high pressure (not zero)', () => {
        const r = D.saltCrystallization(13, 35, 200 * 365.25);
        // This is the subject of the static-pressure caveat in the paper.
        // Approx 40 MPa from Correns' equation.
        expect(r.pressure_MPa).toBeGreaterThan(30);
        expect(r.isCrystallizing).toBe(true);
        expect(r.label).toBe('critical');
    });

    test('RH above DRH gives no crystallisation (zero pressure)', () => {
        // T=40 gives DRH≈81.7; RH=100 > 81.7 → dissolved
        const r = D.saltCrystallization(40, 100, 10 * 365.25);
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
