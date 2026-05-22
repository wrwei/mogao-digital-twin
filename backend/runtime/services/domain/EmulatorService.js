/**
 * EmulatorService — synthetic-data generator + ticker for sensors.
 *
 * Shared the math with `scripts/emulate-sensor.js` (CLI) but lives in-process
 * so the frontend can start/stop/configure it via REST. State is in-memory:
 *
 *     _runners: { [sensorGid]: {
 *         timer: NodeJS.Timeout,
 *         config: { cadenceSec, channels, params },
 *         stats: { startedAt, sampleCount, lastSample, lastError }
 *     } }
 *
 * On server restart all runners vanish — that's the intended behaviour for
 * a development/demo facility. Persistence would only complicate the
 * lifecycle (e.g. should a runner survive a crash that produced bad data?).
 *
 * Samples are pushed through TelemetryService directly — no HTTP / sensor-key
 * round-trip, since the server already has the Sensor document.
 */

const { Sensor } = require('../../models/Sensor');
const TelemetryService = require('./TelemetryService');

const DEFAULT_PARAMS = {
    tMean: 13,                    // °C — annual mean
    tAmplitudeAnnual: 2,          // °C — peaks late July, troughs late January
    tAmplitudeDiurnal: 0.8,       // °C — peaks ~15:00, troughs ~03:00
    rhMean: 40,                   // %  — annual mean
    rhAmplitudeAnnual: 8,         // %
    rhAmplitudeDiurnal: 2,        // %
    summerSpikeProbability: 0.02, // per-tick chance of a rainfall jump during Jun–Sep
    summerSpikeMin: 15,           // %  — minimum jump
    summerSpikeMax: 30,           // %  — maximum jump
    lightKlux: 0                  // cave interior baseline
};

const _runners = new Map();   // sensorGid → runner

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function _genSample(date, channels, params) {
    const t = new Date(date);
    const dayOfYear = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
    const annual = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
    const hourOfDay = t.getHours() + t.getMinutes() / 60;
    const diurnal = Math.sin(((hourOfDay - 9) / 24) * 2 * Math.PI);

    const sample = { timestamp: t };

    if (channels.includes('temperature')) {
        const v = params.tMean
                + params.tAmplitudeAnnual * annual
                + params.tAmplitudeDiurnal * diurnal
                + (Math.random() - 0.5) * 0.4;
        sample.temperature = Math.round(v * 100) / 100;
    }
    if (channels.includes('humidity')) {
        let rh = params.rhMean
               + params.rhAmplitudeAnnual * annual
               + params.rhAmplitudeDiurnal * diurnal
               + (Math.random() - 0.5) * 3;
        const month = t.getMonth();
        const isSummer = month >= 5 && month <= 8;
        if (isSummer && Math.random() < (params.summerSpikeProbability || 0)) {
            const jump = (params.summerSpikeMin || 0)
                       + Math.random() * Math.max(0, (params.summerSpikeMax || 0) - (params.summerSpikeMin || 0));
            rh += jump;
        }
        sample.humidity = Math.round(clamp(rh, 15, 95) * 100) / 100;
    }
    if (channels.includes('light')) {
        sample.lightKlux = params.lightKlux || 0;
    }

    return sample;
}

function _mergeParams(partial) {
    return { ...DEFAULT_PARAMS, ...(partial || {}) };
}

async function _resolveSensor(sensorGid) {
    const sensor = await Sensor.findOne({ gid: sensorGid });
    if (!sensor) throw new Error(`Sensor not found: ${sensorGid}`);
    return sensor;
}

/**
 * Snapshot of the runner state for one sensor — JSON-safe.
 */
function _snapshot(sensorGid) {
    const r = _runners.get(sensorGid);
    if (!r) return { running: false, sensorGid };
    return {
        running: true,
        sensorGid,
        config: r.config,
        stats: {
            startedAt: r.stats.startedAt,
            sampleCount: r.stats.sampleCount,
            lastSample: r.stats.lastSample,
            lastError: r.stats.lastError
        }
    };
}

/** Return runner state for every sensor (running + idle). */
async function status() {
    const sensors = await Sensor.find().select('gid name channels location status');
    return sensors.map(s => {
        const snap = _snapshot(s.gid);
        return {
            sensor: {
                gid: s.gid,
                name: s.name,
                channels: s.channels,
                cave: s.location && s.location.cave,
                explicitArtifacts: (s.location && s.location.explicitArtifacts) || [],
                active: s.status && s.status.active !== false
            },
            ...snap
        };
    });
}

/**
 * Start or restart the runner for a sensor. If a runner exists, it's stopped
 * first and replaced with a new one using the new config — frontend doesn't
 * need a separate "update config while running" call.
 */
async function start(sensorGid, { cadenceSec, channels, params } = {}) {
    const sensor = await _resolveSensor(sensorGid);
    stop(sensorGid);

    const config = {
        cadenceSec: Math.max(1, Number(cadenceSec) || 10),
        channels: Array.isArray(channels) && channels.length
            ? channels
            : (sensor.channels || ['temperature', 'humidity']).filter(c => c !== 'image'),
        params: _mergeParams(params)
    };

    const stats = {
        startedAt: new Date(),
        sampleCount: 0,
        lastSample: null,
        lastError: null
    };

    const tick = async () => {
        const sample = _genSample(Date.now(), config.channels, config.params);
        try {
            await TelemetryService.ingestBatch(sensor, [sample]);
            stats.sampleCount += 1;
            stats.lastSample = sample;
            stats.lastError = null;
        } catch (err) {
            stats.lastError = err.message || String(err);
        }
    };

    // Fire one immediately so the UI sees a value within ~1 second of Start.
    tick();
    const timer = setInterval(tick, config.cadenceSec * 1000);
    _runners.set(sensorGid, { timer, config, stats });
    return _snapshot(sensorGid);
}

function stop(sensorGid) {
    const r = _runners.get(sensorGid);
    if (!r) return { running: false, sensorGid };
    clearInterval(r.timer);
    _runners.delete(sensorGid);
    return { running: false, sensorGid };
}

/**
 * Live-patch a running runner's config — frontend sliders for T/RH mean,
 * cadence, channel toggles etc. write here so changes take effect on the
 * next tick without rebooting the timer (which would reset the sample
 * counter and lose the live-status feel).
 *
 * No-op (404 from controller) if the sensor isn't currently running.
 */
function updateConfig(sensorGid, partial) {
    const r = _runners.get(sensorGid);
    if (!r) return null;
    if (partial.cadenceSec) {
        const cs = Math.max(1, Number(partial.cadenceSec));
        if (cs !== r.config.cadenceSec) {
            r.config.cadenceSec = cs;
            clearInterval(r.timer);
            // Rebuild the ticker with the new period. The tick body is the
            // same closure captured at start() — re-grab the runner since
            // it lives in the outer closure.
            r.timer = setInterval(async () => {
                const sample = _genSample(Date.now(), r.config.channels, r.config.params);
                try {
                    const sensor = await _resolveSensor(sensorGid);
                    await TelemetryService.ingestBatch(sensor, [sample]);
                    r.stats.sampleCount += 1;
                    r.stats.lastSample = sample;
                    r.stats.lastError = null;
                } catch (err) {
                    r.stats.lastError = err.message || String(err);
                }
            }, r.config.cadenceSec * 1000);
        }
    }
    if (Array.isArray(partial.channels) && partial.channels.length) {
        r.config.channels = partial.channels;
    }
    if (partial.params && typeof partial.params === 'object') {
        Object.assign(r.config.params, partial.params);
    }
    return _snapshot(sensorGid);
}

/**
 * Backfill `days` of past samples for a sensor at 10-minute cadence. Runs
 * synchronously (relative to the request) — caller awaits it. Returns the
 * count of samples accepted/duplicate/rejected.
 */
async function catchup(sensorGid, { days = 7, channels, params } = {}) {
    const sensor = await _resolveSensor(sensorGid);
    const effChannels = Array.isArray(channels) && channels.length
        ? channels
        : (sensor.channels || ['temperature', 'humidity']).filter(c => c !== 'image');
    const effParams = _mergeParams(params);

    const intervalMs = 10 * 60 * 1000;
    const now = Date.now();
    const startMs = now - Math.max(1, Math.min(365, Number(days))) * 86400000;

    const samples = [];
    for (let ts = startMs; ts < now; ts += intervalMs) {
        samples.push(_genSample(ts, effChannels, effParams));
    }

    let accepted = 0, duplicates = 0, rejected = 0;
    const BATCH = 1000;
    for (let i = 0; i < samples.length; i += BATCH) {
        const chunk = samples.slice(i, i + BATCH);
        const r = await TelemetryService.ingestBatch(sensor, chunk);
        accepted   += r.accepted   || 0;
        duplicates += r.duplicates || 0;
        rejected   += r.rejected   || 0;
    }
    return { generated: samples.length, accepted, duplicates, rejected };
}

module.exports = {
    DEFAULT_PARAMS,
    status,
    start,
    stop,
    catchup,
    updateConfig
};
