/**
 * Anomaly Detection Service
 *
 * Rule-based + 3σ statistical detectors applied on-demand to sensor
 * telemetry. No background jobs — computed when the dashboard or an
 * artifact detail view requests them.
 *
 * Rules:
 *   1. OFFLINE       — sensor.status.lastSeenAt > 2 h ago
 *   2. OUT_OF_RANGE  — latest T outside [-15, 45] °C or RH outside [0, 100] %
 *   3. FLAT_LINE     — stddev of last 6 h of T or RH < 0.05
 *   4. RAPID_CHANGE  — |ΔRH| > 5 %/h or |ΔT| > 3 °C/h between latest and 1 h ago
 *   5. SIGMA3        — latest reading outside ±3σ of 30-day rolling mean
 */

const { Sensor } = require('../../models/Sensor');
const { EnvironmentSample } = require('../../models/EnvironmentSample');

const OFFLINE_MS          = 2 * 60 * 60 * 1000;      // 2 h
const RAPID_WINDOW_MS     = 60 * 60 * 1000;          // 1 h
const FLAT_LINE_WINDOW_MS = 6 * 60 * 60 * 1000;      // 6 h
const FLAT_LINE_STD       = 0.05;
const SIGMA_WINDOW_MS     = 30 * 24 * 60 * 60 * 1000; // 30 days

const SEVERITY = {
    OFFLINE: 'high',
    OUT_OF_RANGE: 'critical',
    FLAT_LINE: 'medium',
    RAPID_CHANGE: 'medium',
    SIGMA3: 'low'
};

function alert(sensor, rule, message, detail = {}) {
    return {
        sensorGid:  sensor.gid,
        sensorName: sensor.name,
        caveGid:    sensor.location?.cave || null,
        rule,
        severity:   SEVERITY[rule] || 'medium',
        message,
        detail,
        detectedAt: new Date().toISOString()
    };
}

/** stddev of an array of numbers (population). */
function std(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
    return Math.sqrt(variance);
}

async function detectSensor(sensor, now = Date.now()) {
    const alerts = [];

    // --- Rule 1: OFFLINE -----------------------------------------------------
    const lastSeen = sensor.status?.lastSeenAt ? new Date(sensor.status.lastSeenAt).getTime() : null;
    if (lastSeen === null) {
        if (sensor.status?.active) {
            alerts.push(alert(sensor, 'OFFLINE', 'Sensor has never reported samples.',
                { lastSeenAt: null }));
        }
    } else {
        const ageMs = now - lastSeen;
        if (ageMs > OFFLINE_MS) {
            alerts.push(alert(sensor, 'OFFLINE',
                `Sensor has not reported in ${Math.round(ageMs / 60000)} minutes.`,
                { lastSeenAt: sensor.status.lastSeenAt, ageMinutes: Math.round(ageMs / 60000) }));
            // If offline, skip value-based detectors — they'd all fire stale
            return alerts;
        }
    }

    // --- Rule 2: OUT_OF_RANGE on latest reading ------------------------------
    const latest = await EnvironmentSample
        .findOne({ sensor: sensor._id })
        .sort({ timestamp: -1 })
        .lean();
    if (!latest) return alerts;

    if (latest.temperature < -15 || latest.temperature > 45) {
        alerts.push(alert(sensor, 'OUT_OF_RANGE',
            `Temperature ${latest.temperature.toFixed(1)} °C outside plausible [-15, 45] range.`,
            { channel: 'temperature', value: latest.temperature, timestamp: latest.timestamp }));
    }
    if (latest.humidity < 0 || latest.humidity > 100) {
        alerts.push(alert(sensor, 'OUT_OF_RANGE',
            `Humidity ${latest.humidity.toFixed(1)} % outside [0, 100] range.`,
            { channel: 'humidity', value: latest.humidity, timestamp: latest.timestamp }));
    }

    // --- Rule 3: FLAT_LINE ---------------------------------------------------
    const flatFrom = new Date(now - FLAT_LINE_WINDOW_MS);
    const recent = await EnvironmentSample
        .find({ sensor: sensor._id, timestamp: { $gte: flatFrom } })
        .select('temperature humidity')
        .lean();
    if (recent.length >= 10) {
        const tStd  = std(recent.map(s => s.temperature));
        const rhStd = std(recent.map(s => s.humidity));
        if (tStd < FLAT_LINE_STD) {
            alerts.push(alert(sensor, 'FLAT_LINE',
                `Temperature shows no variation over the last 6 h (stddev ${tStd.toExponential(2)}) — likely sensor fault.`,
                { channel: 'temperature', stddev: tStd, samples: recent.length }));
        }
        if (rhStd < FLAT_LINE_STD) {
            alerts.push(alert(sensor, 'FLAT_LINE',
                `Humidity shows no variation over the last 6 h (stddev ${rhStd.toExponential(2)}) — likely sensor fault.`,
                { channel: 'humidity', stddev: rhStd, samples: recent.length }));
        }
    }

    // --- Rule 4: RAPID_CHANGE ------------------------------------------------
    const hourAgoLowerBound = new Date(now - RAPID_WINDOW_MS - 10 * 60 * 1000);
    const hourAgoUpperBound = new Date(now - RAPID_WINDOW_MS + 10 * 60 * 1000);
    const near1hAgo = await EnvironmentSample
        .findOne({
            sensor: sensor._id,
            timestamp: { $gte: hourAgoLowerBound, $lte: hourAgoUpperBound }
        })
        .lean();
    if (near1hAgo) {
        const dT  = Math.abs(latest.temperature - near1hAgo.temperature);
        const dRH = Math.abs(latest.humidity    - near1hAgo.humidity);
        if (dT > 3) {
            alerts.push(alert(sensor, 'RAPID_CHANGE',
                `Temperature shifted ${dT.toFixed(1)} °C in the last hour — possible HVAC failure or sensor glitch.`,
                { channel: 'temperature', delta: dT, window: '1h' }));
        }
        if (dRH > 5) {
            alerts.push(alert(sensor, 'RAPID_CHANGE',
                `Humidity shifted ${dRH.toFixed(1)} % in the last hour — possible visitor surge, HVAC failure, or sensor glitch.`,
                { channel: 'humidity', delta: dRH, window: '1h' }));
        }
    }

    // --- Rule 5: SIGMA3 ------------------------------------------------------
    const sigmaFrom = new Date(now - SIGMA_WINDOW_MS);
    const baseline = await EnvironmentSample.aggregate([
        { $match: { sensor: sensor._id, timestamp: { $gte: sigmaFrom } } },
        { $group: {
            _id: null,
            tMean:  { $avg: '$temperature' }, tStd:  { $stdDevPop: '$temperature' },
            rhMean: { $avg: '$humidity' },    rhStd: { $stdDevPop: '$humidity' },
            count:  { $sum: 1 }
        }}
    ]);
    const b = baseline[0];
    if (b && b.count >= 100 && b.tStd > 0 && b.rhStd > 0) {
        const tZ  = Math.abs((latest.temperature - b.tMean) / b.tStd);
        const rhZ = Math.abs((latest.humidity    - b.rhMean) / b.rhStd);
        if (tZ > 3) {
            alerts.push(alert(sensor, 'SIGMA3',
                `Temperature ${latest.temperature.toFixed(1)} °C is ${tZ.toFixed(1)}σ outside the 30-day norm (mean ${b.tMean.toFixed(1)}, σ ${b.tStd.toFixed(2)}).`,
                { channel: 'temperature', z: tZ, mean: b.tMean, stddev: b.tStd }));
        }
        if (rhZ > 3) {
            alerts.push(alert(sensor, 'SIGMA3',
                `Humidity ${latest.humidity.toFixed(1)} % is ${rhZ.toFixed(1)}σ outside the 30-day norm (mean ${b.rhMean.toFixed(1)}, σ ${b.rhStd.toFixed(2)}).`,
                { channel: 'humidity', z: rhZ, mean: b.rhMean, stddev: b.rhStd }));
        }
    }

    return alerts;
}

module.exports = {
    SEVERITY,
    detectSensor,

    /** Run every detector across every active sensor. */
    async detectAll() {
        const sensors = await Sensor.find({ 'status.active': true });
        const results = [];
        for (const s of sensors) {
            const alerts = await detectSensor(s);
            if (alerts.length > 0) results.push(...alerts);
        }
        return results;
    },

    /** Detect anomalies for a single sensor (by gid). */
    async detectByGid(sensorGid) {
        const sensor = await Sensor.findOne({ gid: sensorGid });
        if (!sensor) return null;
        return detectSensor(sensor);
    }
};
