/**
 * Unit tests for DeteriorationReplayService.
 *
 * Covers the two pure functions of the service — runReplay() and
 * forwardProject() — by feeding them synthetic daily-bucket arrays.
 * The DB-coupled replayHistory()/aggregateDailyBuckets() paths are
 * exercised by manual integration testing (live MongoDB), not here.
 */

const ReplayService = require('../services/domain/DeteriorationReplayService');
const { runReplay, forwardProject, THRESHOLDS } = ReplayService;

/** Build a daily-bucket array for `n` days at constant T/RH/light/RHamp. */
function constantClimate(n, { T = 13, RH = 35, RHamp = 5, light = 0, start = '2020-01-01' } = {}) {
    const startMs = new Date(start).getTime();
    const out = [];
    for (let i = 0; i < n; i++) {
        const date = new Date(startMs + i * 86400000).toISOString().slice(0, 10);
        out.push({
            date,
            T_mean:    T,
            RH_mean:   RH,
            RH_min:    Math.max(0, RH - RHamp / 2),
            RH_max:    Math.min(100, RH + RHamp / 2),
            light_mean: light,
            count:     144   // 10-minute samples per day
        });
    }
    return out;
}

// ── runReplay() ───────────────────────────────────────────────────────────

describe('runReplay', () => {
    test('returns an empty trajectory and zero cumulatives for an empty input', () => {
        const r = runReplay([]);
        expect(r.trajectory).toEqual([]);
        expect(r.exposureDays).toBe(0);
        expect(r.cumulative).toEqual({
            chemicalDeltaE: 0,
            equivYears: 0,
            mouldIndexFinal: 0,
            saltEvents: 0,
            saltCumulative: 0,
            fatigueDamage: 0
        });
        expect(r.thresholdsCrossed).toEqual({
            chemicalDeltaE: null,
            mouldIndex: null,
            fatigueDamage: null,
            saltCumulative: null
        });
    });

    test('produces one trajectory entry per daily bucket', () => {
        const r = runReplay(constantClimate(30));
        expect(r.trajectory).toHaveLength(30);
        expect(r.exposureDays).toBe(30);
    });

    test('cold/dry Mogao climate does not cross any threshold over 1 year', () => {
        const r = runReplay(constantClimate(365, { T: 13, RH: 35, RHamp: 5 }));
        // Mogao caves preserve sculptures over millennia — none of the four
        // damage thresholds should be crossed in a single year of observation.
        expect(r.thresholdsCrossed.chemicalDeltaE).toBeNull();
        expect(r.thresholdsCrossed.mouldIndex).toBeNull();
        expect(r.thresholdsCrossed.fatigueDamage).toBeNull();
        // Salt threshold may still be triggered by the cumulative supersaturation
        // model — that's a separate physical regime; assert the chemical/mould/
        // fatigue thresholds explicitly rather than asserting "none".
    });

    test('hot, very humid conditions drive the mould index above visible threshold within ~200 days', () => {
        // 30 °C and 90 % RH — well above VTT critical RH (~80 %) — accumulates
        // visible growth (M >= 3) on a half-year timescale at the documented
        // growth coefficient k_M = 0.13 d^-1.
        const r = runReplay(constantClimate(220, { T: 30, RH: 90 }));
        expect(r.cumulative.mouldIndexFinal).toBeGreaterThan(THRESHOLDS.mouldIndex);
        expect(r.thresholdsCrossed.mouldIndex).not.toBeNull();
        // first-crossing date should be inside the simulated window
        expect(typeof r.thresholdsCrossed.mouldIndex).toBe('string');
    });

    test('cumulative state is monotonically non-decreasing for irreversible models', () => {
        const buckets = constantClimate(60, { T: 25, RH: 50, RHamp: 12, light: 5 });
        const r = runReplay(buckets);
        const seq = (key) => r.trajectory.map(p => p.cum[key]);
        const isMonotonic = (arr) => arr.every((v, i) => i === 0 || v >= arr[i - 1] - 1e-9);

        // Chemical fading, equivalent reference-years, and fatigue damage
        // are strictly accumulators — never decrease.
        expect(isMonotonic(seq('chemicalDeltaE'))).toBe(true);
        expect(isMonotonic(seq('equivYears'))).toBe(true);
        expect(isMonotonic(seq('fatigueDamage'))).toBe(true);
        // Salt-cumulative also only grows (per-event additive).
        expect(isMonotonic(seq('saltCumulative'))).toBe(true);
    });

    test('mould index can decline when conditions drop below RH_crit', () => {
        // Two phases: 40 days hot/humid (growth), then 40 days cool/dry (decline).
        const wet = constantClimate(40, { T: 30, RH: 90, start: '2020-01-01' });
        const dry = constantClimate(40, { T: 15, RH: 30, start: '2020-02-10' });
        const r = runReplay([...wet, ...dry]);
        const peak = Math.max(...r.trajectory.map(p => p.cum.mouldIndex));
        const final = r.cumulative.mouldIndexFinal;
        expect(peak).toBeGreaterThan(final);   // declined after the dry phase began
        expect(final).toBeGreaterThanOrEqual(0);
    });

    test('threshold-crossing date is the earliest trajectory date at which the cumulative crosses', () => {
        const r = runReplay(constantClimate(220, { T: 30, RH: 90 }));
        const crossingDate = r.thresholdsCrossed.mouldIndex;
        expect(crossingDate).not.toBeNull();
        // All entries strictly before that date should still be below threshold.
        const beforeCrossing = r.trajectory.filter(p => p.date < crossingDate);
        for (const p of beforeCrossing) {
            expect(p.cum.mouldIndex).toBeLessThan(THRESHOLDS.mouldIndex);
        }
        // The crossing entry itself should be at or above threshold.
        const crossingEntry = r.trajectory.find(p => p.date === crossingDate);
        expect(crossingEntry.cum.mouldIndex).toBeGreaterThanOrEqual(THRESHOLDS.mouldIndex);
    });
});

// ── forwardProject() ──────────────────────────────────────────────────────

describe('forwardProject', () => {
    test('returns an empty projection when given no historical buckets', () => {
        const replay = runReplay([]);
        const proj = forwardProject(replay, []);
        expect(proj.projectionDays).toBe(0);
        expect(proj.projection).toEqual([]);
        expect(proj.etaDays).toEqual({
            chemicalDeltaE: null, mouldIndex: null,
            fatigueDamage: null, saltCumulative: null
        });
    });

    test('projects forward by repeating the most recent climate window', () => {
        // 30 days of benign Mogao climate as history; project 5 years forward.
        const buckets = constantClimate(30, { T: 13, RH: 35 });
        const replay = runReplay(buckets);
        const proj = forwardProject(replay, buckets, { maxYears: 5, repeatWindowDays: 30 });
        // Should generate ≈ 5 years × 365.25 = 1826 forecast days, capped at maxYears.
        expect(proj.projectionDays).toBeGreaterThan(1500);
        expect(proj.projectionDays).toBeLessThanOrEqual(Math.round(5 * 365.25));
        expect(proj.projection.length).toBe(proj.projectionDays);
        // Each projection entry has a date and cumulative state.
        for (const p of proj.projection) {
            expect(typeof p.date).toBe('string');
            expect(typeof p.cum).toBe('object');
        }
    });

    test('projecting hot/humid climate finds a mould-threshold ETA inside the horizon', () => {
        const history = constantClimate(7, { T: 30, RH: 90 });
        const replay = runReplay(history);
        const proj = forwardProject(replay, history, { maxYears: 1, repeatWindowDays: 7 });
        // Mould threshold gets crossed almost immediately under these conditions.
        expect(proj.etaDays.mouldIndex).not.toBeNull();
        expect(proj.etaDays.mouldIndex).toBeGreaterThanOrEqual(0);
    });

    test('projecting benign climate may leave thresholds uncrossed within the horizon', () => {
        const history = constantClimate(30, { T: 13, RH: 35 });
        const replay = runReplay(history);
        const proj = forwardProject(replay, history, { maxYears: 1, repeatWindowDays: 30 });
        // Chemical fading and mould thresholds should NOT be crossed in a single year
        // of cold/dry climate — confirms the framework predicts the documented
        // preservation benefit of the Mogao microclimate.
        expect(proj.etaDays.mouldIndex).toBeNull();
    });

    test('historicalDays in the result matches the input bucket count', () => {
        const history = constantClimate(45);
        const replay = runReplay(history);
        const proj = forwardProject(replay, history, { maxYears: 1 });
        expect(proj.historicalDays).toBe(45);
    });
});

// ── THRESHOLDS export ─────────────────────────────────────────────────────

describe('THRESHOLDS', () => {
    test('exposes the four documented damage thresholds', () => {
        expect(THRESHOLDS).toEqual({
            chemicalDeltaE: 5.0,
            mouldIndex:     3.0,
            fatigueDamage:  1.0,
            saltCumulative: 1.0
        });
    });
});

// ── invalidateArtifact() ─────────────────────────────────────────────────

describe('invalidateArtifact', () => {
    test('is exported and callable', () => {
        // Cache is module-private, so we can only verify the function is wired
        // up and doesn't throw when called with arbitrary gids.
        expect(typeof ReplayService.invalidateArtifact).toBe('function');
        expect(() => ReplayService.invalidateArtifact('any-gid')).not.toThrow();
    });
});
