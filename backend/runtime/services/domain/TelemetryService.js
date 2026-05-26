const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Sensor } = require('../../models/Sensor');
const { EnvironmentSample } = require('../../models/EnvironmentSample');

// Lazy-required to avoid circular dependency with DeteriorationReplayService.
let _replayService = null;
function replayService() {
    if (_replayService === null) {
        try { _replayService = require('./DeteriorationReplayService'); }
        catch (_) { _replayService = {}; }
    }
    return _replayService;
}

const BCRYPT_ROUNDS = 10;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

/**
 * Validate a single sample. Returns null if OK, or an error string.
 * temperature and humidity are individually optional (so a temperature-only
 * or humidity-only sensor can post) but at least one must be present.
 */
function validateSample(s) {
    if (s.timestamp == null) return 'missing timestamp';
    const hasT  = s.temperature != null;
    const hasRH = s.humidity    != null;
    if (!hasT && !hasRH) return 'sample must include temperature or humidity (or both)';
    if (hasT && (typeof s.temperature !== 'number' || s.temperature < -40 || s.temperature > 80)) {
        return 'temperature out of range [-40, 80]';
    }
    if (hasRH && (typeof s.humidity !== 'number' || s.humidity < 0 || s.humidity > 100)) {
        return 'humidity out of range [0, 100]';
    }
    if (s.lightKlux != null && (typeof s.lightKlux !== 'number' || s.lightKlux < 0)) {
        return 'lightKlux must be a non-negative number';
    }
    const t = new Date(s.timestamp);
    if (isNaN(t.getTime())) return 'invalid timestamp';
    return null;
}

/**
 * Apply the sensor's calibration offsets.
 * Channels the sample doesn't own remain null on the way out so we don't
 * fabricate readings for channels the sensor isn't measuring.
 */
function applyCalibration(sample, sensor) {
    const off = (sensor.calibration && sensor.calibration.offsets) || {};
    return {
        temperature: sample.temperature != null
            ? sample.temperature + (off.temperature || 0)
            : null,
        humidity: sample.humidity != null
            ? clamp(sample.humidity + (off.humidity || 0), 0, 100)
            : null,
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

    /**
     * Permanently remove a sensor and every sample it ever produced. Also
     * flushes the replay cache for all artifacts whose environment this
     * sensor represented. Returns a small summary of what was deleted.
     */
    async deleteSensor(gid) {
        const sensor = await Sensor.findOne({ gid });
        if (!sensor) return null;

        const explicit = (sensor.location && sensor.location.explicitArtifacts) || [];
        const caveGid  = sensor.location && sensor.location.cave;

        const sampleResult = await EnvironmentSample.deleteMany({ sensor: sensor._id });
        await Sensor.deleteOne({ _id: sensor._id });

        // Invalidate replay cache for every artifact this sensor covered.
        const invalidate = replayService().invalidateArtifact;
        if (typeof invalidate === 'function') {
            for (const g of explicit) invalidate(g);
            if (caveGid) {
                try {
                    const artifacts = await this._artifactsInCave(caveGid);
                    for (const g of artifacts) invalidate(g);
                } catch (_) { /* best-effort */ }
            }
        }

        return {
            gid,
            samplesDeleted: sampleResult.deletedCount || 0,
            artifactsAffected: explicit.length + (caveGid ? 1 : 0)
        };
    },

    /**
     * Delete every sample a sensor has produced, but keep the sensor record
     * itself (and its api key) intact. Resets the status counters so the
     * dashboard reflects the empty state, and invalidates the replay cache.
     */
    async clearSamples(gid) {
        const sensor = await Sensor.findOne({ gid });
        if (!sensor) return null;

        const t0 = Date.now();
        const sampleResult = await EnvironmentSample.deleteMany({ sensor: sensor._id });
        const tDelete = Date.now() - t0;

        await Sensor.updateOne(
            { _id: sensor._id },
            { $set: {
                'status.samplesTotal': 0,
                'status.firstSeenAt': null,
                'status.lastSeenAt': null
            }}
        );

        const explicit = (sensor.location && sensor.location.explicitArtifacts) || [];
        const caveGid  = sensor.location && sensor.location.cave;
        const invalidate = replayService().invalidateArtifact;
        if (typeof invalidate === 'function') {
            for (const g of explicit) invalidate(g);
            if (caveGid) {
                try {
                    const artifacts = await this._artifactsInCave(caveGid);
                    for (const g of artifacts) invalidate(g);
                } catch (_) { /* best-effort */ }
            }
        }
        console.log(`[clearSamples] ${gid}: deleted ${sampleResult.deletedCount} samples in ${tDelete}ms (total ${Date.now() - t0}ms)`);

        return { gid, samplesDeleted: sampleResult.deletedCount || 0 };
    },

    /**
     * Partial update of a sensor's mutable fields. Disallows changes to
     * gid, apiKey*, samplesTotal, firstSeenAt, lastSeenAt.
     */
    async updateSensor(gid, patch) {
        const allowed = ['name', 'model', 'serialNumber', 'channels', 'location', 'calibration'];
        const set = {};
        for (const k of allowed) if (patch[k] !== undefined) set[k] = patch[k];
        if (patch.active !== undefined) set['status.active'] = !!patch.active;
        return Sensor.findOneAndUpdate(
            { gid },
            { $set: set },
            { new: true, runValidators: true }
        ).select('-apiKeyHash');
    },

    /**
     * Add an artifact gid to a sensor's explicitArtifacts list (if not already present).
     */
    async linkArtifact(sensorGid, artifactGid) {
        return Sensor.findOneAndUpdate(
            { gid: sensorGid },
            { $addToSet: { 'location.explicitArtifacts': artifactGid } },
            { new: true }
        ).select('-apiKeyHash');
    },

    async unlinkArtifact(sensorGid, artifactGid) {
        return Sensor.findOneAndUpdate(
            { gid: sensorGid },
            { $pull: { 'location.explicitArtifacts': artifactGid } },
            { new: true }
        ).select('-apiKeyHash');
    },

    /**
     * Generate a fresh API key for a sensor and invalidate the previous one.
     * Returns the plaintext key once — it cannot be recovered after this.
     */
    async rotateKey(sensorGid) {
        const secret = crypto.randomBytes(24).toString('base64url');
        const prefix = crypto.randomBytes(4).toString('hex');
        const apiKey = `${prefix}.${secret}`;
        const apiKeyHash = await bcrypt.hash(apiKey, BCRYPT_ROUNDS);

        const sensor = await Sensor.findOneAndUpdate(
            { gid: sensorGid },
            { $set: { apiKeyHash, apiKeyPrefix: prefix } },
            { new: true }
        ).select('-apiKeyHash');

        if (!sensor) return null;
        return { sensor, apiKey };
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
            return { accepted: 0, duplicates: 0, rejected: 0, skipped: 0, errors: [] };
        }

        // A sensor only stores the channels it physically measures. A
        // temperature-only sensor receiving a T+RH CSV writes T and drops RH
        // (and vice versa); the user is expected to point the RH side at the
        // sister humidity sensor in a second pass. Samples whose channels are
        // *all* dropped are counted as `skipped` (not rejected — the input
        // isn't bad, it just doesn't apply to this sensor).
        const owned = Array.isArray(sensor.channels) ? sensor.channels : ['temperature', 'humidity'];
        const ownsT  = owned.includes('temperature');
        const ownsRH = owned.includes('humidity');
        const ownsL  = owned.includes('light') || owned.includes('lightKlux');

        const ops = [];
        const errors = [];
        let rejected = 0;
        let skipped = 0;
        let minTs = null, maxTs = null;

        for (const raw of samples) {
            const err = validateSample(raw);
            if (err) {
                rejected++;
                errors.push({ sample: raw, error: err });
                continue;
            }
            const corrected = applyCalibration(raw, sensor);
            const storedT  = ownsT  ? corrected.temperature : null;
            const storedRH = ownsRH ? corrected.humidity    : null;
            const storedL  = ownsL  ? corrected.lightKlux   : null;
            if (storedT == null && storedRH == null && storedL == null) {
                skipped++;
                continue;
            }
            const timestamp = new Date(raw.timestamp);
            if (minTs === null || timestamp < minTs) minTs = timestamp;
            if (maxTs === null || timestamp > maxTs) maxTs = timestamp;

            ops.push({
                insertOne: {
                    document: {
                        sensor: sensor._id,
                        timestamp,
                        temperature: storedT,
                        humidity:    storedRH,
                        lightKlux:   storedL,
                        raw: true
                    }
                }
            });
        }

        let accepted = 0, duplicates = 0;
        if (ops.length > 0) {
            // Pre-filter duplicates. With the (sensor, timestamp) unique
            // index, every duplicate insert costs an index probe + a write
            // error — re-importing a 53k-row CSV that fully overlaps takes
            // tens of seconds because the driver has to bounce back 53k
            // E11000s. A single `distinct` over the candidate timestamp range
            // is one indexed read that returns ~1 MB and lets us skip the
            // bulkWrite entirely when everything is a dup.
            const existing = await EnvironmentSample.distinct('timestamp', {
                sensor: sensor._id,
                timestamp: { $gte: minTs, $lte: maxTs }
            });
            const existingMs = new Set(existing.map(d => d.getTime()));
            const freshOps = ops.filter(o => !existingMs.has(o.insertOne.document.timestamp.getTime()));
            duplicates += ops.length - freshOps.length;

            // Chunk the bulkWrite. Sending all ops in one command can exhaust
            // the driver's socket — "connection N to 127.0.0.1:27017 closed"
            // with 0 insertedCount and 0 writeErrors looks identical to a
            // successful no-op. Chunking keeps each write under the BSON size
            // limit and inside socketTimeout.
            const CHUNK_SIZE = 1000;
            for (let off = 0; off < freshOps.length; off += CHUNK_SIZE) {
                const chunk = freshOps.slice(off, off + CHUNK_SIZE);
                try {
                    const result = await EnvironmentSample.bulkWrite(chunk, { ordered: false });
                    accepted += result.insertedCount || 0;
                } catch (err) {
                    // A race against another writer could still surface dup-key
                    // errors here (distinct is point-in-time); count them too.
                    accepted += err.result?.insertedCount || 0;
                    const writeErrors = err.writeErrors || [];
                    duplicates += writeErrors.filter(e => e.code === 11000).length;
                    const realErrors = writeErrors.filter(e => e.code !== 11000);
                    for (const e of realErrors) errors.push({ error: e.errmsg });
                    if (writeErrors.length === 0 && (err.result?.insertedCount || 0) === 0) {
                        errors.push({ error: `bulkWrite chunk [${off}, ${off + chunk.length}) failed: ${err.message}` });
                    }
                }
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

        // Invalidate replay cache for any artifact whose environment this sensor represents.
        if (accepted > 0) {
            const invalidate = replayService().invalidateArtifact;
            if (typeof invalidate === 'function') {
                const explicit = (sensor.location && sensor.location.explicitArtifacts) || [];
                for (const g of explicit) invalidate(g);
                const caveGid = sensor.location && sensor.location.cave;
                if (caveGid) {
                    try {
                        const artifacts = await this._artifactsInCave(caveGid);
                        for (const g of artifacts) invalidate(g);
                    } catch (_) { /* cache invalidation best-effort */ }
                }
            }
        }

        return { accepted, duplicates, rejected, skipped, errors };
    },

    /** Collect gids of every artifact in a cave by walking cave.exhibits. */
    async _artifactsInCave(caveGid) {
        const { Cave } = require('../../models/Cave');
        const cave = await Cave.findOne({ gid: caveGid }).lean();
        if (!cave || !Array.isArray(cave.exhibits)) return [];
        const gids = [];
        for (const e of cave.exhibits) {
            if (typeof e === 'string') gids.push(e);
            else if (e && typeof e === 'object') {
                if (e.gid) gids.push(e.gid);
                else if (e.$id) gids.push(e.$id);
            }
        }
        return gids;
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
        // Soft-deleted sensors (status.active=false) still hold valid historical
        // samples — replay, environment display, and anomaly detection are all
        // historical-data paths and should see them. Callers that need a
        // live-only view (e.g. dispatching alerts) should filter the result.
        const explicit = await Sensor.find({ 'location.explicitArtifacts': artifactGid });
        if (explicit.length > 0) return explicit;
        if (caveGid) {
            return Sensor.find({ 'location.cave': caveGid });
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
