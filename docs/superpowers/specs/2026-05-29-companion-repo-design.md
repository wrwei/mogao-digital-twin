# Public companion repository — design spec

**Date:** 2026-05-29
**Topic:** Public code repository accompanying the npj Heritage Science paper
("A Model-Based Digital Twin for Predicting Deterioration of Mogao Polychrome Sculpture")

## Purpose

The paper's Code Availability section needs a citable, public repository that
lets readers and reviewers inspect the code behind the work. The live
application (`mogao-digital-twin`: Vue frontend + Node/MongoDB runtime +
Micronaut/EGL design-time) is too operationally entangled (database, auth,
sensor API, keys) to publish wholesale.

This spec defines a curated **three-component public repository** that exposes
code for **all four of the paper's contributions** while leaving the operational
runtime private.

## Contribution → component coverage

| Paper contribution | Public component |
| --- | --- |
| 1. Arrhenius + Paltakari–Karlsson fading kinetics | `models/` |
| 2. 3D physical twin | `viewer/` |
| 3. Multi-mechanism composite risk | `models/` |
| 4. Generic MDE / metamodel framework | `mde/` |

The Node/MongoDB **operational runtime** (`backend/runtime/`: telemetry, auth,
sensor REST API) is **not** a paper contribution and stays private.

## Scope decisions (locked)

| Decision | Choice |
| --- | --- |
| Repo type | Curated public release — no operational backend, no database |
| Organisation | **One repository, three top-level component folders** |
| Languages | Python (`models/`), Java + Epsilon (`mde/`), JavaScript (`viewer/`) |
| Measured data | **None** — no pilot colorimetry, no `.xlsx`, no heritage images |
| Demo 3D asset | **One** generic, licence-clean model + texture bundled so `viewer/` renders out of the box (a generic asset, not measured heritage data) |
| Segmenter | JS `PigmentIdentifier.js` in `viewer/` is Model 1's single public home; **no** Python port |
| Licence | MIT, with `CITATION.cff` pointing at the paper |
| App repo | Untouched — clean extraction, no changes to `mogao-digital-twin` |

## Repository

A new standalone git repository at `c:/Users/willr/Git/mogao-digital-twin-public`
(name provisional — alternatives: `mogao-dt-paper`, `mogao-polychrome-dt`),
pushed to a fresh GitHub remote and linked from the paper.

```
mogao-digital-twin-public/
├── README.md            # top-level: component→contribution map, paper link, per-component pointers
├── LICENSE              # MIT
├── CITATION.cff         # cite the npj paper
│
├── models/              # Component 1 — deterioration kernels  [contributions 1, 3]
│   ├── README.md        # install, per-model usage snippets, model→paper-equation map
│   ├── pyproject.toml   # single runtime dependency: numpy
│   └── mogao_models/
│       ├── __init__.py
│       ├── chemical.py    # Model 2 — Arrhenius + Paltakari–Karlsson fading (first-order saturating ΔE*)
│       ├── lifetime.py    # Model 3 — Michalski lifetime multiplier
│       ├── mould.py       # Model 4 — VTT Hukka–Viitanen index
│       ├── salt.py        # Model 5 — Steiger pressure + DRH thresholds
│       ├── fatigue.py     # Model 6 — hygro-mechanical Miner-rule damage
│       └── composite.py   # composite-risk aggregation (weighted normalised sub-indices)
│
├── mde/                 # Component 2 — MDE design-time  [contribution 4]
│   ├── README.md        # what the metamodel/codegen does, how to run transformations
│   ├── pom.xml          # Maven build
│   └── src/main/
│       ├── java/.../codegen/CodeGenerator.java, util/EpsilonModelManager.java
│       └── resources/
│           ├── metamodel/mogao_dt.ecore (+ .emf)        # the domain metamodel
│           ├── templates/...egl                          # EGL code-generation templates
│           ├── eol-scripts/...eol                        # EOL domain operations
│           └── models/instances/...                      # example model instances (flexmi/model)
│
└── viewer/              # Component 3 — 3D physical twin + segmenter  [contribution 2, Model 1]
    ├── README.md        # how to serve demo.html, where the demo asset lives
    ├── demo.html        # standalone viewer demo (from frontend/model-viewer-demo.html), no backend
    ├── components/ModelViewer.js
    ├── services/DeteriorationRenderer.js
    ├── services/SimulationEngine.js     # api/backend coupling stubbed or made optional for the demo
    ├── pigment/PigmentIdentifier.js, PigmentDatabase.js, PigmentAnalysis.js   # Model 1
    ├── styles/ + css/ (viewer + simulation styling only)
    └── assets/demo/      # one bundled licence-clean model + texture
```

## Component contracts

### `models/` (Python, numpy only)
One module per model; one clear public function plus private helpers; docstring
citing the paper model/equation; parameters named to match the paper. Source of
truth is the existing Python in `experiments/_make_figure_*.py` (which produced
the committed paper figures), consolidated and cleaned. Each kernel is
cross-checked against `backend/runtime/services/domain/DeteriorationService.js`,
and any **intentional** divergence (e.g. the mould module's softer desiccation
decay chosen for figure legibility) is documented in the docstring. README shows
each function run on small hand-written toy arrays. No climate driver, no
figures, no data.

### `mde/` (Java + Epsilon, Maven)
Extracted verbatim from `backend/src/` plus `backend/pom.xml`. Demonstrates the
generic MDE contribution: the Ecore metamodel, the EGL templates that generate
the Mongoose models/controllers/routers/services and EOL operations, and the
Java codegen driver. Sample texture `.jpg` files under `resources/exhibit_models/`
are dropped (images). Example model instances are kept (they demonstrate the
metamodel, are not heritage data). README explains the transformation workflow
(the existing `RUN_TRANSFORMATIONS.md` is the basis).

### `viewer/` (JavaScript, browser)
A focused standalone demo of the 3D physical twin — **not** the whole Vue SPA.
Includes `ModelViewer.js` (Three.js, with the render-on-demand + PDF-export
behaviour), `DeteriorationRenderer.js`, `SimulationEngine.js`, the pigment
segmenter (Model 1), and the viewer/simulation styling. `demo.html` (derived
from `model-viewer-demo.html`) serves it with no backend; `SimulationEngine.js`
back-end calls are stubbed or guarded so the demo runs offline. One bundled
licence-clean model+texture under `assets/demo/` so it renders immediately.
Excludes `app.js`, `api.js`, login/dashboard/sensor components, and i18n unless
strictly needed by the viewer.

## Provenance and fidelity

- `models/` is consolidated from the figure-generating Python, cross-checked
  against the canonical JS kernels, with divergences documented.
- `mde/` and `viewer/` ship the actual project source (curated subset), so they
  faithfully represent the deployed system rather than a re-implementation.

## README contents (top-level)

1. One-paragraph overview and link to the paper.
2. The contribution→component table above.
3. Per-component quick-start pointers (each component has its own README).
4. Explicit **"Not included"** note: the operational Node/MongoDB runtime
   (telemetry, auth, sensor API), measured pilot colorimetry, heritage images,
   and the data-/image-dependent figures — available from the authors on request.

## Explicitly out of scope

`backend/runtime/` operational code; any `.xlsx` data; central-Buddha and other
heritage images; the Python segmenter port; figure scripts; the full Vue SPA
shell. No changes to the `mogao-digital-twin` repository.

## Open implementation risks

- **Demo asset licence:** `model-viewer-demo.html` references a
  "kneeling-attendant-bodhisattva" model that may be a Met open-access object.
  Implementation must confirm a licence-clean asset (that one, or another) and
  bundle it; otherwise point the demo at a generic placeholder.
- **`SimulationEngine.js` backend coupling:** must verify which `api.` calls are
  load-bearing for the demo and stub/guard them so the viewer runs offline.

## Success criteria

- `models/`: `pip install -e .` succeeds (numpy only); every public function runs
  on the README's toy inputs; docstrings name the paper model/equation and any
  divergence from the JS kernel.
- `mde/`: `mvn` build resolves; the transformation workflow is documented and the
  metamodel + templates are present.
- `viewer/`: `demo.html` renders the bundled asset in a browser with no backend
  running.
- Repo contains no operational runtime, no measured data, no heritage images.
- MIT `LICENSE` and a `CITATION.cff` resolving to the paper are present at the root.
