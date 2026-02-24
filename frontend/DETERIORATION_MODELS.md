# Deterioration Models - Modular Heritage Degradation Engine

## Overview

This document describes the **modular deterioration engine** added to the Mogao Digital Twin simulation system. The engine extracts and extends the original Strlič dose-response chemical fading model into a standalone module (`DeteriorationEngine.js`), and adds two new scientifically-grounded models:

1. **Michalski Lifetime Multiplier** (Climate for Culture eLM variant)
2. **VTT / Finnish Mould Growth Model** (Hukka & Viitanen 1999)

All three models run in the simulation panel and feed into the 3D model viewer for real-time visual feedback on the texture.

---

## Architecture

### Before (inline)

```
SimulationPanel.js  ──(degradationFactor)──>  ModelViewer.js
  └─ inline calculateRateConstant()           └─ texture fading
  └─ inline calculateMoistureContent()
```

### After (modular engine)

```
DeteriorationEngine.js
  ├─ calculateMoistureContent()     Paltakari-Karlsson isotherm
  ├─ calculateRateConstant()        Arrhenius composite rate
  ├─ chemicalFading()               First-order pigment fading
  ├─ lifetimeMultiplier()           Michalski / eLM
  ├─ mouldGrowth()                  VTT Finnish model
  └─ assess()                       Run all models, return combined results

SimulationPanel.js  ──(per-model results)──>  ModelViewer.js
  └─ imports Engine                            └─ chemical fading (texture)
  └─ Lifetime Multiplier card                  └─ mould spots (procedural)
  └─ Mould Risk card
  └─ Chart.js (mould index dataset)
```

### File Structure

| File | Role |
|------|------|
| `frontend/deterioration/DeteriorationEngine.js` | **New** — Standalone calculation module |
| `frontend/components/SimulationPanel.js` | **Modified** — Uses engine, new UI cards |
| `frontend/components/ModelViewer.js` | **Modified** — Composite texture pipeline |
| `frontend/i18n.js` | **Modified** — New translation keys (zh + en) |
| `frontend/styles/simulation-panel.css` | **Modified** — Card and gauge styles |
| `frontend/index.html` | **Modified** — Added CSS link |

---

## Model 1: Chemical Pigment Fading (existing, refactored)

Extracted from inline code into `DeteriorationEngine.chemicalFading()`. No scientific changes.

### Paltakari-Karlsson Moisture Isotherm

```
[H₂O] = |ln(1 − RH) / (1.67·T − 285.655)|^(1/(2.491 − 0.012·T))
```

- **RH**: Relative humidity as fraction (0-1)
- **T**: Temperature in Kelvin

### Arrhenius Composite Rate Constant

```
k = k₀_dark · [H₂O]^q · exp(−Eₐ_dark / RT)
  + k₀_light · I^p · [H₂O]^q · exp(−Eₐ_light / RT)
```

| Parameter | Value | Source |
|-----------|-------|--------|
| Eₐ_dark | 70 kJ/mol | Linseed oil autoxidation (Kowalski et al. 2017) |
| Eₐ_light | 25 kJ/mol | Organic pigment photofading (Feller 1994) |
| q | 0.8 | Reaction order w.r.t. water |
| p | 0.9 | Light reciprocity exponent |
| R | 8.314 J/(mol·K) | Universal gas constant |

### First-Order Kinetics

```
degradationFactor = exp(−k · t)
scientificDegradation = (1 − degradationFactor) × 100%
```

### Visual Effect

Per-pixel texture manipulation on the 3D model with **10x visual amplification**:

- **Fading** — desaturation toward grayscale
- **Yellowing** — red/green shift, blue reduction
- **Darkening** — overall brightness reduction (up to 25%)

---

## Model 2: Michalski Lifetime Multiplier

### Scientific Basis

The Climate for Culture equivalent Lifetime Multiplier (eLM) compares chemical degradation rate at current conditions to a museum reference of **20°C / 50% RH** (Leissner et al. 2015, *Heritage Science* 3:38; Michalski 2002, CCI).

### Equation

```
LM = exp[(Eₐ / R) · (1/T − 1/T₀)] · (RH₀ / RH)^n
```

| Symbol | Value | Meaning |
|--------|-------|---------|
| T₀ | 293.15 K (20°C) | Reference temperature |
| RH₀ | 50% | Reference humidity |
| Eₐ | 70,000 J/mol | Activation energy (linseed oil) |
| n | 1.3 | Humidity exponent |
| R | 8.314 J/(mol·K) | Gas constant |

### Interpretation

- **LM > 1**: Object lasts *longer* than at reference conditions (green)
- **LM = 1**: Same as museum reference
- **LM < 1**: Object degrades *faster* (orange if 0.5–1.0, red if < 0.5)

### UI

A **Lifetime Multiplier card** in the simulation panel showing the multiplier value with color coding and label (`longer lifetime` / `shorter lifetime`).

### Example Values

| Conditions | LM | Meaning |
|------------|-----|---------|
| 20°C / 50% RH | ~1.0× | Museum reference |
| 10°C / 30% RH | ~8× | 8× longer lifetime |
| 30°C / 70% RH | ~0.1× | Degrades 10× faster |
| 0°C / 30% RH | ~150× | Cold storage benefit |

---

## Model 3: VTT / Finnish Mould Growth Model

### Scientific Basis

The VTT model (Hukka & Viitanen 1999, *Wood Science and Technology* 33:475-485; Ojanen et al. 2011) predicts mould growth on heritage substrates using a critical humidity threshold and a 0–6 mould index scale. It is the primary mould risk model used in European heritage conservation.

### Critical RH Threshold

Below this humidity, no mould grows:

```
RH_crit = −0.0026·T³ + 0.160·T² − 3.13·T + 100.0
```

Valid for T = 0–50°C. Examples:

| Temperature | RH_crit |
|-------------|---------|
| 5°C | ~92% |
| 10°C | ~87% |
| 15°C | ~84% |
| 20°C | ~80% |
| 25°C | ~77% |
| 30°C | ~74% |

### Mould Index Scale

| M | Description |
|---|-------------|
| 0 | No growth |
| 1 | Microscopic growth visible |
| 2 | Visible under microscope |
| 3 | Surface coverage < 10% |
| 4 | Surface coverage 10–50% |
| 5 | Surface coverage 50–100% |
| 6 | Tight, complete coverage |

### Growth Rate (simplified)

When RH ≥ RH_crit and T > 0°C:

```
dM/dt = 0.13 · (RH − RH_crit) / 100 · T / 20
```

Calibrated so that at **30°C / 95% RH**, M reaches 6 in approximately 180 days (6 months).

### Decline Rate

When RH < RH_crit:

```
dM/dt = −0.128 per day
```

(Based on VTT specification: −0.032 per 6 hours dry, −0.016 per 24 hours after initial decline.)

### Incremental Tracking

During time progression (play mode), the mould index is tracked incrementally:

```
mouldIndex += growthRate × daysPerTick
```

This captures realistic dynamics where mould grows during humid periods and declines during dry periods.

### UI

A **Mould Risk card** in the simulation panel showing:

- **Gauge bar** — 0–6 scale with color transitions (green → orange → red)
- **Mould index value** — current M with one decimal place
- **Scale description** — human-readable interpretation
- **Threshold display** — shows RH_crit for current temperature
- **Status badge** — Safe / Warning / Active Growth

### Visual Effect: Procedural Mould Spots

Applied to the 3D model texture after chemical fading, using **deterministic pseudo-random noise**:

```javascript
// Seeded hash for reproducible spot placement
hash(x, y, seed) → 0-1

// Grid-based spot generation (8px grid, 12px radius)
// Spots are dark green-black (RGB 20, 40, 15)
// Soft-edged falloff from spot center
// Biased toward darker pixels (moisture-prone recesses)
// Coverage percentage = mouldIndex / 6
```

**Key properties:**
- Spots are **deterministic** — same position between frames (no flickering)
- **Dark bias** — darker original pixels get more mould (recesses hold moisture)
- **Soft edges** — spots fade from center outward, not hard circles
- **Coverage scales** with mould index — M=1 shows sparse spots, M=6 shows full coverage

---

## Composite Texture Pipeline

The ModelViewer applies deterioration effects in sequence:

```
1. Start with original texture (stored on load)
2. Apply chemical fading
   └─ Desaturation, yellowing, darkening (per-pixel)
3. Apply mould spots (if mouldIndex > 0.1)
   └─ Procedural dark green-black blotches (per-pixel)
4. Write to canvas → CanvasTexture → apply to 3D mesh materials
```

---

## Event Data Structure

The simulation panel emits enriched events with per-model breakdowns:

```javascript
{
    temperature: { value: 293.15, unit: 'K', celsius: 20 },
    humidity: { value: 50, unit: 'RH' },
    deterioration: {
        // Legacy fields (backward compatible)
        days, months, years, lightIntensity, totalDays,
        rateConstant, degradationFactor, scientificDegradation,

        // Per-model results
        chemical: {
            rateConstant, degradationFactor, scientificDegradation,
            risk, label, visualEffect
        },
        lifetime: {
            multiplier, label, color
        },
        mould: {
            mouldIndex, rhCritical, isAboveThreshold,
            risk, label, growthRate,
            visualEffect: { coverage, intensity }
        }
    },
    timestamp: Date.now(),
    speed: 1.0
}
```

---

## Chart.js Integration

The time-series chart now includes a **Mould Index** dataset (dashed green line, 0–6 scale on hidden y3 axis) alongside the existing temperature, humidity, light, and degradation datasets.

---

## i18n Support

New translation keys added for both Chinese (zh) and English (en):

| Key | Chinese | English |
|-----|---------|---------|
| `simulation.lifetime.title` | 寿命倍数 | Lifetime Multiplier |
| `simulation.lifetime.longer` | 更长寿命 | longer lifetime |
| `simulation.lifetime.shorter` | 更短寿命 | shorter lifetime |
| `simulation.lifetime.reference` | 相对博物馆参考条件... | vs. museum reference... |
| `simulation.mould.title` | 霉菌风险 | Mould Risk |
| `simulation.mould.index` | 霉菌指数 | Mould Index |
| `simulation.mould.threshold` | 霉菌阈值: {rh}% RH | Mould threshold: {rh}% RH |
| `simulation.mould.exceeded` | 已超过阈值 | threshold exceeded |
| `simulation.mould.safe` | 安全 | Safe |
| `simulation.mould.warning` | 警告 | Warning |
| `simulation.mould.active` | 活跃生长 | Active Growth |
| `simulation.mould.scale.0-6` | 无生长...完全覆盖 | No growth...Tight coverage |

---

## Verification

1. Start backend: `cd backend && start.bat`
2. Start frontend: `cd frontend && start-frontend.bat`
3. Open a statue detail view with a 3D model loaded
4. Enable simulation and verify:

| Test | Expected |
|------|----------|
| Sliders at 20°C / 50% RH | Lifetime ≈ 1.0×, Mould = Safe |
| Lower temp to 10°C, RH to 30% | Lifetime > 1× (green, "longer") |
| Raise temp to 35°C, RH to 80% | Lifetime < 1× (red, "shorter"), Mould switches to "Active Growth" |
| Press Play at high RH | Mould index rises over time, green-black spots appear on texture |
| Lower RH below threshold | Mould status returns to Safe, index declines |
| Apply preset "Museum (100y)" | Chemical fading visible, mould stays at 0 |
| Switch to Chinese language | All new labels display in Chinese |

---

## References

- Hukka, A. & Viitanen, H. (1999). A mathematical model of mould growth on wooden material. *Wood Science and Technology*, 33:475-485.
- Ojanen, T. et al. (2011). Mould growth modeling of building structures using sensitivity classes of materials. *Proceedings of Building Simulation 2011*.
- Michalski, S. (2002). Double the life for each five-degree drop, more than double the life for each halving of relative humidity. *Preprints of ICOM-CC 13th Triennial Meeting*, Rio de Janeiro.
- Leissner, J. et al. (2015). Climate for Culture: assessing the impact of climate change on the future indoor climate in historic buildings using simulations. *Heritage Science*, 3:38.
- Kowalski, S. et al. (2017). Thermal-oxidative stability of linseed oil by PDSC. *Journal of Thermal Analysis and Calorimetry*, 130:53-60.
- Feller, R. (1994). *Accelerated Aging: Photochemical and Thermal Aspects*. Getty Conservation Institute.
- Johnston-Feller, R. et al. (1984). The kinetics of fading: opaque paint films pigmented with alizarin lake and titanium dioxide. *JAIC*, 23(2):114-129.
- Strlič, M. et al. (2015). Damage function for historic paper. *Heritage Science*, 3:40.
