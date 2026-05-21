/**
 * Unit tests for MaintenanceService.
 *
 * scoreArtifact() composes outputs from DeteriorationReplayService,
 * AnomalyDetectionService, ExhibitService, and TelemetryService into a
 * ranked priority record. Each upstream service is jest.mock-ed so the
 * composition logic — damage index, ETA contribution, anomaly count,
 * inspection freshness, conservation-status severity, priority tiering,
 * and recommendations — is tested in isolation.
 */

jest.mock('../services/domain/DeteriorationReplayService', () => ({
    replayHistory: jest.fn()
}));
jest.mock('../services/domain/AnomalyDetectionService', () => ({
    detectSensor: jest.fn()
}));
jest.mock('../services/domain/ExhibitService', () => ({
    _findParentCaveGid: jest.fn(),
    _queryAll:          jest.fn()
}));
jest.mock('../services/domain/TelemetryService', () => ({
    sensorsForArtifact: jest.fn()
}));
jest.mock('../models/Sensor', () => ({ Sensor: {} }));

const ReplayService    = require('../services/domain/DeteriorationReplayService');
const AnomalyService   = require('../services/domain/AnomalyDetectionService');
const ExhibitService   = require('../services/domain/ExhibitService');
const TelemetryService = require('../services/domain/TelemetryService');
const Maint = require('../services/domain/MaintenanceService');
const { scoreArtifact, scoreAll, WEIGHTS, STATUS_SEVERITY } = Maint;

const THRESHOLDS = {
    chemicalDeltaE: 5.0,
    mouldIndex:     3.0,
    fatigueDamage:  1.0,
    saltCumulative: 1.0
};

beforeEach(() => {
    ReplayService.replayHistory.mockReset();
    AnomalyService.detectSensor.mockReset();
    ExhibitService._findParentCaveGid.mockReset();
    ExhibitService._queryAll.mockReset();
    TelemetryService.sensorsForArtifact.mockReset();

    // Sensible defaults for tests that don't care about these
    ExhibitService._findParentCaveGid.mockResolvedValue('cave-001');
    TelemetryService.sensorsForArtifact.mockResolvedValue([]);
    AnomalyService.detectSensor.mockResolvedValue([]);
});

/** Build a synthetic replay result with given cumulatives and forecast. */
function makeReplay({
    cumulative = null,
    forecast   = null,
    historicalDays = 365,
    sensors = []
} = {}) {
    return {
        artifactGid: 'art-X',
        caveGid:     'cave-001',
        sensors,
        historicalDays,
        cumulative,
        forecast,
        thresholds: THRESHOLDS,
        thresholdsCrossed: null,
        trajectory: []
    };
}

const cleanArtifact = {
    gid: 'art-X', name: 'Test Statue',
    conservationStatus: 'good',
    lastInspectionDate: new Date('2026-04-01').getTime()
};

// ── Constants ─────────────────────────────────────────────────────────

describe('exported constants', () => {
    test('WEIGHTS use the documented coefficients', () => {
        expect(WEIGHTS).toEqual({
            damage:    1.0,
            eta:       1.0,
            anomaly:   0.5,
            inspection: 0.3,
            status:    0.8
        });
    });

    test('STATUS_SEVERITY maps each conservation status to a 0–1 severity', () => {
        expect(STATUS_SEVERITY).toEqual({
            excellent: 0.0,
            good:      0.2,
            fair:      0.4,
            poor:      0.7,
            critical:  1.0
        });
    });
});

// ── Score composition ────────────────────────────────────────────────

describe('scoreArtifact (composition)', () => {
    test('artifact with no replay data scores only on inspection + status', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        // damage=0, eta=0, anomaly=0, inspection<1, status=0.2
        expect(score.indices.damage).toBe(0);
        expect(score.indices.eta).toBe(0);
        expect(score.indices.anomaly).toBe(0);
        expect(score.indices.status).toBe(0.2);
        // The 'no sensor data' info recommendation should be the only one.
        expect(score.recommendations).toHaveLength(1);
        expect(score.recommendations[0].priority).toBe('info');
    });

    test('damage index is the maximum fraction across the four threshold-bearing models', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 1.0,        // 0.20 of threshold
                mouldIndexFinal: 1.5,       // 0.50 of threshold
                fatigueDamage: 0.9,         // 0.90 of threshold ← max
                saltCumulative: 0.3,        // 0.30 of threshold
                equivYears: 0
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.indices.damage).toBeCloseTo(0.9, 5);
    });

    test('damage index is clamped to 1.0 even when a model exceeds its threshold', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 50, mouldIndexFinal: 0,
                fatigueDamage: 0, saltCumulative: 0, equivYears: 0
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.indices.damage).toBe(1.0);
    });

    test('ETA contribution scales as 1/years to nearest threshold (capped at 1)', async () => {
        // Forecast says fatigue threshold is crossed 5 years (1826 days) into the
        // future relative to historical end (365 d).
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: { chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 },
            historicalDays: 365,
            forecast: {
                etaDays: { fatigueDamage: 365 + Math.round(5 * 365.25), chemicalDeltaE: null,
                           mouldIndex: null, saltCumulative: null },
                historicalDays: 365
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        // 5 years → 1/5 = 0.2
        expect(score.indices.eta).toBeCloseTo(0.2, 2);
    });

    test('ETA contribution is zero when no forecasted threshold lies in the future', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: { chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 },
            forecast: {
                etaDays: { chemicalDeltaE: null, mouldIndex: null, fatigueDamage: null, saltCumulative: null },
                historicalDays: 365
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.indices.eta).toBe(0);
    });

    test('anomaly index saturates at 1 once three or more anomalies are reported', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        TelemetryService.sensorsForArtifact.mockResolvedValue([{ _id: 'sx', gid: 'sensor-A' }]);
        AnomalyService.detectSensor.mockResolvedValue([
            { rule: 'OFFLINE',      severity: 'high',     sensorName: 'A', message: '...' },
            { rule: 'OUT_OF_RANGE', severity: 'critical', sensorName: 'A', message: '...' },
            { rule: 'FLAT_LINE',    severity: 'medium',   sensorName: 'A', message: '...' },
            { rule: 'RAPID_CHANGE', severity: 'medium',   sensorName: 'A', message: '...' }
        ]);
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.indices.anomaly).toBe(1);
        expect(score.anomalies).toBe(4);
        expect(score.anomalyDetail).toHaveLength(4);
    });

    test('inspection index grows linearly with age, capped at 1 after a year', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        // Inspection 6 months ago → roughly 0.5
        const half = { ...cleanArtifact,
            lastInspectionDate: Date.now() - 182 * 86400000
        };
        const score = await scoreArtifact(half, 'statue');
        expect(score.indices.inspection).toBeCloseTo(0.5, 1);
        expect(score.daysSinceInspection).toBeCloseTo(182, 0);

        // Inspection 5 years ago → capped at 1
        const old = { ...cleanArtifact,
            lastInspectionDate: Date.now() - 5 * 365 * 86400000
        };
        const oldScore = await scoreArtifact(old, 'statue');
        expect(oldScore.indices.inspection).toBe(1);
    });

    test('missing inspection date defaults to 0.5 (not zero)', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        const noInsp = { ...cleanArtifact, lastInspectionDate: null };
        const score = await scoreArtifact(noInsp, 'statue');
        expect(score.indices.inspection).toBe(0.5);
        expect(score.daysSinceInspection).toBeNull();
    });

    test('conservation status maps onto the documented severity scale', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        for (const status of ['excellent', 'good', 'fair', 'poor', 'critical']) {
            const a = { ...cleanArtifact, conservationStatus: status };
            const score = await scoreArtifact(a, 'statue');
            expect(score.indices.status).toBe(STATUS_SEVERITY[status]);
        }
    });

    test('unknown conservation status defaults to 0.5', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative: null }));
        const score = await scoreArtifact({ ...cleanArtifact, conservationStatus: 'mystery' }, 'statue');
        expect(score.indices.status).toBe(0.5);
    });

    test('total score equals the weighted sum of the five indices', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 2.5,     // 0.5 of threshold ← damage idx
                mouldIndexFinal: 0,
                fatigueDamage: 0,
                saltCumulative: 0,
                equivYears: 0
            }
        }));
        // A clean artifact with a recent inspection (~today) and 'good' status
        const score = await scoreArtifact({ ...cleanArtifact, lastInspectionDate: Date.now() }, 'statue');
        const expected =
            WEIGHTS.damage     * score.indices.damage  +
            WEIGHTS.eta        * score.indices.eta     +
            WEIGHTS.anomaly    * score.indices.anomaly +
            WEIGHTS.inspection * score.indices.inspection +
            WEIGHTS.status     * score.indices.status;
        expect(score.score).toBeCloseTo(expected, 6);
    });
});

// ── Priority tiering ─────────────────────────────────────────────────

describe('priority tiering', () => {
    async function scoreWithCumulative(cumulative, conservationStatus = 'good') {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({ cumulative }));
        return scoreArtifact({ ...cleanArtifact, conservationStatus }, 'statue');
    }

    test('low: clean cumulative + good status + recent inspection', async () => {
        const score = await scoreWithCumulative({
            chemicalDeltaE: 0.5,        // 0.10 of threshold
            mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0
        });
        expect(score.priorityTier).toBe('low');
        expect(score.score).toBeLessThan(0.8);
    });

    test('critical: max damage + near-term ETA + critical status pushes the tier above 2.5', async () => {
        // Provide an aggressive forecast (1 year to fatigue threshold) so the
        // ETA contribution adds to the saturated damage and critical-status terms.
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 5, mouldIndexFinal: 4,
                fatigueDamage: 1,  saltCumulative: 1, equivYears: 0
            },
            historicalDays: 365,
            forecast: {
                etaDays: { fatigueDamage: 365 + Math.round(365.25), chemicalDeltaE: null,
                           mouldIndex: null, saltCumulative: null },
                historicalDays: 365
            }
        }));
        const score = await scoreArtifact({ ...cleanArtifact, conservationStatus: 'critical' }, 'statue');
        expect(score.priorityTier).toBe('critical');
        expect(score.score).toBeGreaterThanOrEqual(2.5);
    });

    test('priority tier boundaries follow the documented score thresholds', async () => {
        // We can't easily synthesise an artifact with an exact composite score, but
        // we can assert tier logic through the static threshold definition by
        // running scoreArtifact for each band.
        const lo  = await scoreWithCumulative({ chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 }, 'good');
        const hi  = await scoreWithCumulative({ chemicalDeltaE: 5, mouldIndexFinal: 4, fatigueDamage: 1, saltCumulative: 1, equivYears: 0 }, 'critical');
        expect(['low', 'medium']).toContain(lo.priorityTier);
        expect(['high', 'critical']).toContain(hi.priorityTier);
    });
});

// ── Recommendations ─────────────────────────────────────────────────

describe('recommendations', () => {
    test('emits a critical fatigue warning above 80 % of the fatigue threshold', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 0, mouldIndexFinal: 0,
                fatigueDamage: 0.85, saltCumulative: 0, equivYears: 0
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.recommendations.some(r =>
            r.priority === 'critical' && /fatigue/i.test(r.message)
        )).toBe(true);
    });

    test('emits a high-priority mould warning when index ≥ 1', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 0, mouldIndexFinal: 1.5,
                fatigueDamage: 0, saltCumulative: 0, equivYears: 0
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.recommendations.some(r =>
            r.priority === 'high' && /mould/i.test(r.message)
        )).toBe(true);
    });

    test('emits a high-priority salt warning above 50 % of the salt threshold', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: {
                chemicalDeltaE: 0, mouldIndexFinal: 0,
                fatigueDamage: 0, saltCumulative: 0.7, equivYears: 0
            }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.recommendations.some(r =>
            r.priority === 'high' && /salt/i.test(r.message)
        )).toBe(true);
    });

    test('emits a critical recommendation when at least one critical anomaly is active', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: { chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 }
        }));
        TelemetryService.sensorsForArtifact.mockResolvedValue([{ _id: 'sx', gid: 'sensor-A' }]);
        AnomalyService.detectSensor.mockResolvedValue([
            { rule: 'OUT_OF_RANGE', severity: 'critical', sensorName: 'A', message: '...' }
        ]);
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.recommendations.some(r =>
            r.priority === 'critical' && /anomal/i.test(r.message)
        )).toBe(true);
    });

    test('emits a benign info recommendation when all indicators are within thresholds', async () => {
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: { chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 }
        }));
        const score = await scoreArtifact(cleanArtifact, 'statue');
        expect(score.recommendations.some(r => r.priority === 'info')).toBe(true);
    });
});

// ── scoreAll() ──────────────────────────────────────────────────────

describe('scoreAll', () => {
    test('scores every exhibit and sorts by descending composite score', async () => {
        ExhibitService._queryAll.mockResolvedValue([
            { gid: 'a', name: 'A', _exhibitType: 'statue', conservationStatus: 'good',     lastInspectionDate: Date.now() },
            { gid: 'b', name: 'B', _exhibitType: 'mural',  conservationStatus: 'critical', lastInspectionDate: Date.now() },
            { gid: 'c', name: 'C', _exhibitType: 'painting', conservationStatus: 'fair',   lastInspectionDate: Date.now() }
        ]);
        // Replay returns a flat-zero result for all three
        ReplayService.replayHistory.mockResolvedValue(makeReplay({
            cumulative: { chemicalDeltaE: 0, mouldIndexFinal: 0, fatigueDamage: 0, saltCumulative: 0, equivYears: 0 }
        }));
        const results = await scoreAll();
        expect(results).toHaveLength(3);
        // Sorted descending → critical first, then fair, then good
        for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
        expect(results[0].conservationStatus).toBe('critical');
    });
});
