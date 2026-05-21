/**
 * Unit tests for AnomalyDetectionService.
 *
 * Each of the five rules — OFFLINE, OUT_OF_RANGE, FLAT_LINE, RAPID_CHANGE,
 * SIGMA3 — is exercised in isolation. The Mongoose models are stubbed via
 * jest.mock so the service runs without a database. The chainable query
 * builders (findOne().sort().lean(), find().select().lean(), aggregate())
 * are reproduced as mock objects with controllable resolved values.
 */

jest.mock('../models/Sensor', () => ({ Sensor: { find: jest.fn() } }));
jest.mock('../models/EnvironmentSample', () => ({
    EnvironmentSample: {
        findOne:   jest.fn(),
        find:      jest.fn(),
        aggregate: jest.fn()
    }
}));

const { EnvironmentSample } = require('../models/EnvironmentSample');
const Anomaly = require('../services/domain/AnomalyDetectionService');
const { detectSensor, SEVERITY } = Anomaly;

// ── Helpers ─────────────────────────────────────────────────────────────

/** Build a chainable query stub that resolves to `value` at .lean(). */
function leanQuery(value) {
    const chain = {
        sort:   () => chain,
        select: () => chain,
        lean:   () => Promise.resolve(value)
    };
    return chain;
}

/** Reset all model mocks to a benign empty-DB state before each test. */
function resetMocks() {
    EnvironmentSample.findOne.mockReset();
    EnvironmentSample.find.mockReset();
    EnvironmentSample.aggregate.mockReset();
    // Default: no samples, no baseline
    EnvironmentSample.findOne.mockReturnValue(leanQuery(null));
    EnvironmentSample.find.mockReturnValue(leanQuery([]));
    EnvironmentSample.aggregate.mockResolvedValue([]);
}

beforeEach(resetMocks);

const baseSensor = {
    _id: 'sensor-mongo-id',
    gid: 'sensor-A',
    name: 'Test Sensor A',
    location: { cave: 'cave-001' },
    status: { active: true, lastSeenAt: new Date('2026-04-28T12:00:00Z') }
};

const REFERENCE_NOW = new Date('2026-04-28T12:00:00Z').getTime();

// ── SEVERITY map ───────────────────────────────────────────────────────

describe('SEVERITY map', () => {
    test('matches the documented severity levels for all five rules', () => {
        expect(SEVERITY).toEqual({
            OFFLINE:      'high',
            OUT_OF_RANGE: 'critical',
            FLAT_LINE:    'medium',
            RAPID_CHANGE: 'medium',
            SIGMA3:       'low'
        });
    });
});

// ── Rule 1: OFFLINE ────────────────────────────────────────────────────

describe('OFFLINE rule', () => {
    test('does not fire when last sample is recent', async () => {
        const sensor = { ...baseSensor,
            status: { active: true, lastSeenAt: new Date(REFERENCE_NOW - 30 * 60 * 1000) } // 30 min ago
        };
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'OFFLINE')).toBeUndefined();
    });

    test('fires when last sample is older than 2 hours', async () => {
        const sensor = { ...baseSensor,
            status: { active: true, lastSeenAt: new Date(REFERENCE_NOW - 3 * 60 * 60 * 1000) } // 3 h ago
        };
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        const offline = alerts.find(a => a.rule === 'OFFLINE');
        expect(offline).toBeDefined();
        expect(offline.severity).toBe('high');
        expect(offline.detail.ageMinutes).toBeGreaterThanOrEqual(180);
    });

    test('fires when an active sensor has never reported', async () => {
        const sensor = { ...baseSensor, status: { active: true, lastSeenAt: null } };
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        const offline = alerts.find(a => a.rule === 'OFFLINE');
        expect(offline).toBeDefined();
        expect(offline.detail.lastSeenAt).toBeNull();
    });

    test('does not fire on inactive sensors that have never reported', async () => {
        const sensor = { ...baseSensor, status: { active: false, lastSeenAt: null } };
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'OFFLINE')).toBeUndefined();
    });

    test('short-circuits value-based detectors when the sensor is offline', async () => {
        const sensor = { ...baseSensor,
            status: { active: true, lastSeenAt: new Date(REFERENCE_NOW - 4 * 60 * 60 * 1000) }
        };
        // Stub a wildly out-of-range latest sample — must NOT be reported because
        // we should short-circuit on OFFLINE before querying the latest sample.
        EnvironmentSample.findOne.mockReturnValue(leanQuery({
            temperature: 99, humidity: 200, timestamp: new Date()
        }));
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        expect(alerts.length).toBe(1);
        expect(alerts[0].rule).toBe('OFFLINE');
    });
});

// ── Rule 2: OUT_OF_RANGE ───────────────────────────────────────────────

describe('OUT_OF_RANGE rule', () => {
    function fresh(latest) {
        // Resets findOne so the FIRST call returns `latest` (used by OUT_OF_RANGE).
        EnvironmentSample.findOne.mockReset();
        EnvironmentSample.findOne
            .mockReturnValueOnce(leanQuery(latest))   // OUT_OF_RANGE pull
            .mockReturnValueOnce(leanQuery(null));    // RAPID_CHANGE 1h-ago pull
    }

    test('fires when temperature is below the plausible floor', async () => {
        fresh({ temperature: -20, humidity: 40, timestamp: new Date() });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        const a = alerts.find(x => x.rule === 'OUT_OF_RANGE' && x.detail.channel === 'temperature');
        expect(a).toBeDefined();
        expect(a.severity).toBe('critical');
    });

    test('fires when temperature is above the plausible ceiling', async () => {
        fresh({ temperature: 60, humidity: 40, timestamp: new Date() });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.some(a => a.rule === 'OUT_OF_RANGE' && a.detail.value === 60)).toBe(true);
    });

    test('fires when humidity is negative', async () => {
        fresh({ temperature: 20, humidity: -5, timestamp: new Date() });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.some(a => a.rule === 'OUT_OF_RANGE' && a.detail.channel === 'humidity')).toBe(true);
    });

    test('fires when humidity is above 100 %', async () => {
        fresh({ temperature: 20, humidity: 105, timestamp: new Date() });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.some(a => a.rule === 'OUT_OF_RANGE' && a.detail.channel === 'humidity')).toBe(true);
    });

    test('does not fire on plausible Mogao readings', async () => {
        fresh({ temperature: 13, humidity: 35, timestamp: new Date() });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'OUT_OF_RANGE')).toBeUndefined();
    });
});

// ── Rule 3: FLAT_LINE ──────────────────────────────────────────────────

describe('FLAT_LINE rule', () => {
    function setup({ latest, recent }) {
        EnvironmentSample.findOne.mockReset();
        EnvironmentSample.findOne
            .mockReturnValueOnce(leanQuery(latest))
            .mockReturnValueOnce(leanQuery(null));
        EnvironmentSample.find.mockReturnValue(leanQuery(recent));
    }

    test('fires when temperature stddev is below 0.05 over 6 h with >= 10 samples', async () => {
        const latest = { temperature: 20.0, humidity: 50, timestamp: new Date() };
        // 12 samples, T constant, RH varying so only the T flat-line fires.
        const recent = Array.from({ length: 12 }, () => ({ temperature: 20.0, humidity: 50 + Math.random() * 5 }));
        setup({ latest, recent });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        const flat = alerts.filter(a => a.rule === 'FLAT_LINE');
        expect(flat.some(a => a.detail.channel === 'temperature')).toBe(true);
        expect(flat.some(a => a.detail.channel === 'humidity')).toBe(false);
    });

    test('fires when humidity stddev is below 0.05', async () => {
        const latest = { temperature: 20, humidity: 50.0, timestamp: new Date() };
        const recent = Array.from({ length: 12 }, () => ({ temperature: 18 + Math.random() * 4, humidity: 50.0 }));
        setup({ latest, recent });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.some(a => a.rule === 'FLAT_LINE' && a.detail.channel === 'humidity')).toBe(true);
    });

    test('does not fire with fewer than 10 samples even when stddev is zero', async () => {
        const latest = { temperature: 20, humidity: 50, timestamp: new Date() };
        const recent = Array.from({ length: 5 }, () => ({ temperature: 20, humidity: 50 }));
        setup({ latest, recent });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'FLAT_LINE')).toBeUndefined();
    });

    test('does not fire when both channels show normal variation', async () => {
        const latest = { temperature: 20, humidity: 50, timestamp: new Date() };
        const recent = Array.from({ length: 12 }, (_, i) => ({
            temperature: 19 + Math.random() * 2,
            humidity:    45 + Math.random() * 10
        }));
        setup({ latest, recent });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'FLAT_LINE')).toBeUndefined();
    });
});

// ── Rule 4: RAPID_CHANGE ───────────────────────────────────────────────

describe('RAPID_CHANGE rule', () => {
    function setup({ latest, hourAgo }) {
        EnvironmentSample.findOne.mockReset();
        EnvironmentSample.findOne
            .mockReturnValueOnce(leanQuery(latest))
            .mockReturnValueOnce(leanQuery(hourAgo));
    }

    test('fires when |ΔT| > 3 °C in the last hour', async () => {
        setup({
            latest:  { temperature: 25, humidity: 50, timestamp: new Date() },
            hourAgo: { temperature: 20, humidity: 49 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        const a = alerts.find(x => x.rule === 'RAPID_CHANGE' && x.detail.channel === 'temperature');
        expect(a).toBeDefined();
        expect(a.detail.delta).toBeCloseTo(5, 5);
    });

    test('fires when |ΔRH| > 5 % in the last hour', async () => {
        setup({
            latest:  { temperature: 20, humidity: 60, timestamp: new Date() },
            hourAgo: { temperature: 20, humidity: 50 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        const a = alerts.find(x => x.rule === 'RAPID_CHANGE' && x.detail.channel === 'humidity');
        expect(a).toBeDefined();
        expect(a.detail.delta).toBeCloseTo(10, 5);
    });

    test('does not fire when changes are within thresholds', async () => {
        setup({
            latest:  { temperature: 20.5, humidity: 51, timestamp: new Date() },
            hourAgo: { temperature: 20.0, humidity: 50 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'RAPID_CHANGE')).toBeUndefined();
    });

    test('does not fire when no comparable sample exists 1 h ago', async () => {
        setup({
            latest:  { temperature: 30, humidity: 80, timestamp: new Date() },
            hourAgo: null
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'RAPID_CHANGE')).toBeUndefined();
    });
});

// ── Rule 5: SIGMA3 ─────────────────────────────────────────────────────

describe('SIGMA3 rule', () => {
    function setup({ latest, baseline }) {
        EnvironmentSample.findOne.mockReset();
        EnvironmentSample.findOne
            .mockReturnValueOnce(leanQuery(latest))
            .mockReturnValueOnce(leanQuery(null));
        EnvironmentSample.aggregate.mockResolvedValue(baseline ? [baseline] : []);
    }

    test('fires when latest temperature is more than 3σ outside the 30-day mean', async () => {
        setup({
            latest:   { temperature: 30, humidity: 50, timestamp: new Date() },
            baseline: { tMean: 20, tStd: 2, rhMean: 50, rhStd: 5, count: 4000 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        const a = alerts.find(x => x.rule === 'SIGMA3' && x.detail.channel === 'temperature');
        expect(a).toBeDefined();
        expect(a.detail.z).toBeGreaterThan(3);
    });

    test('fires when latest humidity is more than 3σ outside the 30-day mean', async () => {
        setup({
            latest:   { temperature: 20, humidity: 90, timestamp: new Date() },
            baseline: { tMean: 20, tStd: 2, rhMean: 50, rhStd: 8, count: 4000 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.some(a => a.rule === 'SIGMA3' && a.detail.channel === 'humidity')).toBe(true);
    });

    test('does not fire when within 3σ of baseline', async () => {
        setup({
            latest:   { temperature: 23, humidity: 55, timestamp: new Date() },
            baseline: { tMean: 20, tStd: 2, rhMean: 50, rhStd: 5, count: 4000 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'SIGMA3')).toBeUndefined();
    });

    test('does not fire when baseline has fewer than 100 samples', async () => {
        setup({
            latest:   { temperature: 30, humidity: 50, timestamp: new Date() },
            baseline: { tMean: 20, tStd: 2, rhMean: 50, rhStd: 5, count: 50 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'SIGMA3')).toBeUndefined();
    });

    test('does not fire when baseline stddev is zero (degenerate)', async () => {
        setup({
            latest:   { temperature: 30, humidity: 50, timestamp: new Date() },
            baseline: { tMean: 20, tStd: 0, rhMean: 50, rhStd: 0, count: 4000 }
        });
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts.find(a => a.rule === 'SIGMA3')).toBeUndefined();
    });
});

// ── Compound behaviour ─────────────────────────────────────────────────

describe('detectSensor (composition)', () => {
    test('returns no alerts for a healthy sensor with normal readings', async () => {
        EnvironmentSample.findOne.mockReset();
        EnvironmentSample.findOne
            .mockReturnValueOnce(leanQuery({ temperature: 13, humidity: 35, timestamp: new Date() }))
            .mockReturnValueOnce(leanQuery({ temperature: 13, humidity: 35 }));
        EnvironmentSample.find.mockReturnValue(leanQuery(
            Array.from({ length: 12 }, (_, i) => ({
                temperature: 13 + Math.random() * 0.5,
                humidity:    35 + Math.random() * 2
            }))
        ));
        EnvironmentSample.aggregate.mockResolvedValue([
            { tMean: 13, tStd: 0.5, rhMean: 35, rhStd: 3, count: 4000 }
        ]);
        const alerts = await detectSensor(baseSensor, REFERENCE_NOW);
        expect(alerts).toEqual([]);
    });

    test('alerts include the sensor gid and parent cave', async () => {
        const sensor = { ...baseSensor, status: { active: true, lastSeenAt: null } };
        const alerts = await detectSensor(sensor, REFERENCE_NOW);
        expect(alerts[0].sensorGid).toBe(sensor.gid);
        expect(alerts[0].sensorName).toBe(sensor.name);
        expect(alerts[0].caveGid).toBe(sensor.location.cave);
        expect(typeof alerts[0].detectedAt).toBe('string');
    });
});
