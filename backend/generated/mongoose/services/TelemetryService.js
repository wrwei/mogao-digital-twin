const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Sensor } = require('../models/Sensor');
const { EnvironmentSample } = require('../models/EnvironmentSample');

const BCRYPT_ROUNDS = 10;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

/** Validate a single sample. Returns null if OK, or an error string. */
function validateSample(s) {
    if (s.timestamp == null) return 'missing timestamp';
    if (typeof s.temperature !== 'number' || s.temperature < -40 || s.temperature > 80) {
        return 'temperature out of range [-40, 80]';
    }
    if (typeof s.humidity !== 'number' || s.humidity < 0 || s.humidity > 100) {
        return 'humidity out of range [0, 100]';
    }
    if (s.lightKlux != null && (typeof s.lightKlux !== 'number' || s.lightKlux < 0)) {
        return 'lightKlux must be a non-negative number';
    }
    const t = new Date(s.timestamp);
    if (isNaN(t.getTime())) return 'invalid timestamp';
    return null;
}

/** Apply the sensor's calibration offsets. */
function applyCalibration(sample, sensor) {
    const off = (sensor.calibration && sensor.calibration.offsets) || {};
    return {
        temperature: sample.temperature + (off.temperature || 0),
        humidity: clamp(sample.humidity + (off.humidity || 0), 0, 100),
        lightKlux: sample.lightKlux != null
            ? Math.max(0, sample.lightKlux + (off.lightKlux || 0))
            : null
    };
}

const TelemetryService = {

    // ── Sensor management ────────────────────────────────────────────────

    /**
     * Register a sensor. Generates an API key, stores its bcrypt hash, and
     * returns the plaintext key ONCE (the caller must persist it).
     *
     * @returns {{ sensor, apiKey }}
     */
    async registerSensor(fields) {
        const gid = fields.gid || `sensor-${crypto.randomUUID()}`;
        const secret = crypto.randomBytes(24).toString('base64url');
        const prefix = crypto.randomBytes(4).toString('hex');
        const apiKey = `${prefix}.${secret}`;
        const apiKeyHash = await bcrypt.hash(apiKey, BCRYPT_ROUNDS);

        const sensor = await Sensor.create({
            gid,
            name: fields.name || gid,
            model: fields.model,
            serialNumber: fields.serialNumber,
            apiKeyHash,
            apiKeyPrefix: prefix,
            channels: fields.channels || ['temperature', 'humidity'],
            location: fields.location || {},
            calibration: fields.calibration || {},
            status: { active: true, samplesTotal: 0 }
        });

        return { sensor, apiKey };
    },

    async listSensors() {
        return Sensor.find().select('-apiKeyHash');
    },

    async getSensor(gid) {
        return Sensor.findOne({ gid }).select('-apiKeyHash');
    },

    async deactivateSensor(gid) {
        return Sensor.findOneAndUpdate(
            { gid },
            { $set: { 'status.active': false } },
            { new: true }
        ).select('-apiKeyHash');
    },

    // ── Sample ingestion ─────────────────────────────────────────────────

    /**
     * Ingest a batch of samples from one sensor. Duplicates on
     * (sensor, timestamp) are silently skipped via unordered bulkWrite.
     *
     * @returns {{ accepted, duplicates, rejected, errors }}
     */
    async ingestBatch(sensor, samples) {
        if (!Array.isArray(samples) || samples.length === 0) {
            return { accepted: 0, duplicates: 0, rejected: 0, errors: [] };
        }

        const ops = [];
        const errors = [];
        let rejected = 0;
        let minTs = null, maxTs = null;

        for (const raw of samples) {
            const err = validateSample(raw);
            if (err) {
                rejected++;
                errors.push({ sample: raw, error: err });
                continue;
            }
            const corrected = applyCalibration(raw, sensor);
            const timestamp = new Date(raw.timestamp);
            if (minTs === null || timestamp < minTs) minTs = timestamp;
            if (maxTs === null || timestamp > maxTs) maxTs = timestamp;

            ops.push({
                insertOne: {
                    document: {
                        sensor: sensor._id,
                        timestamp,
                        temperature: corrected.temperature,
                        humidity: corrected.humidity,
                        lightKlux: corrected.lightKlux,
                        raw: true
                    }
                }
            });
        }

        let accepted = 0, duplicates = 0;
        if (ops.length > 0) {
            try {
                const result = await EnvironmentSample.bulkWrite(ops, { ordered: false });
                accepted = result.insertedCount || 0;
            } catch (err) {
                // unordered bulkWrite surfaces duplicate-key errors as writeErrors
                accepted = err.result ? err.result.insertedCount || 0 : 0;
                const writeErrors = (err.writeErrors || []);
                duplicates = writeErrors.filter(e => e.code === 11000).length;
                const realErrors = writeErrors.filter(e => e.code !== 11000);
                for (const e of realErrors) errors.push({ error: e.errmsg });
            }
        }

        // Update sensor status
        if (accepted > 0 || duplicates > 0) {
            const setPayload = { 'status.lastSeenAt': maxTs };
            if (!sensor.status.firstSeenAt) setPayload['status.firstSeenAt'] = minTs;
            await Sensor.updateOne(
                { _id: sensor._id },
                { $inc: { 'status.samplesTotal': accepted }, $set: setPayload }
            );
        }

        return { accepted, duplicates, rejected, errors };
    },

    /** Parse a CSV and ingest. Auto-detects timestamp/T/RH/light columns. */
    async ingestCSV(sensor, csvText) {
        const lines = csvText.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
            return { accepted: 0, duplicates: 0, rejected: 0, errors: [{ error: 'CSV has no data rows' }] };
        }
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const col = (aliases) => {
            for (const a of aliases) {
                const i = header.findIndex(h => h === a || h.includes(a));
                if (i >= 0) return i;
            }
            return -1;
        };
        const iTs = col(['timestamp', 'time', 'date']);
        const iT  = col(['temperature', 'temp', 't(']);
        const iRH = col(['humidity', 'rh(', 'rh ']);
        const iI  = col(['light', 'klux', 'lux']);

        if (iTs < 0 || iT < 0 || iRH < 0) {
            return { accepted: 0, duplicates: 0, rejected: 0, errors: [
                { error: `CSV must have timestamp, temperature, humidity columns (got: ${header.join(', ')})` }
            ]};
        }

        const samples = [];
        const parseErrors = [];
        for (let r = 1; r < lines.length; r++) {
            const cells = lines[r].split(',').map(c => c.trim());
            const tsStr = cells[iTs];
            const T = parseFloat(cells[iT]);
            const RH = parseFloat(cells[iRH]);
            const I = iI >= 0 ? parseFloat(cells[iI]) : null;

            const timestamp = new Date(tsStr);
            if (isNaN(timestamp.getTime()) || isNaN(T) || isNaN(RH)) {
                parseErrors.push({ row: r + 1, raw: lines[r], error: 'parse error' });
                continue;
            }
            samples.push({
                timestamp: timestamp.toISOString(),
                temperature: T,
                humidity: RH,
                lightKlux: I != null && !isNaN(I) ? I : null
            });
        }

        const result = await this.ingestBatch(sensor, samples);
        result.errors = [...parseErrors, ...result.errors];
        return result;
    },

    // ── Query for an artifact's environment ──────────────────────────────

    /**
     * Resolve which sensors represent the environment of the given artifact.
     * Priority:
     *   1. Any sensor that has this artifact's gid in location.explicitArtifacts
     *   2. Any sensor whose location.cave matches the artifact's parent cave
     */
    async sensorsForArtifact(artifactGid, caveGid) {
        const explicit = await Sensor.find({
            'location.explicitArtifacts': artifactGid,
            'status.active': true
        });
        if (explicit.length > 0) return explicit;
        if (caveGid) {
            return Sensor.find({ 'location.cave': caveGid, 'status.active': true });
        }
        return [];
    },

    /**
     * Query environment samples for a set of sensors over a time range.
     * Returns raw 10-minute samples plus a summary (mean/min/max/stddev,
     * daily RH amplitude, cycle crossings of VTT critical RH).
     */
    async queryEnvironment(sensorIds, { from, to, interval = 'raw', limit = 50000 }) {
        const match = { sensor: { $in: sensorIds } };
        if (from) match.timestamp = { ...(match.timestamp || {}), $gte: new Date(from) };
        if (to)   match.timestamp = { ...(match.timestamp || {}), $lte: new Date(to) };

        // Aggregation pipeline
        const pipeline = [{ $match: match }, { $sort: { timestamp: 1 } }];

        if (interval === 'hourly' || interval === 'daily') {
            const dateFmt = interval === 'hourly' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';
            pipeline.push({
                $group: {
                    _id: { $dateToString: { format: dateFmt, date: '$timestamp' } },
                    timestamp:   { $first: '$timestamp' },
                    temperature: { $avg: '$temperature' },
                    humidity:    { $avg: '$humidity' },
                    rhMin:       { $min: '$humidity' },
                    rhMax:       { $max: '$humidity' },
                    lightKlux:   { $avg: '$lightKlux' },
                    count:       { $sum: 1 }
                }
            });
            pipeline.push({ $sort: { timestamp: 1 } });
            pipeline.push({ $project: {
                _id: 0,
                timestamp: 1,
                temperature: 1,
                humidity: 1,
                rhAmplitude: { $subtract: ['$rhMax', '$rhMin'] },
                lightKlux: 1,
                count: 1
            }});
        } else {
            pipeline.push({ $project: {
                _id: 0,
                timestamp: 1,
                temperature: 1,
                humidity: 1,
                lightKlux: 1,
                sensor: 1
            }});
        }

        pipeline.push({ $limit: limit });
        const samples = await EnvironmentSample.aggregate(pipeline);

        // Summary statistics (always computed from raw-interval match)
        const summaryAgg = await EnvironmentSample.aggregate([
            { $match: match },
            { $group: {
                _id: null,
                count:   { $sum: 1 },
                tMean:   { $avg: '$temperature' },
                tMin:    { $min: '$temperature' },
                tMax:    { $max: '$temperature' },
                tStd:    { $stdDevPop: '$temperature' },
                rhMean:  { $avg: '$humidity' },
                rhMin:   { $min: '$humidity' },
                rhMax:   { $max: '$humidity' },
                rhStd:   { $stdDevPop: '$humidity' },
                iMean:   { $avg: '$lightKlux' }
            }}
        ]);

        // Daily RH amplitude (mean of daily max-min)
        const dailyAmp = await EnvironmentSample.aggregate([
            { $match: match },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                rhMin: { $min: '$humidity' },
                rhMax: { $max: '$humidity' }
            }},
            { $project: { amp: { $subtract: ['$rhMax', '$rhMin'] } } },
            { $group: { _id: null, dailyAmp: { $avg: '$amp' }, days: { $sum: 1 } } }
        ]);

        const s = summaryAgg[0] || {};
        const d = dailyAmp[0] || {};
        const summary = {
            count: s.count || 0,
            temperature: { mean: s.tMean, min: s.tMin, max: s.tMax, stddev: s.tStd },
            humidity:    { mean: s.rhMean, min: s.rhMin, max: s.rhMax, stddev: s.rhStd, dailyAmplitudeMean: d.dailyAmp || 0 },
            lightKlux:   { mean: s.iMean },
            daysCovered: d.days || 0
        };

        return { samples, summary };
    }
};

module.exports = TelemetryService;
