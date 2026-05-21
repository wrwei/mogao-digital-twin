/**
 * Unit tests for the ValidationHarness.
 *
 * The harness compares a parsed (T, RH, light, t, ΔE_observed) dataset
 * against the chemicalFading model. These tests cover the parser, the
 * three goodness-of-fit metrics, and the evaluator wiring. Real
 * literature-derived datasets are loaded by the CLI script in
 * scripts/validate.js; this suite only exercises the harness itself.
 */

const fs = require('fs');
const path = require('path');
const V = require('../services/domain/ValidationHarness');
const { chemicalFading } = require('../services/domain/DeteriorationService');

const FIXTURE = path.join(__dirname, 'fixtures', 'validation-demo.csv');

// ── parseCsv ─────────────────────────────────────────────────────────────

describe('parseCsv', () => {
    test('parses a well-formed dataset into typed rows', () => {
        const csv = [
            'dataset,citation,t_days,T_celsius,RH_pct,light_klux,deltaE_observed',
            'A,X,30,40,50,0,0.5',
            'A,X,90,40,50,0,1.6'
        ].join('\n');
        const { rows, errors } = V.parseCsv(csv);
        expect(errors).toEqual([]);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({
            dataset: 'A', citation: 'X',
            t_days: 30, T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 0.5
        });
    });

    test('skips blank lines without raising', () => {
        const csv = [
            'dataset,citation,t_days,T_celsius,RH_pct,light_klux,deltaE_observed',
            '',
            'A,X,30,40,50,0,0.5',
            '',
            'A,X,90,40,50,0,1.6',
            ''
        ].join('\n');
        const { rows, errors } = V.parseCsv(csv);
        expect(errors).toEqual([]);
        expect(rows).toHaveLength(2);
    });

    test('returns an error and drops rows that have wrong column counts', () => {
        const csv = [
            'dataset,citation,t_days,T_celsius,RH_pct,light_klux,deltaE_observed',
            'A,X,30,40,50,0,0.5',
            'A,X,30,40,50',      // truncated
            'A,X,90,40,50,0,1.6'
        ].join('\n');
        const { rows, errors } = V.parseCsv(csv);
        expect(rows).toHaveLength(2);
        expect(errors).toHaveLength(1);
        expect(errors[0].line).toBe(3);
    });

    test('returns an error for non-numeric values in required numeric columns', () => {
        const csv = [
            'dataset,citation,t_days,T_celsius,RH_pct,light_klux,deltaE_observed',
            'A,X,thirty,40,50,0,0.5',
            'A,X,90,40,50,0,1.6'
        ].join('\n');
        const { rows, errors } = V.parseCsv(csv);
        expect(rows).toHaveLength(1);
        expect(errors).toHaveLength(1);
        expect(errors[0].error).toMatch(/non-numeric.*t_days/);
    });

    test('reports each missing required column', () => {
        const csv = [
            'dataset,citation,t_days,T_celsius,light_klux,deltaE_observed',  // RH_pct missing
            'A,X,30,40,0,0.5'
        ].join('\n');
        const { rows, errors } = V.parseCsv(csv);
        expect(rows).toEqual([]);
        expect(errors.some(e => /RH_pct/.test(e.error))).toBe(true);
    });

    test('returns an empty input error on the empty string', () => {
        const { rows, errors } = V.parseCsv('');
        expect(rows).toEqual([]);
        expect(errors[0].error).toBe('empty input');
    });

    test('the bundled demo fixture parses without errors', () => {
        const text = fs.readFileSync(FIXTURE, 'utf-8');
        const { rows, errors } = V.parseCsv(text);
        expect(errors).toEqual([]);
        expect(rows.length).toBeGreaterThan(0);
        // every row carries the required numeric fields
        for (const row of rows) {
            expect(typeof row.t_days).toBe('number');
            expect(typeof row.T_celsius).toBe('number');
            expect(typeof row.RH_pct).toBe('number');
            expect(typeof row.light_klux).toBe('number');
            expect(typeof row.deltaE_observed).toBe('number');
        }
    });
});

// ── Metric helpers ───────────────────────────────────────────────────────

describe('rmse', () => {
    test('zero error when predicted equals observed', () => {
        expect(V.rmse([1, 2, 3], [1, 2, 3])).toBe(0);
    });
    test('matches the textbook formula on a small example', () => {
        // observed: [1, 2, 3], predicted: [3, 2, 1]
        // residuals: 2, 0, 2; mean square: (4 + 0 + 4) / 3 = 8/3; sqrt → 1.633
        expect(V.rmse([1, 2, 3], [3, 2, 1])).toBeCloseTo(Math.sqrt(8 / 3), 6);
    });
    test('returns NaN on empty arrays', () => {
        expect(V.rmse([], [])).toBeNaN();
    });
    test('returns NaN on length mismatch', () => {
        expect(V.rmse([1, 2], [1, 2, 3])).toBeNaN();
    });
});

describe('mae', () => {
    test('zero error when predicted equals observed', () => {
        expect(V.mae([1, 2, 3], [1, 2, 3])).toBe(0);
    });
    test('matches the textbook formula', () => {
        // residuals: 2, 0, 2; mean abs = 4/3
        expect(V.mae([1, 2, 3], [3, 2, 1])).toBeCloseTo(4 / 3, 6);
    });
});

describe('r2', () => {
    test('returns 1 when predicted equals observed', () => {
        expect(V.r2([1, 2, 3, 4], [1, 2, 3, 4])).toBe(1);
    });
    test('returns 0 when predicted equals the observed mean for every point', () => {
        const obs = [1, 2, 3, 4];
        const meanObs = (1 + 2 + 3 + 4) / 4;
        const pred = obs.map(() => meanObs);
        expect(V.r2(obs, pred)).toBeCloseTo(0, 6);
    });
    test('is negative when predictions are worse than the mean', () => {
        // observed: 1..4, predicted: 4..1 (inverted)
        const r = V.r2([1, 2, 3, 4], [4, 3, 2, 1]);
        expect(r).toBeLessThan(0);
    });
    test('returns NaN when the observed series has no variance', () => {
        expect(V.r2([5, 5, 5], [4, 5, 6])).toBeNaN();
    });
});

// ── evaluateChemicalFading ──────────────────────────────────────────────

describe('evaluateChemicalFading', () => {
    test('returns observed/predicted/residual arrays of equal length', () => {
        const rows = [
            { t_days: 30,  T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 1.0 },
            { t_days: 90,  T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 3.0 }
        ];
        const out = V.evaluateChemicalFading(rows);
        expect(out.observed).toHaveLength(2);
        expect(out.predicted).toHaveLength(2);
        expect(out.residuals).toHaveLength(2);
        expect(out.residuals[0]).toBeCloseTo(out.predicted[0] - out.observed[0], 6);
    });

    test('metrics object exposes n, rmse, mae, r2 and means', () => {
        const rows = [
            { t_days: 30,  T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 1.0 },
            { t_days: 90,  T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 3.0 },
            { t_days: 180, T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 6.0 }
        ];
        const { metrics } = V.evaluateChemicalFading(rows);
        expect(metrics.n).toBe(3);
        expect(typeof metrics.rmse).toBe('number');
        expect(typeof metrics.mae).toBe('number');
        // r2 may be NaN if predicted variance vanishes; either way it should be present
        expect('r2' in metrics).toBe(true);
        expect(typeof metrics.meanObserved).toBe('number');
        expect(typeof metrics.meanPredicted).toBe('number');
    });

    test('a self-consistent dataset (observed = model predictions) gives RMSE == 0', () => {
        // Generate "observations" by querying the model itself, then feed
        // those back into the harness. The fit must be perfect.
        const conditions = [
            { t_days: 30,  T_celsius: 40, RH_pct: 50, light_klux: 0 },
            { t_days: 90,  T_celsius: 40, RH_pct: 50, light_klux: 0 },
            { t_days: 200, T_celsius: 25, RH_pct: 60, light_klux: 1 }
        ];
        const rows = conditions.map(c => ({
            ...c,
            deltaE_observed: chemicalFading(c.T_celsius, c.RH_pct, c.light_klux, c.t_days).scientificDegradation
        }));
        const { metrics, residuals } = V.evaluateChemicalFading(rows);
        expect(metrics.rmse).toBeCloseTo(0, 9);
        expect(metrics.mae).toBeCloseTo(0, 9);
        for (const r of residuals) expect(Math.abs(r)).toBeLessThan(1e-9);
    });

    test('per-row records preserve the original row plus the prediction', () => {
        const rows = [
            { t_days: 30, T_celsius: 40, RH_pct: 50, light_klux: 0, deltaE_observed: 1.0,
              dataset: 'X', citation: 'cite' }
        ];
        const out = V.evaluateChemicalFading(rows);
        expect(out.perRow[0].row).toBe(rows[0]);
        expect(out.perRow[0].observed).toBe(1.0);
        expect(typeof out.perRow[0].predicted).toBe('number');
        expect(out.perRow[0].residual).toBeCloseTo(out.perRow[0].predicted - 1.0, 6);
    });

    test('the bundled demo fixture parses and evaluates end-to-end without errors', () => {
        const text = fs.readFileSync(FIXTURE, 'utf-8');
        const { rows, errors } = V.parseCsv(text);
        expect(errors).toEqual([]);
        const out = V.evaluateChemicalFading(rows);
        // Structure-only assertions — the demo "observed" column is placeholder
        // data, so we deliberately do NOT assert any specific RMSE bound here.
        expect(out.metrics.n).toBe(rows.length);
        expect(out.observed).toHaveLength(rows.length);
        expect(out.predicted).toHaveLength(rows.length);
    });
});

// ── REQUIRED_COLUMNS export ─────────────────────────────────────────────

describe('REQUIRED_COLUMNS', () => {
    test('lists the five numeric columns the harness expects', () => {
        expect(V.REQUIRED_COLUMNS).toEqual([
            't_days', 'T_celsius', 'RH_pct', 'light_klux', 'deltaE_observed'
        ]);
    });
});
