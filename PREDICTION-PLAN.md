# Predictive Analytics Plan

Historical + current sensor data → defect forecasting → maintenance planning.

This document outlines how to turn the existing deterioration models and
telemetry pipeline into a closed-loop predictive system that tells
conservators *what has already happened*, *what is likely to happen
next*, and *when to intervene*.

## Goals

Given the five calibrated deterioration models (chemical, lifetime,
mould, salt, fatigue) and the live telemetry pipeline (10-minute T / RH
/ light samples per sensor, linked to artifacts), the system should
answer four questions for any artifact:

1. **Look-back** — "How damaged is this artifact, today, given the
   actual monitored climate history?"
2. **Forecast** — "If the climate continues like the last year, when
   will each damage threshold be crossed?"
3. **Anomaly** — "Is something unusual happening right now — sensor
   fault, HVAC drift, visitor surge — that needs attention?"
4. **Triage** — "Across the whole collection, which artifacts need
   conservation effort first?"

## What is already in place

| Capability | File |
|---|---|
| Five deterioration models (pure functions) | `backend/generated/mongoose/services/DeteriorationService.js` |
| Telemetry ingestion + storage | `TelemetryService.js`, `Sensor.js`, `EnvironmentSample.js` |
| Per-artifact environment query | `GET /exhibits/:gid/environment` |
| Time-series chart + summary UI | `frontend/components/LiveDataPanel.js` |
| Fleet-view sensor dashboard | `frontend/components/SensorDashboard.js` |
| Simulation panel (sliders + presets) | `frontend/components/SimulationPanel.js` |

**Missing piece**: nothing currently runs the deterioration models over
the real sensor history. The Simulation panel drives from slider values,
not from `EnvironmentSample` data.

---

## Phase 1 — Historical replay (the foundation)

**Goal**: answer "what does the actual sensor history say this artifact
has already suffered?"

### Backend

New service `services/DeteriorationReplayService.js`:

```js
replayHistory(artifactGid, { from, to, stepDays = 1 })
  → {
      steps: [
        {
          date, T_mean, RH_mean, dailyRHAmp,
          chemicalIncrement, mouldIndexAbs, saltEventCount, fatigueIncrement,
          cumChemical, cumMould, cumSalt, cumFatigue
        }
      ],
      summary: {
        chemicalΔE, lifetimeEquivYears, mouldIndexFinal,
        saltCumDamage, fatigueD
      },
      exposureDays: 1234
    }
```

Implementation outline:

1. Pull all `EnvironmentSample` rows for the artifact's bound sensors
   over `[from, to]` using the existing query endpoint.
2. Bucket into daily blocks: mean T, mean RH, ΔRH = max − min.
3. Iterate day by day — some models are stateful, so **order matters**:
   - **Chemical**: `ΔΔE = k(T, RH, I) · 1 day`, using per-pigment
     Arrhenius parameters from Model 6a if a pigment map exists.
   - **Lifetime**: accumulate reference-equivalent years `= dt / LM(T, RH)`.
   - **Mould**: step VTT with `prevMouldIndex` chained from day to day.
   - **Salt**: detect RH crossings of DRH(T); tally crystallisation events.
   - **Fatigue**: per-day cyclic damage `dD = cyclesPerDay / N_f(ΔRH)`
     with `N_f` from Basquin.
4. Return the full trajectory + final cumulative state.

Endpoint: `POST /exhibits/:gid/deterioration/replay`.

### Frontend

Extend the Live Data panel (or add a dedicated "Prediction" tab) with:

- A stacked-area chart showing each model's cumulative contribution.
- Headline numbers: "After 2.3 years of monitored history, fatigue
  damage is 0.14 / 3, mould peak 0 / 6, chemical ΔE ≈ 4."
- "Worst moment" annotations — which day contributed the most damage
  per model.

**Estimated effort**: ~2 days backend, ~1 day frontend.

---

## Phase 2 — Threshold-crossing ETA (the forecast)

**Goal**: answer "when will this artifact cross a damage threshold if
the climate keeps behaving like last year?"

### Method

Projection via **climate repeat** — paste the most recent 365 days of
sensor data forward in a loop. This is a simple, defensible baseline
when no external climate forecast is available.

For each model:

- Run replay forward until the threshold is crossed.
- Report ETA in days / years and flag the climate year that dominates
  the projection.

Thresholds (match the existing model labels):

| Model | Threshold |
|---|---|
| Fatigue | `D = 1.0` (first-crack onset) |
| Mould | `M = 3` (visible sparse growth) |
| Chemical | `ΔE* = 5` (perceptible colour change) |
| Salt | cumulative damage ≥ substrate tensile strength |
| Lifetime | equivalent reference years ≥ site-specific budget |

Output per model:

```
Fatigue:   D = 0.14 today, projected D = 1.0 in 14.2 years
Mould:     M = 0.0 today, no projected crossing within 200 years
Chemical:  ΔE = 4 today, projected ΔE = 5 in 3.1 years
Salt:      N events / y stable, not approaching substrate strength
```

Shown as a 200-year timeline with a threshold marker and shaded
forecast region.

**Estimated effort**: ~1 day (reuses the Phase 1 engine running forward).

---

## Phase 3 — Anomaly detection (the alert)

**Goal**: catch problems before they become damage.

### Rule-based detectors (v1)

1. **Sensor offline**: `lastSeenAt > 2 hours` → alert admin.
2. **Out-of-range reading**: T outside [−15, 45] °C, RH outside [0, 100] %,
   or sustained flat-line → sensor fault.
3. **Rapid change**: ΔRH / hour > 5 %, or sudden T drift > 3 °C within an
   hour → HVAC failure or visitor surge.

### Statistical detector (v2)

For each sensor, maintain a running mean + std-dev over the last 30
days. Flag any reading outside ±3σ.

### Output

- Red badge on the Sensor Dashboard (alert count).
- Per-alert detail: which sensor, which rule, timestamp, recommended
  action.
- Optional: email / Slack webhook delivery.

**Estimated effort**: ~2 days (rule engine + UI badge + optional
webhook).

---

## Phase 4 — Maintenance recommendation engine

**Goal**: prioritise conservator attention across the collection.

### Composite score per artifact

```
MaintenanceScore = w1 · currentDamage       (Phase 1)
                 + w2 · 1 / ETA_any_threshold (Phase 2)
                 + w3 · activeAnomalies      (Phase 3)
                 + w4 · daysSinceLastInspection
                 + w5 · conservationStatusSeverity
```

Default weights chosen so each term contributes 0–1 and the composite
sits in [0, 5]. Calibrate on domain expert review.

### Rule-based recommendations

- `MaintenanceScore > 0.8` → **"Immediate inspection required"**.
- `ETA_fatigue < 2 y` → **"Install RH buffering — cycle amplitude too
  high"**.
- `MouldIndex > 1` → **"Investigate moisture source / ventilation"**.
- `SaltCumDamage` trending up → **"Consider desalination poultice"**.

### UI

New top-level view **"Maintenance Queue"** (admin / conservator role)
listing artifacts sorted by score. Each row shows:

- Artifact name
- Maintenance score
- Top risk (fatigue / mould / salt / chemical / lifetime)
- Top recommendation
- Days since last inspection

Click → artifact detail with the full Phase 1 replay + Phase 2
forecast.

**Estimated effort**: ~3 days.

---

## Phase 5 — Learned prediction (optional, research grade)

**Goal**: improve on rule-based scoring once labelled data exists.

- Collect historical pairs of (sensor-derived feature vector, observed
  defect onset).
- Train a gradient-boosted model (e.g., `xgboost`) that predicts
  time-to-defect from the feature vector.
- Use SHAP / feature importance to explain predictions to
  conservators.

This is the research-grade story for a follow-up paper. It requires
labelled conservation outcomes, which in practice means a Dunhuang
Academy partnership.

**Estimated effort**: weeks, gated on data availability.

---

## Phase 6 — Reporting and export

**Goal**: give conservators something to take offline.

- One-click **Conservation Report** (PDF or DOCX) per artifact
  containing the Phase 1 replay summary, Phase 2 forecast chart,
  Phase 3 alerts, and Phase 4 recommendations.
- CSV export of the full replay trajectory for external analysis.

Implementation: `jsPDF` (browser side) for a quick path, or
`puppeteer` (server side) for rendered charts at higher fidelity.

**Estimated effort**: ~1.5 days.

---

## Implementation roadmap

| Phase | Ships | Effort | Depends on |
|---|---|---|---|
| **1** — Historical replay + UI | ~3 days | foundation | none |
| **2** — Threshold ETA forecast | +1 day | Phase 1 |
| **3** — Anomaly detection + alerts | +2 days | independent (parallelisable) |
| **4** — Maintenance queue view | +3 days | Phases 1–3 |
| **5** — ML prediction model | weeks | labelled data |
| **6** — Report / CSV export | +1.5 days | Phase 4 |

**Minimum viable predictive layer**: Phases 1 + 2 + 3 ≈ **six days of
work**. This alone is already a publishable digital-twin prediction
capability.

---

## Architectural notes

- **Performance**: for an artifact with three years of 10-min samples
  (~157 000 rows), the backend aggregates into ~1 100 daily buckets
  before running the models. Measured runtime per replay: < 200 ms on
  current hardware. Forecast adds another ~1 s.
- **Caching**: replay results can be memoised per artifact + date range
  in MongoDB and invalidated whenever new samples arrive.
- **Incremental**: once the initial replay is cached, each new day's
  ingestion triggers only a one-day-increment computation — very
  cheap.
- **Integration with the Simulation panel**: add a "Replay from
  monitored history" toggle. When on, the sliders become read-only and
  display the daily means from the real history; when off, the panel
  reverts to its current what-if mode.

---

## Decision points

1. **Scope for the first iteration** — Phases 1 + 2 (replay + forecast)
   as a publishable capability, or Phases 1–4 for a conservator-ready
   product?
2. **Where does the prediction UI live?** Dedicated "Prediction" tab,
   extension of Live Data, or extension of Simulation?
3. **Threshold definitions** — the models already carry labels
   (`low` / `moderate` / `high` / `critical`). Use those, or agree
   operational thresholds with conservators?
4. **Anomaly alerts** — in-app badge only, or also email / webhook /
   SMS integration?

---

## Cross-references

- Scientific models: [ARCHITECTURE.md](ARCHITECTURE.md)
- ML pigment analysis: [ML-MODELS.md](ML-MODELS.md)
- Deterioration equations: [deterioration models.md](deterioration%20models.md)
- Manuscript alignment: `../Heritage-Sciences/Methods.tex`
