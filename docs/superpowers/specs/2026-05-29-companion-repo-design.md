# Companion code repository — design spec

**Date:** 2026-05-29
**Topic:** Public model-library companion repo for the npj Heritage Science paper
("A Model-Based Digital Twin for Predicting Deterioration of Mogao Polychrome Sculpture")

## Purpose

Readers of the paper need a citable, self-contained code artifact they can refer
to from the Code Availability section. The live digital-twin application
(`mogao-digital-twin`: Vue frontend + Node/MongoDB runtime + Micronaut/EGL
design-time) is too heavy and operationally entangled to serve that role. This
spec defines a **pure Python model library** that extracts only the paper's
scientific substance — the seven deterioration/segmentation model kernels — into
a new standalone repository.

## Scope decisions (locked)

| Decision | Choice |
| --- | --- |
| Repo type | Reproducibility package — no server, no database |
| Model code | One clean Python library; the paper's model math lives here once |
| Data files | **None** — no measured pilot colorimetry, no derived `.xlsx` |
| Figure scripts | **None** — `figures/` excluded entirely |
| Climate driver | **None** — `climate.py` excluded; readers supply their own inputs |
| Licence | MIT, with `CITATION.cff` pointing at the paper |
| App repo | Untouched — this is a clean extraction, not a refactor of `mogao-digital-twin` |

## Repository

A new standalone git repository at `c:/Users/willr/Git/mogao-deterioration-models`
(name provisional), pushed to a fresh GitHub remote and linked from the paper.

```
mogao-deterioration-models/
├── README.md            # overview, install, per-model usage snippets, model→paper-equation map, "not included" note
├── LICENSE              # MIT
├── CITATION.cff         # cite the npj paper
├── pyproject.toml       # single runtime dependency: numpy
└── mogao_models/
    ├── __init__.py      # re-exports the public function of each module
    ├── pigment.py       # Model 1 — HSV-threshold pigment-class segmenter
    ├── chemical.py      # Model 2 — Arrhenius + Paltakari–Karlsson chemical fading
    ├── lifetime.py      # Model 3 — Michalski lifetime multiplier
    ├── mould.py         # Model 4 — VTT Hukka–Viitanen mould index
    ├── salt.py          # Model 5 — Steiger crystallisation pressure + DRH thresholds
    ├── fatigue.py       # Model 6 — hygro-mechanical Miner-rule fatigue damage
    └── composite.py     # composite-risk aggregation (weighted sum of normalised sub-indices)
```

## Module contracts

Each module is one self-contained unit: one clear public function (plus private
helpers), a docstring citing the corresponding paper model/equation, and
parameter names matching the paper's notation. A reader can understand and use
each module without reading the others.

- **pigment.py** — `segment(rgb_array) -> class_map`. Vectorised RGB→HSV plus the
  eight-class threshold ladder; a faithful Python port of
  `frontend/pigment/PigmentIdentifier.js`. Operates on a caller-supplied RGB
  numpy array; no bundled demo image (stated in README).
- **chemical.py** — `k(T, RH)` / fading rate using Arrhenius `A·exp(-Ea/RT)` with
  the Paltakari–Karlsson humidity coupling `(RH/RH_ref)**q`, plus the first-order
  saturating ΔE* form `ΔE*_max·(1 - exp(-k·t))`. Per-pigment Arrhenius parameters
  exposed as documented defaults.
- **lifetime.py** — Michalski cumulative-dose lifetime multiplier.
- **mould.py** — `vtt_step(M, T, RH, dt)` integrating the Hukka–Viitanen index
  with `RH_crit(T) = 96 - 0.8·T_C`. Documents the intentional softer desiccation
  decay used for the monitored-climate figure vs the paper's instantaneous value.
- **salt.py** — `crystallisation_pressure(T, RH, phase)` (Steiger ideal-solution
  form) and the mirabilite/thenardite DRH threshold fits; trough-RH evaluation
  noted.
- **fatigue.py** — Miner-rule cumulative damage from RH cycling amplitude.
- **composite.py** — `composite_risk(sub_indices, weights)` aggregating the five
  normalised mechanism indices; default weights documented against the paper's
  table.

## Provenance and fidelity

The library is **consolidated from the existing Python** in
`experiments/_make_figure_*.py`, which already implements each model and produced
the figures committed to the paper. That Python is the source of truth for the
extraction. Each kernel is additionally cross-checked against its JavaScript
counterpart in `backend/runtime/services/domain/DeteriorationService.js`, and any
**intentional** divergence (e.g. the mould module's softer desiccation decay,
chosen so the monitored-climate trajectory is legible) is documented in the
module docstring rather than silently reconciled.

## README contents

1. One-paragraph overview and link back to the paper.
2. Install: `pip install -e .` (numpy only).
3. Per-model usage snippet using small hand-written toy input arrays.
4. A module → paper model/equation-number table.
5. Explicit **"Not included (yet)"** note: measured pilot colorimetry, the
   image-dependent figures (pigment map, composite render), and the
   data-dependent figures (pilot trajectories, validation) are withheld for now;
   available on request / a future release.

## Explicitly out of scope

`figures/`, any `.xlsx` data, the central-Buddha texture images, the synthetic
climate driver (`climate.py`), the JavaScript originals, and any server/database
code. No changes to the `mogao-digital-twin` repository.

## Success criteria

- `pip install -e .` succeeds with numpy as the only runtime dependency.
- Every public function imports and runs on toy inputs as shown in the README.
- Each module docstring names its paper model/equation and any divergence from
  the canonical JS kernel.
- The repo contains no measured data, no images, no figure scripts.
- MIT `LICENSE` and a `CITATION.cff` resolving to the paper are present.
