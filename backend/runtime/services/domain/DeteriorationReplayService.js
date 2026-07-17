/**
 * Deterioration Replay Service
 *
 * Runs the five deterioration models against the actual monitored sensor
 * history for a given artifact, producing a day-by-day trajectory of
 * cumulative damage plus an optional forward projection by looping the
 * most recent year of climate data.
 *
 * Phase 1 + Phase 2 of the Predictive Analytics Plan (PREDICTION-PLAN.md).
 */

const D = require('./DeteriorationService');
const { EnvironmentSample } = require('../../models/EnvironmentSample');
const { Sensor } = require('../../models/Sensor');
const ExhibitService = require('./ExhibitService');
const TelemetryService = require('./TelemetryService');

const R = 8.314;

// ── In-memory TTL cache for replay results ──────────────────────────────────
// Keyed by artifactGid + query params. Entries live for CACHE_TTL_MS before
// being recomputed on the next request. Explicit invalidation via
// invalidateArtifact() is also exposed so ingestion can flush affected rows.
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes
const replayCache = new Map();        // key → { expires, value }

function cacheKey(artifactGid, opts) {
    return [
        artifactGid,
        opts.from || '',
        opts.to || '',
        opts.forecast ? '1' : '0',
        opts.maxYears || 200
    ].join('|');
}

function cacheGet(key) {
    const entry = replayCache.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
        replayCache.delete(key);
        return null;
    }
    return entry.value;
}

function cacheSet(key, value) {
    replayCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
    // Opportunistic sweep to keep the map small
    if (replayCache.size > 200) {
        const now = Date.now();
        for (const [k, v] of replayCache) {
            if (v.expires < now) replayCache.delete(k);
        }
    }
}

/** Drop every cache entry whose artifactGid matches. Called on new
 *  sample ingestion for any sensor linked (explicitly or by cave) to
 *  the artifact. */
function invalidateArtifact(artifactGid) {
    const prefix = artifactGid + '|';
    for (const k of replayCache.keys()) {
        if (k.startsWith(prefix)) replayCache.delete(k);
    }
}

// --- Thresholds (where each model raises a "defect imminent" flag) --------
const THRESHOLDS = {
    chemicalDeltaE:  5.0,   // perceptible colour change
    mouldIndex:      3.0,   // visible sparse growth
    fatigueDamage:   1.0,   // first-crack onset
    saltCumulative:  1.0    // cumulative damage ratio exceeds 1 substrate-strength × cycle equivalent
};

/** Produce one daily record of (date, T_mean, RH_mean, RH_min, RH_max, light_mean). */
async function aggregateDailyBuckets(sensorIds, from, to) {
    const match = { sensor: { $in: sensorIds } };
    if (from) match.timestamp = { ...(match.timestamp || {}), $gte: new Date(from) };
    if (to)   match.timestamp = { ...(match.timestamp || {}), $lte: new Date(to) };

    const rows = await EnvironmentSample.aggregate([
        { $match: match },
        { $group: {
            _id:        { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            date:       { $first: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
            T_mean:     { $avg: '$temperature' },
            RH_mean:    { $avg: '$humidity' },
            RH_min:     { $min: '$humidity' },
            RH_max:     { $max: '$humidity' },
            light_mean: { $avg: '$lightKlux' },
            count:      { $sum: 1 }
        }},
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: 1, T_mean: 1, RH_mean: 1, RH_min: 1, RH_max: 1, light_mean: 1, count: 1 } }
    ]);
    return rows;
}

/**
 * Replay the five models day-by-day through a daily-bucket array.
 * Returns { trajectory, cumulative, thresholdsCrossed }.
 *
 * Stateful models (mould, fatigue, salt cumulative, chemical Σk·dt, lifetime
 * Σdt/LM) update across days. Each day's `delta_*` is the increment; each
 * day's `cum_*` is the accumulated value up to and including that day.
 */
function runReplay(dailyBuckets, opts = {}) {
    const chemicalP = { ...(opts.chemicalParams || {}) };
    const lifetimeP = { ...(opts.lifetimeParams || {}) };
    const mouldP    = { ...(opts.mouldParams    || {}) };
    const saltP     = { ...(opts.saltCrystParams|| {}) };
    const fatigueP  = { ...(opts.fatigueParams  || {}) };

    const beta_diff   = fatigueP.beta_diff  ?? 5e-5;
    const E_mod       = fatigueP.E          ?? 2000;
    const sigma_fail  = fatigueP.sigma_fail ?? 10.0;
    const basquin_b   = fatigueP.basquin_b  ?? 6;
    const cyclesPerYear = fatigueP.cyclesPerYear ?? 365;
    const cyclesPerDay  = cyclesPerYear / 365;

    // Chemical delta-E* scale: the published fading kinetics track fractional
    // colour remaining. A change from 1.0 → 0.0 corresponds to a ΔE* of ~100
    // under the CIE scale used in the paper. We use ΔE* = (1 - exp(-Σk·dt)) · 100.
    const DELTA_E_SCALE = 100;

    let cumKTimesDt = 0;      // chemical: Σ k_i · dt
    let equivYears  = 0;      // lifetime: Σ dt/LM
    let mouldIndex  = 0;      // VTT state variable (0-6)
    let saltEvents  = 0;      // salt crystallisation event count
    let saltCum     = 0;      // salt cumulative damage (events × damage per event)
    let fatigueD    = 0;      // Miner's rule
    let prevRHAbove = null;   // for salt event detection (edge crossings of DRH)

    let firstCrossing = {
        chemicalDeltaE: null,
        mouldIndex:     null,
        fatigueDamage:  null,
        saltCumulative: null
    };

    const trajectory = [];

    for (let i = 0; i < dailyBuckets.length; i++) {
        const b = dailyBuckets[i];
        const T  = b.T_mean ?? 20;
        const RH = b.RH_mean ?? 50;
        const I  = b.light_mean ?? 0;
        const dRH = (b.RH_max != null && b.RH_min != null) ? (b.RH_max - b.RH_min) : 0;

        // --- Chemical: one-day rate constant × 1 day ----------------------
        const k = D.calculateRateConstant(T, RH, I, chemicalP);
        cumKTimesDt += k * 1;  // dt = 1 day
        const cumChemicalDeltaE = (1 - Math.exp(-cumKTimesDt)) * DELTA_E_SCALE;

        // --- Lifetime: reference-equivalent years --------------------------
        // totalDays not needed here — we only read the multiplier for the step.
        const LM = D.lifetimeMultiplier(T, RH, 0, lifetimeP).multiplier;
        const dEquivYears = (1 / 365.25) / Math.max(LM, 1e-6);
        equivYears += dEquivYears;

        // --- Mould (VTT stepwise) ------------------------------------------
        const rhCritical = D.mouldCriticalRH(T);
        const isAbove = RH >= rhCritical;
        const growthCoeff = mouldP.growthCoeff ?? 0.13;
        const declineRate = mouldP.declineRate ?? -0.128;
        let mouldRate = 0;
        if (isAbove && T > 0) {
            const rhExcess = (RH - rhCritical) / 100;
            const tempScale = T / 20;
            mouldRate = rhExcess * tempScale * growthCoeff;
        } else {
            mouldRate = declineRate;
        }
        mouldIndex = Math.max(0, Math.min(6, mouldIndex + mouldRate * 1));

        // --- Salt ----------------------------------------------------------
        // Salt damage is accrued per dissolution→crystallisation cycle following the
        // Grossi–Brimblecombe / Steiger treatment (Methods Model 5, Supplementary S4),
        // using the SAME phase-correct, ν-scaled pressure model as saltCrystallization()
        // in DeteriorationService (mirabilite/thenardite switch at the peritectic; tensile
        // strength and ν from SALT_DEFAULTS). A wet→dry EDGE is one half-cycle; damage is
        // added only on that transition, scaled by the Miner-style per-cycle ratio. Under a
        // persistently sub-deliquescent interior (RH < DRH year-round) there are no edges,
        // so saltCum stays 0 and no calendar ETA is produced — matching the paper's salt
        // narrative (Results: zero wet–dry cycles; hazard is spatial via alpha_s, not temporal).
        const DRH = D.saltDeliquescenceRH(T, saltP);
        const isCrystallising = RH < DRH;
        // Detect a dissolution→crystallisation edge (wet→dry): one half-cycle event.
        const crystallisationEdge =
            prevRHAbove === true && isCrystallising === true;
        if (crystallisationEdge) {
            saltEvents += 1;
            if (RH > 0) {
                const phase = D.saltPhase(T, saltP);
                const nu = (saltP.nu ?? D.SALT_DEFAULTS.nu);
                const tensile = (saltP.tensileStrength ?? D.SALT_DEFAULTS.tensileStrength);
                const S = (DRH / 100) / (RH / 100);
                const pressureMPa = ((nu * R * (T + 273.15)) / phase.Vm) * Math.log(S) / 1e6;
                // Miner-style per-half-cycle damage: (Δp/σ_t) × 0.5 cycle, capped per event.
                const damageRatio = Math.max(0, pressureMPa) / tensile;
                saltCum += Math.min(damageRatio, 100) * 0.5;
            }
        }
        // Track the RH-vs-DRH state for the NEXT step's edge detection:
        // prevRHAbove === true means "was above DRH (dissolved/wet)".
        prevRHAbove = !isCrystallising;

        // --- Fatigue (Basquin + Miner) -------------------------------------
        if (dRH > 0.1) {
            const strain = beta_diff * dRH;
            const stress = E_mod * strain;
            const Nf = Math.min(1e12, Math.pow(sigma_fail / Math.max(stress, 1e-6), basquin_b));
            fatigueD += cyclesPerDay / Nf;
        }

        // --- Track first-threshold crossings -------------------------------
        if (firstCrossing.chemicalDeltaE === null && cumChemicalDeltaE >= THRESHOLDS.chemicalDeltaE)
            firstCrossing.chemicalDeltaE = b.date;
        if (firstCrossing.mouldIndex === null && mouldIndex >= THRESHOLDS.mouldIndex)
            firstCrossing.mouldIndex = b.date;
        if (firstCrossing.fatigueDamage === null && fatigueD >= THRESHOLDS.fatigueDamage)
            firstCrossing.fatigueDamage = b.date;
        if (firstCrossing.saltCumulative === null && saltCum >= THRESHOLDS.saltCumulative)
            firstCrossing.saltCumulative = b.date;

        trajectory.push({
            date: b.date,
            T_mean: T,
            RH_mean: RH,
            dailyRHAmp: dRH,
            // per-day increments (useful for "worst moment" annotations)
            delta: {
                chemicalDeltaE: (1 - Math.exp(-k)) * DELTA_E_SCALE,  // as if that one day alone
                equivYears: dEquivYears,
                mouldIncrement: mouldRate,
                saltEvent: (prevRHAbove === true) ? 1 : 0,
                fatigueDamage: dRH > 0.1
                    ? cyclesPerDay / Math.min(1e12, Math.pow(sigma_fail / Math.max(E_mod * beta_diff * dRH, 1e-6), basquin_b))
                    : 0
            },
            // cumulative state at end of this day
            cum: {
                chemicalDeltaE: cumChemicalDeltaE,
                equivYears,
                mouldIndex,
                saltEvents,
                saltCumulative: saltCum,
                fatigueDamage: fatigueD
            }
        });
    }

    return {
        trajectory,
        cumulative: {
            chemicalDeltaE: (1 - Math.exp(-cumKTimesDt)) * DELTA_E_SCALE,
            equivYears,
            mouldIndexFinal: mouldIndex,
            saltEvents,
            saltCumulative: saltCum,
            fatigueDamage: fatigueD
        },
        thresholds: THRESHOLDS,
        thresholdsCrossed: firstCrossing,
        exposureDays: dailyBuckets.length
    };
}

/**
 * Forward-project by repeating the most recent `repeatWindowDays` of the
 * observed climate until all four thresholds are crossed or `maxYears`
 * elapse.
 */
function forwardProject(replayResult, dailyBuckets, { maxYears = 200, repeatWindowDays = 365 } = {}) {
    if (dailyBuckets.length === 0) {
        return {
            projectionDays: 0,
            projection: [],
            etaDays: { chemicalDeltaE: null, mouldIndex: null, fatigueDamage: null, saltCumulative: null }
        };
    }

    // Take the last `repeatWindowDays` days (or all if we have fewer)
    const window = dailyBuckets.slice(-repeatWindowDays);
    const maxDays = Math.round(maxYears * 365.25);

    // Re-use the running state from the historical replay by continuing
    // the accumulation forward. Simpler: re-run from day 0 through history
    // + replayed window to keep all state integrations consistent.
    const extendedBuckets = [...dailyBuckets];

    // Append repeated window until we reach max OR all thresholds crossed
    const etaDays = { ...replayResult.thresholdsCrossed };
    // Convert crossed dates into "days-from-start-of-history"
    const startDate = dailyBuckets.length ? new Date(dailyBuckets[0].date) : new Date();
    const dayIndexFromDate = d => Math.round((new Date(d) - startDate) / (1000 * 60 * 60 * 24));

    const startingEta = {
        chemicalDeltaE: etaDays.chemicalDeltaE ? dayIndexFromDate(etaDays.chemicalDeltaE) : null,
        mouldIndex:     etaDays.mouldIndex     ? dayIndexFromDate(etaDays.mouldIndex)     : null,
        fatigueDamage:  etaDays.fatigueDamage  ? dayIndexFromDate(etaDays.fatigueDamage)  : null,
        saltCumulative: etaDays.saltCumulative ? dayIndexFromDate(etaDays.saltCumulative) : null
    };

    // Continue appending window cycles, tracking newly-crossed thresholds
    let dayIdx = dailyBuckets.length;
    const projection = [];
    let cycles = 0;
    const maxCycles = Math.ceil(maxDays / Math.max(window.length, 1));
    while (dayIdx < maxDays && cycles < maxCycles) {
        for (const src of window) {
            extendedBuckets.push({
                ...src,
                date: new Date(startDate.getTime() + dayIdx * 86400000).toISOString().slice(0, 10)
            });
            dayIdx++;
            if (dayIdx >= maxDays) break;
        }
        cycles++;
    }

    // Re-run the full replay with the extended sequence
    const full = runReplay(extendedBuckets);

    // Map threshold crossings to day index
    const etaIndex = {};
    for (const key of Object.keys(startingEta)) {
        if (full.thresholdsCrossed[key]) {
            etaIndex[key] = dayIndexFromDate(full.thresholdsCrossed[key]);
        } else {
            etaIndex[key] = null;
        }
    }

    // Project slice: everything after the historical window
    const projectionSlice = full.trajectory.slice(dailyBuckets.length).map(p => ({
        date: p.date,
        cum: p.cum
    }));

    return {
        projectionDays: projectionSlice.length,
        projection: projectionSlice,
        etaDays: etaIndex,
        historicalDays: dailyBuckets.length,
        thresholds: THRESHOLDS
    };
}

module.exports = {

    THRESHOLDS,
    aggregateDailyBuckets,
    runReplay,
    forwardProject,
    invalidateArtifact,

    /**
     * End-to-end: resolve sensors for the artifact, aggregate, replay, and
     * (optionally) forward-project. Cached in-memory for CACHE_TTL_MS.
     */
    async replayHistory(artifactGid, { from, to, forecast = false, maxYears = 200 } = {}) {
        const key = cacheKey(artifactGid, { from, to, forecast, maxYears });
        const cached = cacheGet(key);
        if (cached) return { ...cached, cached: true };

        const found = await ExhibitService._findByGid(artifactGid);
        if (!found) throw new Error(`Artifact ${artifactGid} not found`);
        const caveGid = await ExhibitService._findParentCaveGid(artifactGid);
        const sensors = await TelemetryService.sensorsForArtifact(artifactGid, caveGid);
        if (sensors.length === 0) {
            const empty = {
                artifactGid,
                caveGid,
                sensors: [],
                historicalDays: 0,
                trajectory: [],
                cumulative: null,
                thresholds: THRESHOLDS,
                thresholdsCrossed: null,
                forecast: null,
                note: 'No sensors are linked to this artifact or its parent cave.'
            };
            cacheSet(key, empty);
            return empty;
        }
        const sensorIds = sensors.map(s => s._id);
        const buckets = await aggregateDailyBuckets(sensorIds, from, to);
        const replay = runReplay(buckets);

        let forecastResult = null;
        if (forecast && buckets.length >= 7) {
            forecastResult = forwardProject(replay, buckets, { maxYears });
        }

        const result = {
            artifactGid,
            caveGid,
            sensors: sensors.map(s => ({ gid: s.gid, name: s.name })),
            historicalDays: replay.exposureDays,
            trajectory: replay.trajectory,
            cumulative: replay.cumulative,
            thresholds: replay.thresholds,
            thresholdsCrossed: replay.thresholdsCrossed,
            climateSummary: summariseClimate(buckets),
            forecast: forecastResult
        };
        cacheSet(key, result);
        return result;
    }
};

/**
 * Roll the daily buckets up into a small climate fingerprint the UI can
 * compare against conservation benchmarks (Bizot Green Protocol etc).
 * `pctDays*` are days satisfying the predicate / total days, ∈ [0, 1].
 */
function summariseClimate(buckets) {
    if (!buckets || buckets.length === 0) return null;
    const Ts = buckets.map(b => b.T_mean).filter(v => v != null);
    const RHs = buckets.map(b => b.RH_mean).filter(v => v != null);
    const dRHs = buckets
        .map(b => (b.RH_max != null && b.RH_min != null) ? b.RH_max - b.RH_min : null)
        .filter(v => v != null);
    const mean = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    const max  = arr => arr.length ? Math.max(...arr) : null;
    const min  = arr => arr.length ? Math.min(...arr) : null;
    // DRH crossing band: NaCl ≈ 75 %, but most common efflorescent salts
    // re-crystallise somewhere in 65–80 %. Counting days where today's RH
    // straddles that band is a cheap proxy for "are we cycling salts".
    const drhCrossings = buckets.filter(b =>
        b.RH_min != null && b.RH_max != null && b.RH_min < 80 && b.RH_max > 65
    ).length;
    const mouldRiskDays = buckets.filter(b => b.RH_max != null && b.RH_max > 70).length;
    return {
        days: buckets.length,
        T:  { mean: mean(Ts),  min: min(Ts),  max: max(Ts)  },
        RH: { mean: mean(RHs), min: min(RHs), max: max(RHs) },
        deltaRH:    { mean: mean(dRHs), max: max(dRHs) },
        pctDaysMouldRisk:   mouldRiskDays / buckets.length,
        pctDaysDRHCrossing: drhCrossings  / buckets.length
    };
}
