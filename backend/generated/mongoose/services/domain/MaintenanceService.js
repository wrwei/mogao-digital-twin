/**
 * Maintenance Service
 *
 * Composite risk scoring across all heritage artifacts. Used by the
 * Maintenance Queue view to triage conservator attention.
 *
 * Score = w1 · currentDamageIndex  (from DeteriorationReplayService)
 *       + w2 · 1 / ETA_any_threshold_years
 *       + w3 · activeAnomalyCount
 *       + w4 · daysSinceLastInspection / 365
 *       + w5 · conservationStatusSeverity
 *
 * Weights are tuned so each term contributes ≈ 0-1 to a composite in [0, 5].
 */

const ReplayService = require('./DeteriorationReplayService');
const AnomalyService = require('./AnomalyDetectionService');
const ExhibitService = require('./ExhibitService');
const TelemetryService = require('./TelemetryService');
const { Sensor } = require('../../models/Sensor');

const WEIGHTS = { damage: 1.0, eta: 1.0, anomaly: 0.5, inspection: 0.3, status: 0.8 };

const STATUS_SEVERITY = {
    excellent: 0.0,
    good:      0.2,
    fair:      0.4,
    poor:      0.7,
    critical:  1.0
};

/** Current damage index: max fraction-of-threshold across the five models. */
function damageIndex(cumulative, thresholds) {
    if (!cumulative || !thresholds) return 0;
    const fracs = [
        (cumulative.chemicalDeltaE || 0) / thresholds.chemicalDeltaE,
        (cumulative.mouldIndexFinal || 0) / thresholds.mouldIndex,
        (cumulative.fatigueDamage || 0) / thresholds.fatigueDamage,
        (cumulative.saltCumulative || 0) / thresholds.saltCumulative
    ];
    return Math.min(1, Math.max(...fracs));
}

/** ETA contribution: 1 / min(years_to_any_threshold), capped at 1. */
function etaContribution(forecast, historicalDays) {
    if (!forecast || !forecast.etaDays) return 0;
    const futureDays = Object.values(forecast.etaDays)
        .filter(d => d != null)
        .map(d => d - historicalDays)
        .filter(d => d > 0);
    if (futureDays.length === 0) return 0;
    const nearestDays = Math.min(...futureDays);
    const years = nearestDays / 365.25;
    // Terms: 1y→1.0, 5y→0.2, 50y→0.02, 200y→0.005
    return Math.min(1, 1 / Math.max(years, 0.5));
}

/** Recommendations derived from current state. */
function recommendations(artifact, cumulative, thresholds, forecast, anomalies) {
    const recs = [];

    if (!cumulative) {
        recs.push({ priority: 'info',
            message: 'No sensor data yet — install a logger or link an existing sensor to enable predictive monitoring.' });
        return recs;
    }

    const t = thresholds;
    // Current-damage rules
    if (cumulative.fatigueDamage / t.fatigueDamage > 0.8) {
        recs.push({ priority: 'critical',
            message: 'Fatigue damage approaching first-crack threshold — install or tighten RH buffering at the cave entrance.' });
    }
    if (cumulative.mouldIndexFinal >= 1) {
        recs.push({ priority: 'high',
            message: 'Visible mould risk detected — investigate moisture source and improve ventilation.' });
    }
    if (cumulative.saltCumulative / t.saltCumulative > 0.5) {
        recs.push({ priority: 'high',
            message: 'Cumulative salt-cycling damage rising — consider desalination poultice or reduce monsoon-season RH excursions.' });
    }
    if (cumulative.chemicalDeltaE / t.chemicalDeltaE > 0.8) {
        recs.push({ priority: 'medium',
            message: 'Colour change is approaching perceptibility — reduce illuminance and tighten T/RH control.' });
    }

    // Forecast rules
    if (forecast?.etaDays) {
        const fatigueDays = forecast.etaDays.fatigueDamage != null
            ? forecast.etaDays.fatigueDamage - forecast.historicalDays : null;
        if (fatigueDays != null && fatigueDays > 0 && fatigueDays < 2 * 365) {
            recs.push({ priority: 'high',
                message: `Fatigue-threshold ETA under 2 years (${(fatigueDays / 365).toFixed(1)} y) — prioritise RH amplitude buffering.` });
        }
        const mouldDays = forecast.etaDays.mouldIndex != null
            ? forecast.etaDays.mouldIndex - forecast.historicalDays : null;
        if (mouldDays != null && mouldDays > 0 && mouldDays < 5 * 365) {
            recs.push({ priority: 'high',
                message: `Mould-threshold ETA under 5 years (${(mouldDays / 365).toFixed(1)} y) — reduce sustained RH above 80 %.` });
        }
    }

    // Anomaly rules
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
        recs.push({ priority: 'critical',
            message: `${criticalAnomalies.length} critical sensor anomal${criticalAnomalies.length > 1 ? 'ies' : 'y'} active — investigate now.` });
    }

    // Inspection rule
    if (artifact.lastInspectionDate) {
        const age = Date.now() - Number(artifact.lastInspectionDate);
        const years = age / (365.25 * 86400 * 1000);
        if (years > 2) {
            recs.push({ priority: 'medium',
                message: `Last inspection was ${years.toFixed(1)} years ago — schedule a routine visual survey.` });
        }
    } else {
        recs.push({ priority: 'low',
            message: 'No inspection record on file — log the most recent visual survey to enable freshness tracking.' });
    }

    if (recs.length === 0) {
        recs.push({ priority: 'info',
            message: 'All monitored indicators are within thresholds; continue routine environmental monitoring.' });
    }
    return recs;
}

async function scoreArtifact(artifact, artifactType) {
    const gid = artifact.gid;

    // 1. Replay against monitored history (with forecast for ETA)
    let replayResult = null;
    try {
        replayResult = await ReplayService.replayHistory(gid, { forecast: true, maxYears: 50 });
    } catch (err) {
        console.warn(`Replay failed for ${gid}: ${err.message}`);
    }

    // 2. Anomalies on the artifact's sensors
    const caveGid = await ExhibitService._findParentCaveGid(gid);
    const sensors = await TelemetryService.sensorsForArtifact(gid, caveGid);
    const anomalies = [];
    for (const s of sensors) {
        const a = await AnomalyService.detectSensor(s);
        if (a.length > 0) anomalies.push(...a);
    }

    // 3. Inspection freshness
    let daysSinceInspection = null;
    if (artifact.lastInspectionDate) {
        daysSinceInspection = (Date.now() - Number(artifact.lastInspectionDate)) / 86400000;
    }

    // 4. Conservation status severity. Use ?? not || so 'excellent' (severity 0)
    // is preserved instead of falling back to the unknown-status default 0.5.
    const statusSev = STATUS_SEVERITY[artifact.conservationStatus] ?? 0.5;

    // --- Composite score ---
    const dIdx = damageIndex(replayResult?.cumulative, replayResult?.thresholds);
    const eIdx = etaContribution(replayResult?.forecast, replayResult?.historicalDays || 0);
    const aIdx = Math.min(1, anomalies.length / 3);
    const iIdx = daysSinceInspection != null ? Math.min(1, daysSinceInspection / 365) : 0.5;
    const sIdx = statusSev;

    const score =
        WEIGHTS.damage     * dIdx +
        WEIGHTS.eta        * eIdx +
        WEIGHTS.anomaly    * aIdx +
        WEIGHTS.inspection * iIdx +
        WEIGHTS.status     * sIdx;

    const recs = recommendations(
        artifact,
        replayResult?.cumulative,
        replayResult?.thresholds,
        replayResult?.forecast,
        anomalies
    );

    return {
        gid,
        name: artifact.name || gid,
        type: artifactType,
        conservationStatus: artifact.conservationStatus || null,
        caveGid,
        sensors: sensors.length,
        anomalies: anomalies.length,
        anomalyDetail: anomalies,
        historicalDays: replayResult?.historicalDays || 0,
        cumulative: replayResult?.cumulative || null,
        forecast: replayResult?.forecast || null,
        indices: {
            damage: dIdx,
            eta: eIdx,
            anomaly: aIdx,
            inspection: iIdx,
            status: sIdx
        },
        score,
        priorityTier: score >= 2.5 ? 'critical'
                    : score >= 1.5 ? 'high'
                    : score >= 0.8 ? 'medium'
                    : 'low',
        recommendations: recs,
        daysSinceInspection
    };
}

module.exports = {
    WEIGHTS,
    STATUS_SEVERITY,
    scoreArtifact,

    /** Score every exhibit across all types. Sorted descending by score. */
    async scoreAll() {
        const exhibits = await ExhibitService._queryAll();
        const scored = [];
        for (const e of exhibits) {
            try {
                const s = await scoreArtifact(e, e._exhibitType);
                scored.push(s);
            } catch (err) {
                console.warn(`Score failed for ${e.gid}: ${err.message}`);
            }
        }
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }
};
