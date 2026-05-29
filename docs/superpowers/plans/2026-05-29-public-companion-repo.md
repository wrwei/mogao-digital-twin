# Public Companion Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new standalone public repository that exposes code for all four paper contributions — a Python port of the deterioration kernels, the Ecore/EGL MDE design-time, and a standalone 3D-viewer demo — while leaving the operational Node/MongoDB runtime, measured data, and heritage images private.

**Architecture:** One git repository, three independent top-level folders. `models/` is a faithful 1:1 Python port of `backend/runtime/services/domain/DeteriorationService.js`, verified numerically against the JS via a committed reference fixture. `mde/` is the `backend/src/` Maven project copied verbatim (minus sample images). `viewer/` is a curated subset of the Vue frontend wired to run offline by replacing the two `window.api.deterioration` HTTP calls with a local shim over a bundled copy of `DeteriorationService.js`.

**Tech Stack:** Python 3.10+ / numpy / pytest (`models/`); Java 17 + Maven + Eclipse Epsilon (`mde/`); browser ES modules + Three.js (`viewer/`).

**Source paths (in the existing app repo `c:/Users/willr/Git/mogao-digital-twin`):**
- Kernels: `backend/runtime/services/domain/DeteriorationService.js`
- MDE: `backend/src/`, `backend/pom.xml`
- Viewer: `frontend/components/ModelViewer.js`, `frontend/services/DeteriorationRenderer.js`, `frontend/services/SimulationEngine.js`, `frontend/pigment/*.js`, `frontend/model-viewer-demo.html`, `frontend/styles/`, `frontend/css/`

**Composite note:** the paper's five-mechanism `R_composite` is NOT in `DeteriorationService.js`; its canonical source is the committed `experiments/_make_figure_scenarios.py` (weights chemical 0.25, lifetime 0.15, mould 0.15, salt 0.25, fatigue 0.20). The deployed `MaintenanceService.js` composite is a different operational score and is deliberately excluded.

**Target repo path:** `c:/Users/willr/Git/mogao-digital-twin-public` (rename later if desired).

---

## Phase 0 — Repository scaffold

### Task 0.1: Create the repo and root metadata

**Files:**
- Create: `mogao-digital-twin-public/.gitignore`
- Create: `mogao-digital-twin-public/LICENSE`
- Create: `mogao-digital-twin-public/CITATION.cff`
- Create: `mogao-digital-twin-public/README.md`

- [ ] **Step 1: Create directory and init git**

Run:
```bash
cd c:/Users/willr/Git
mkdir mogao-digital-twin-public
cd mogao-digital-twin-public
git init
```
Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Python
__pycache__/
*.pyc
.pytest_cache/
*.egg-info/
.venv/
# Java / Maven
target/
# Test oracle fixtures copied from the app repo (not redistributed)
models/tests/_oracle/
# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Write `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Ran Wei and the Mogao Digital Twin authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Write `CITATION.cff`** (update DOI/authors when known)

```yaml
cff-version: 1.2.0
message: "If you use this software, please cite the accompanying paper."
title: "Mogao Digital Twin — deterioration models, MDE framework, and 3D viewer"
authors:
  - family-names: Wei
    given-names: Ran
type: software
license: MIT
repository-code: "https://github.com/wrwei/mogao-digital-twin-public"
preferred-citation:
  type: article
  title: "A Model-Based Digital Twin for Predicting Deterioration of Mogao Polychrome Sculpture"
  authors:
    - family-names: Wei
      given-names: Ran
  journal: "npj Heritage Science"
  year: 2026
```

- [ ] **Step 5: Write a placeholder root `README.md`** (filled fully in Task 4.1)

```markdown
# Mogao Digital Twin — public code companion

Code accompanying *"A Model-Based Digital Twin for Predicting Deterioration of
Mogao Polychrome Sculpture"* (npj Heritage Science, 2026).

| Paper contribution | Folder |
| --- | --- |
| Arrhenius + Paltakari–Karlsson fading; multi-mechanism composite | [`models/`](models/) |
| Generic MDE / metamodel framework | [`mde/`](mde/) |
| 3D physical twin (viewer + segmenter) | [`viewer/`](viewer/) |

See each folder's README to get started. Full top-level guide: filled in during build.
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore LICENSE CITATION.cff README.md
git commit -m "chore: scaffold public companion repo (license, citation, gitignore)"
```

---

## Phase 1 — `models/` (Python port of DeteriorationService.js)

### Task 1.1: Python package skeleton

**Files:**
- Create: `models/pyproject.toml`
- Create: `models/mogao_models/__init__.py`
- Create: `models/mogao_models/_common.py`
- Create: `models/tests/__init__.py`

- [ ] **Step 1: Write `models/pyproject.toml`**

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "mogao-models"
version = "1.0.0"
description = "Physics-based deterioration kernels for the Mogao digital twin (Python port of DeteriorationService.js)"
readme = "README.md"
requires-python = ">=3.10"
license = { text = "MIT" }
dependencies = ["numpy>=1.24"]

[project.optional-dependencies]
test = ["pytest>=7"]

[tool.setuptools.packages.find]
where = ["."]
include = ["mogao_models*"]
```

- [ ] **Step 2: Write `models/mogao_models/_common.py`**

```python
"""Shared constants and the Paltakari-Karlsson sorption isotherm.

Faithful port of the helpers in DeteriorationService.js.
"""
import math

R = 8.314  # Universal gas constant, J/(mol·K)


def moisture_content(rh_fraction, t_kelvin):
    """Paltakari-Karlsson equilibrium moisture content.

    Port of calculateMoistureContent() in DeteriorationService.js.
    """
    rh_safe = min(max(rh_fraction, 0.01), 0.999)
    numerator = math.log(1.0 - rh_safe)
    denominator = 1.67 * t_kelvin - 285.655
    base = abs(numerator / denominator)
    exponent = 1.0 / (2.491 - 0.012 * t_kelvin)
    return base ** exponent
```

- [ ] **Step 3: Write empty `models/tests/__init__.py` and a stub `models/mogao_models/__init__.py`**

`models/mogao_models/__init__.py`:
```python
"""Mogao digital-twin deterioration models (Python port of DeteriorationService.js)."""
from ._common import R, moisture_content  # noqa: F401
```

- [ ] **Step 4: Verify install**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public/models
pip install -e ".[test]"
python -c "import mogao_models; print(mogao_models.moisture_content(0.35, 286.15))"
```
Expected: a small positive float prints (≈0.06–0.09), no import error.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
git add models/pyproject.toml models/mogao_models/__init__.py models/mogao_models/_common.py models/tests/__init__.py
git commit -m "feat(models): package skeleton + Paltakari-Karlsson isotherm"
```

### Task 1.2: Reference oracle from the canonical JS

**Files:**
- Create: `models/tests/_oracle/generate_reference.js`
- Create: `models/tests/reference_values.json` (generated, committed)

- [ ] **Step 1: Copy the canonical JS into the (gitignored) oracle dir**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
mkdir -p models/tests/_oracle
cp ../mogao-digital-twin/backend/runtime/services/domain/DeteriorationService.js models/tests/_oracle/DeteriorationService.js
```

- [ ] **Step 2: Write `models/tests/_oracle/generate_reference.js`**

```javascript
// Generates reference_values.json by running the canonical kernels over a
// grid of inputs. Run with: node generate_reference.js
const fs = require('fs');
const path = require('path');
const D = require('./DeteriorationService.js');

const cases = [
  { T_celsius: 13, RH_percent: 35, light_klux: 2,  totalDays: 73000, RH_amplitude: 5 },
  { T_celsius: 25, RH_percent: 90, light_klux: 0,  totalDays: 3650,  RH_amplitude: 10 },
  { T_celsius: 30, RH_percent: 80, light_klux: 5,  totalDays: 18262, RH_amplitude: 20 },
  { T_celsius: 5,  RH_percent: 20, light_klux: 0,  totalDays: 365,   RH_amplitude: 2 },
  { T_celsius: 40, RH_percent: 60, light_klux: 10, totalDays: 7300,  RH_amplitude: 30 },
];

const out = cases.map(c => ({
  input: c,
  assess: D.assess({
    T_celsius: c.T_celsius, RH_percent: c.RH_percent,
    light_klux: c.light_klux, totalDays: c.totalDays,
    prevMouldIndex: 0, RH_amplitude: c.RH_amplitude,
  }),
}));

fs.writeFileSync(
  path.join(__dirname, '..', 'reference_values.json'),
  JSON.stringify(out, null, 2)
);
console.log(`Wrote ${out.length} reference cases.`);
```

- [ ] **Step 3: Generate the fixture**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public/models/tests/_oracle
node generate_reference.js
```
Expected: `Wrote 5 reference cases.` and `models/tests/reference_values.json` exists.

- [ ] **Step 4: Commit the JSON only** (the JS copy is gitignored)

```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
git add models/tests/reference_values.json models/tests/_oracle/generate_reference.js
git commit -m "test(models): reference fixture generated from canonical DeteriorationService.js"
```

### Task 1.3: chemical.py (Model 1 — fading kinetics)

**Files:**
- Create: `models/mogao_models/chemical.py`
- Test: `models/tests/test_chemical.py`

- [ ] **Step 1: Write the failing test**

```python
import json, pathlib, math
import pytest
from mogao_models.chemical import rate_constant, chemical_fading

REF = json.loads((pathlib.Path(__file__).parent / "reference_values.json").read_text())

@pytest.mark.parametrize("case", REF)
def test_chemical_matches_js(case):
    i = case["input"]
    js = case["assess"]["chemical"]
    out = chemical_fading(i["T_celsius"], i["RH_percent"], i["light_klux"], i["totalDays"])
    assert math.isclose(out["rate_constant"], js["rateConstant"], rel_tol=1e-6, abs_tol=1e-12)
    assert math.isclose(out["scientific_degradation"], js["scientificDegradation"], rel_tol=1e-6, abs_tol=5e-3)
    assert out["label"] == js["label"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd c:/Users/willr/Git/mogao-digital-twin-public/models && pytest tests/test_chemical.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'mogao_models.chemical'`.

- [ ] **Step 3: Write `models/mogao_models/chemical.py`**

```python
"""Model 1 — chemical pigment fading.

Arrhenius rate constant with Paltakari-Karlsson humidity coupling and a
light-driven photolytic term, integrated as first-order decay. Faithful port
of calculateRateConstant() and chemicalFading() in DeteriorationService.js.
Rendering-only fields (visualEffect) are intentionally omitted.
"""
import math
from ._common import R, moisture_content

CHEMICAL_DEFAULTS = {
    "Ea_dark": 70000.0, "Ea_light": 25000.0,
    "k0_dark": 1e-4, "k0_light": 1e-3,
    "q": 0.8, "p": 0.9,
}


def rate_constant(T_celsius, RH_percent, light_klux, **params):
    cfg = {**CHEMICAL_DEFAULTS, **params}
    T_k = T_celsius + 273.15
    rh = RH_percent / 100.0
    h2o = moisture_content(rh, T_k)
    k_dark = cfg["k0_dark"] * abs(h2o) ** cfg["q"] * math.exp(-cfg["Ea_dark"] / (R * T_k))
    if light_klux > 0:
        k_light = (cfg["k0_light"] * light_klux ** cfg["p"]
                   * abs(h2o) ** cfg["q"] * math.exp(-cfg["Ea_light"] / (R * T_k)))
    else:
        k_light = 0.0
    return k_dark + k_light


def chemical_fading(T_celsius, RH_percent, light_klux, total_days, **params):
    k = rate_constant(T_celsius, RH_percent, light_klux, **params)
    degradation_factor = math.exp(-k * total_days)
    scientific_degradation = (1.0 - degradation_factor) * 100.0
    if scientific_degradation > 50:
        label = "critical"
    elif scientific_degradation > 20:
        label = "high"
    elif scientific_degradation > 5:
        label = "moderate"
    else:
        label = "low"
    return {
        "rate_constant": k,
        "degradation_factor": degradation_factor,
        "scientific_degradation": scientific_degradation,
        "risk": min(100.0, scientific_degradation),
        "label": label,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_chemical.py -q`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/chemical.py models/tests/test_chemical.py
git commit -m "feat(models): chemical fading kernel (parity with JS)"
```

### Task 1.4: lifetime.py (Model 2 — Michalski lifetime)

**Files:**
- Create: `models/mogao_models/lifetime.py`
- Test: `models/tests/test_lifetime.py`

- [ ] **Step 1: Write the failing test**

```python
import json, pathlib, math
import pytest
from mogao_models.lifetime import lifetime_multiplier

REF = json.loads((pathlib.Path(__file__).parent / "reference_values.json").read_text())

@pytest.mark.parametrize("case", REF)
def test_lifetime_matches_js(case):
    i = case["input"]
    js = case["assess"]["lifetime"]
    out = lifetime_multiplier(i["T_celsius"], i["RH_percent"], i["totalDays"])
    assert math.isclose(out["multiplier"], js["multiplier"], rel_tol=1e-6, abs_tol=1e-9)
    assert math.isclose(out["effective_years"], js["effectiveYears"], rel_tol=1e-6, abs_tol=1e-6)
```

- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_lifetime.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'mogao_models.lifetime'`.

- [ ] **Step 3: Write `models/mogao_models/lifetime.py`**

```python
"""Model 2 — Michalski lifetime multiplier (Climate for Culture eLM variant).

Port of lifetimeMultiplier() in DeteriorationService.js.
"""
import math
from ._common import R

LIFETIME_DEFAULTS = {"Ea": 70000.0, "n": 1.3, "T0": 20.0, "RH0": 50.0}
LIFETIME_REFERENCE_YEARS = 200


def lifetime_multiplier(T_celsius, RH_percent, total_days=0, **params):
    cfg = {**LIFETIME_DEFAULTS, **params}
    T_k = T_celsius + 273.15
    T0_k = cfg["T0"] + 273.15
    temp_factor = math.exp((cfg["Ea"] / R) * (1.0 / T_k - 1.0 / T0_k))
    rh_factor = (cfg["RH0"] / max(RH_percent, 1)) ** cfg["n"]
    multiplier = temp_factor * rh_factor
    label = "longer" if multiplier >= 1.0 else "shorter"
    actual_years = max(0.0, (total_days or 0) / 365.25)
    effective_years = actual_years / multiplier if multiplier > 0 else 0.0
    intensity = min(1.0, effective_years / LIFETIME_REFERENCE_YEARS)
    return {
        "multiplier": multiplier,
        "label": label,
        "effective_years": effective_years,
        "intensity": intensity,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_lifetime.py -q`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/lifetime.py models/tests/test_lifetime.py
git commit -m "feat(models): Michalski lifetime kernel (parity with JS)"
```

### Task 1.5: mould.py (Model 3 — VTT Hukka–Viitanen)

**Files:**
- Create: `models/mogao_models/mould.py`
- Test: `models/tests/test_mould.py`

- [ ] **Step 1: Write the failing test**

```python
import json, pathlib, math
import pytest
from mogao_models.mould import mould_critical_rh, mould_growth

REF = json.loads((pathlib.Path(__file__).parent / "reference_values.json").read_text())

@pytest.mark.parametrize("case", REF)
def test_mould_matches_js(case):
    i = case["input"]
    js = case["assess"]["mould"]
    out = mould_growth(i["T_celsius"], i["RH_percent"], i["totalDays"], 0)
    assert math.isclose(out["mould_index"], js["mouldIndex"], rel_tol=1e-6, abs_tol=1e-9)
    assert math.isclose(out["rh_critical"], js["rhCritical"], rel_tol=1e-6, abs_tol=5e-2)
    assert out["is_above_threshold"] == js["isAboveThreshold"]
    assert out["label"] == js["label"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_mould.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `models/mogao_models/mould.py`**

```python
"""Model 3 — VTT / Finnish mould growth model (Hukka & Viitanen 1999).

Port of mouldCriticalRH(), _stepMouldIndex() and mouldGrowth() in
DeteriorationService.js. mouldGrowth integrates from zero over total_days at a
constant (T, RH) when prev_mould_index == 0 (the "scrub" regime); otherwise it
returns the supplied index unchanged (the deployed app owns the live
accumulator).
"""
MOULD_DEFAULTS = {"growth_coeff": 0.13, "decline_rate": -0.128}


def mould_critical_rh(T_celsius):
    T = max(0.0, min(50.0, T_celsius))
    return -0.0026 * T ** 3 + 0.160 * T ** 2 - 3.13 * T + 100.0


def _step_mould_index(prev, growth_rate, days):
    return max(0.0, min(6.0, prev + growth_rate * days))


def mould_growth(T_celsius, RH_percent, total_days, prev_mould_index=0, **params):
    cfg = {**MOULD_DEFAULTS, **params}
    rh_critical = mould_critical_rh(T_celsius)
    above = RH_percent >= rh_critical
    if above and T_celsius > 0:
        rh_excess = (RH_percent - rh_critical) / 100.0
        temp_scale = T_celsius / 20.0
        growth_rate = rh_excess * temp_scale * cfg["growth_coeff"]
    else:
        growth_rate = cfg["decline_rate"]

    if prev_mould_index == 0 and total_days > 0 and above:
        mould_index = _step_mould_index(0.0, growth_rate, total_days)
    else:
        mould_index = prev_mould_index
    mould_index = max(0.0, min(6.0, mould_index))

    risk = (mould_index / 6.0) * 100.0
    if mould_index >= 4:
        label = "critical"
    elif mould_index >= 2:
        label = "high"
    elif mould_index >= 1:
        label = "moderate"
    else:
        label = "low"
    return {
        "mould_index": mould_index,
        "rh_critical": rh_critical,
        "is_above_threshold": above,
        "risk": risk,
        "label": label,
        "growth_rate": growth_rate,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_mould.py -q`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/mould.py models/tests/test_mould.py
git commit -m "feat(models): VTT mould kernel (parity with JS)"
```

### Task 1.6: salt.py (Model 4 — Steiger crystallisation pressure)

**Files:**
- Create: `models/mogao_models/salt.py`
- Test: `models/tests/test_salt.py`

- [ ] **Step 1: Write the failing test**

```python
import json, pathlib, math
import pytest
from mogao_models.salt import salt_deliquescence_rh, salt_crystallization

REF = json.loads((pathlib.Path(__file__).parent / "reference_values.json").read_text())

@pytest.mark.parametrize("case", REF)
def test_salt_matches_js(case):
    i = case["input"]
    js = case["assess"]["saltCryst"]
    out = salt_crystallization(i["T_celsius"], i["RH_percent"], i["totalDays"], i["RH_amplitude"])
    assert math.isclose(out["pressure_MPa"], js["pressure_MPa"], rel_tol=1e-5, abs_tol=5e-3)
    assert math.isclose(out["DRH"], js["DRH"], rel_tol=1e-6, abs_tol=5e-2)
    assert out["is_crystallizing"] == js["isCrystallizing"]
    assert out["label"] == js["label"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_salt.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `models/mogao_models/salt.py`**

```python
"""Model 4 — salt crystallisation pressure (Scherer 1999 / Steiger 2005).

Port of saltDeliquescenceRH() and saltCrystallization() in
DeteriorationService.js. Pressure is evaluated at the RH cycle trough
(RH - amplitude/2), where supersaturation peaks.
"""
import math
from ._common import R

SALT_DEFAULTS = {
    "Vm": 5.33e-5, "DRH_ref": 84.2, "DRH_slope": -0.17,
    "T_ref": 25.0, "tensile_strength": 3.0, "cycles_per_year": 120.0,
}


def salt_deliquescence_rh(T_celsius, **params):
    cfg = {**SALT_DEFAULTS, **params}
    return max(0.0, min(100.0, cfg["DRH_ref"] + cfg["DRH_slope"] * (T_celsius - cfg["T_ref"])))


def salt_crystallization(T_celsius, RH_percent, total_days, RH_amplitude=0, **params):
    cfg = {**SALT_DEFAULTS, **params}
    T_k = T_celsius + 273.15
    drh = salt_deliquescence_rh(T_celsius, **params)
    rh_trough = max(0.01, RH_percent - (RH_amplitude or 0) / 2.0)
    is_cryst = rh_trough < drh

    pressure_mpa = 0.0
    if is_cryst and rh_trough > 0:
        s = (drh / 100.0) / (rh_trough / 100.0)
        pressure_mpa = ((R * T_k) / cfg["Vm"]) * math.log(s) / 1e6

    damage_ratio = pressure_mpa / cfg["tensile_strength"]
    total_years = total_days / 365.25
    total_cycles = total_years * cfg["cycles_per_year"]
    cumulative_damage = min(100.0, damage_ratio * total_cycles * 0.5)

    if damage_ratio >= 3.0:
        label = "critical"
    elif damage_ratio >= 1.5:
        label = "high"
    elif damage_ratio >= 0.5:
        label = "moderate"
    elif not is_cryst:
        label = "safe"
    else:
        label = "low"

    return {
        "pressure_MPa": pressure_mpa,
        "DRH": drh,
        "RH_trough": rh_trough,
        "is_crystallizing": is_cryst,
        "damage_ratio": damage_ratio,
        "cumulative_damage": cumulative_damage,
        "risk": min(100.0, damage_ratio * 25.0),
        "label": label,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_salt.py -q`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/salt.py models/tests/test_salt.py
git commit -m "feat(models): salt crystallisation kernel (parity with JS)"
```

### Task 1.7: fatigue.py (Model 5 — hygro-mechanical fatigue)

**Files:**
- Create: `models/mogao_models/fatigue.py`
- Test: `models/tests/test_fatigue.py`

- [ ] **Step 1: Write the failing test**

```python
import json, pathlib, math
import pytest
from mogao_models.fatigue import fatigue_damage

REF = json.loads((pathlib.Path(__file__).parent / "reference_values.json").read_text())

@pytest.mark.parametrize("case", REF)
def test_fatigue_matches_js(case):
    i = case["input"]
    js = case["assess"]["fatigue"]
    out = fatigue_damage(i["RH_amplitude"], i["totalDays"])
    assert math.isclose(out["stress_MPa"], js["stress_MPa"], rel_tol=1e-5, abs_tol=1e-4)
    assert math.isclose(out["cumulative_damage"], js["cumulativeDamage"], rel_tol=1e-5, abs_tol=1e-4)
    assert out["label"] == js["label"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_fatigue.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `models/mogao_models/fatigue.py`**

```python
"""Model 5 — hygro-mechanical fatigue (HERIe / Bratasz methodology).

Cyclic RH drives differential strain between paint and substrate; cumulative
damage via Miner's rule with Basquin's fatigue-life equation. Port of
fatigueDamage() in DeteriorationService.js.
"""
FATIGUE_DEFAULTS = {
    "beta_diff": 5e-5, "E": 2000.0, "sigma_fail": 10.0,
    "basquin_b": 6, "cycles_per_year": 365.0,
}


def fatigue_damage(RH_amplitude, total_days, **params):
    cfg = {**FATIGUE_DEFAULTS, **params}
    amplitude = max(0.0, min(100.0, RH_amplitude))
    total_years = total_days / 365.25

    cumulative_damage = 0.0
    stress_mpa = 0.0
    cycles_to_failure = float("inf")

    if amplitude > 0.1 and total_years > 0:
        strain = cfg["beta_diff"] * amplitude
        stress_mpa = cfg["E"] * strain
        cycles_to_failure = min(1e12, (cfg["sigma_fail"] / max(stress_mpa, 1e-6)) ** cfg["basquin_b"])
        damage_per_cycle = 1.0 / cycles_to_failure
        cumulative_damage = damage_per_cycle * cfg["cycles_per_year"] * total_years

    if cumulative_damage >= 3.0:
        label = "critical"
    elif cumulative_damage >= 1.0:
        label = "high"
    elif cumulative_damage >= 0.3:
        label = "moderate"
    else:
        label = "low"

    crack_density = min(1.0, cumulative_damage / 3.0)
    return {
        "stress_MPa": stress_mpa,
        "cycles_to_failure": None if cycles_to_failure == float("inf") else cycles_to_failure,
        "cycles_applied": cfg["cycles_per_year"] * total_years,
        "cumulative_damage": cumulative_damage,
        "crack_density": crack_density,
        "risk": min(100.0, cumulative_damage * 33.0),
        "label": label,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_fatigue.py -q`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/fatigue.py models/tests/test_fatigue.py
git commit -m "feat(models): hygro-mechanical fatigue kernel (parity with JS)"
```

### Task 1.8: composite.py (paper Eq. — five-mechanism aggregation)

**Files:**
- Create: `models/mogao_models/composite.py`
- Test: `models/tests/test_composite.py`

- [ ] **Step 1: Write the failing test** (no JS oracle — expected values derived by hand)

```python
import math
from mogao_models.composite import composite_risk, COMPOSITE_WEIGHTS

def test_weights_sum_to_one():
    assert math.isclose(sum(COMPOSITE_WEIGHTS.values()), 1.0, abs_tol=1e-9)

def test_all_ones_equals_weight_sum():
    idx = {k: 1.0 for k in COMPOSITE_WEIGHTS}
    assert math.isclose(composite_risk(idx), 1.0, abs_tol=1e-9)

def test_known_combination():
    idx = {"chemical": 0.4, "lifetime": 0.0, "mould": 0.0, "salt": 0.8, "fatigue": 0.5}
    # 0.25*0.4 + 0.15*0 + 0.15*0 + 0.25*0.8 + 0.20*0.5 = 0.1 + 0.2 + 0.1 = 0.40
    assert math.isclose(composite_risk(idx), 0.40, abs_tol=1e-9)
```

- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_composite.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `models/mogao_models/composite.py`**

```python
"""Composite deterioration index (paper Eq. composite).

Weighted sum of the five normalised mechanism sub-indices, each in [0, 1].
Weights match the committed experiments/_make_figure_scenarios.py. This is the
paper's R_composite; it is NOT the operational MaintenanceService score.
"""
COMPOSITE_WEIGHTS = {
    "chemical": 0.25,
    "lifetime": 0.15,
    "mould": 0.15,
    "salt": 0.25,
    "fatigue": 0.20,
}


def composite_risk(sub_indices, weights=None):
    """Aggregate five normalised sub-indices into R_composite in [0, 1].

    sub_indices: mapping with keys chemical, lifetime, mould, salt, fatigue,
                 each a float in [0, 1].
    """
    w = weights or COMPOSITE_WEIGHTS
    return sum(w[k] * sub_indices[k] for k in w)


def to_sub_indices(chemical, lifetime, mould, salt, fatigue):
    """Convenience: normalise raw kernel outputs to [0, 1] sub-indices.

    Mirrors the normalisation used in the scenarios figure: chemical by
    scientific_degradation/100, lifetime by its intensity, mould by index/6,
    salt by cumulative_damage/100, fatigue by min(1, cumulative_damage/3).
    """
    return {
        "chemical": min(1.0, chemical["scientific_degradation"] / 100.0),
        "lifetime": lifetime["intensity"],
        "mould": mould["mould_index"] / 6.0,
        "salt": min(1.0, salt["cumulative_damage"] / 100.0),
        "fatigue": min(1.0, fatigue["cumulative_damage"] / 3.0),
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pytest tests/test_composite.py -q`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/composite.py models/tests/test_composite.py
git commit -m "feat(models): five-mechanism composite-risk aggregation (paper Eq.)"
```

### Task 1.9: Public API exports + models/README

**Files:**
- Modify: `models/mogao_models/__init__.py`
- Create: `models/README.md`

- [ ] **Step 1: Update `models/mogao_models/__init__.py` to re-export the public functions**

```python
"""Mogao digital-twin deterioration models (Python port of DeteriorationService.js)."""
from ._common import R, moisture_content
from .chemical import chemical_fading, rate_constant, CHEMICAL_DEFAULTS
from .lifetime import lifetime_multiplier, LIFETIME_DEFAULTS
from .mould import mould_growth, mould_critical_rh, MOULD_DEFAULTS
from .salt import salt_crystallization, salt_deliquescence_rh, SALT_DEFAULTS
from .fatigue import fatigue_damage, FATIGUE_DEFAULTS
from .composite import composite_risk, to_sub_indices, COMPOSITE_WEIGHTS

__all__ = [
    "R", "moisture_content",
    "chemical_fading", "rate_constant", "CHEMICAL_DEFAULTS",
    "lifetime_multiplier", "LIFETIME_DEFAULTS",
    "mould_growth", "mould_critical_rh", "MOULD_DEFAULTS",
    "salt_crystallization", "salt_deliquescence_rh", "SALT_DEFAULTS",
    "fatigue_damage", "FATIGUE_DEFAULTS",
    "composite_risk", "to_sub_indices", "COMPOSITE_WEIGHTS",
]
```

- [ ] **Step 2: Add a smoke test `models/tests/test_api.py`**

```python
import mogao_models as m

def test_public_api_imports_and_runs():
    chem = m.chemical_fading(13, 35, 2, 73000)
    life = m.lifetime_multiplier(13, 35, 73000)
    mould = m.mould_growth(25, 90, 3650, 0)
    salt = m.salt_crystallization(30, 80, 18262, 20)
    fat = m.fatigue_damage(20, 18262)
    sub = m.to_sub_indices(chem, life, mould, salt, fat)
    r = m.composite_risk(sub)
    assert 0.0 <= r <= 1.0
    assert set(sub) == set(m.COMPOSITE_WEIGHTS)
```

- [ ] **Step 3: Run the whole models test suite**

Run: `cd c:/Users/willr/Git/mogao-digital-twin-public/models && pytest -q`
Expected: all tests PASS.

- [ ] **Step 4: Write `models/README.md`**

````markdown
# `models/` — deterioration kernels

A faithful Python port of the deterioration models that run in the Mogao
digital twin (`DeteriorationService.js`), plus the paper's five-mechanism
composite index. Verified numerically against the JavaScript original (see
`tests/`). Rendering-only outputs are omitted; these functions return the
scientific quantities.

## Install

```bash
pip install -e ".[test]"
pytest -q       # optional: verify parity with the canonical kernels
```

## Models → paper map

| Module | Paper model | Key reference |
| --- | --- | --- |
| `chemical.py` | Chemical fading (Arrhenius + Paltakari–Karlsson) | Strlič 2015 |
| `lifetime.py` | Michalski lifetime multiplier | Michalski 2002; Leissner 2015 |
| `mould.py` | VTT mould index | Hukka & Viitanen 1999 |
| `salt.py` | Salt crystallisation pressure | Scherer 1999; Steiger 2005 |
| `fatigue.py` | Hygro-mechanical fatigue | Bratasz / HERIe |
| `composite.py` | Composite risk R_composite | this paper |

## Usage

```python
import mogao_models as m

# Monitored Cave 1 baseline: 13 °C, 35 % RH, 2 klux, 200 years (≈73000 d)
chem  = m.chemical_fading(13, 35, light_klux=2, total_days=73000)
life  = m.lifetime_multiplier(13, 35, total_days=73000)
mould = m.mould_growth(25, 90, total_days=3650, prev_mould_index=0)  # HVAC-failure
salt  = m.salt_crystallization(30, 80, total_days=18262, RH_amplitude=20)
fat   = m.fatigue_damage(RH_amplitude=20, total_days=18262)

sub = m.to_sub_indices(chem, life, mould, salt, fat)
print("R_composite =", m.composite_risk(sub))
```

## Not included

Measured pilot colorimetry, figures, the synthetic climate driver, the pigment
segmenter (Model in `../viewer/`), and the operational backend. Available from
the authors on request.
````

- [ ] **Step 5: Commit**

```bash
git add models/mogao_models/__init__.py models/tests/test_api.py models/README.md
git commit -m "feat(models): public API exports, smoke test, and README"
```

---

## Phase 2 — `mde/` (MDE design-time)

### Task 2.1: Copy the Maven project, drop sample images

**Files:**
- Create: `mde/` (copied from `../mogao-digital-twin/backend/src` and `backend/pom.xml`)

- [ ] **Step 1: Copy `src/` and `pom.xml`**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
mkdir mde
cp -r ../mogao-digital-twin/backend/src mde/src
cp ../mogao-digital-twin/backend/pom.xml mde/pom.xml
```

- [ ] **Step 2: Remove bundled sample texture images (images are out of scope)**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
rm -rf mde/src/main/resources/exhibit_models
```
Expected: directory gone; the metamodel, templates, eol-scripts, and model instances remain.

- [ ] **Step 3: Verify nothing references the removed images at build time**

Run: `grep -rn "exhibit_models" mde/src || echo "no references"`
Expected: `no references` (the textures were sample data for runtime, not codegen inputs). If references exist, note them for the README and leave the codegen paths intact.

- [ ] **Step 4: Commit**

```bash
git add mde/
git commit -m "feat(mde): import Ecore metamodel + EGL/EOL codegen (Maven), drop sample images"
```

### Task 2.2: Verify the Maven build resolves

- [ ] **Step 1: Build**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public/mde
mvn -q compile
```
Expected: BUILD SUCCESS (or, if Epsilon artifacts require network, a clear dependency-resolution message — record it for the README prerequisites).

- [ ] **Step 2: If the build needs a settings note, capture it** (no commit if build is clean)

### Task 2.3: Write mde/README

**Files:**
- Create: `mde/README.md` (basis: the existing `src/main/resources/transformation/RUN_TRANSFORMATIONS.md`)

- [ ] **Step 1: Read the existing transformation docs**

Run: `cat mde/src/main/resources/transformation/RUN_TRANSFORMATIONS.md`

- [ ] **Step 2: Write `mde/README.md`**

```markdown
# `mde/` — model-driven engineering framework

The design-time half of the digital twin: an Ecore metamodel of the heritage
domain plus Epsilon (EGL/EOL) transformations that generate the runtime data
layer (Mongoose models, controllers, routers, services) and domain operations.
This is the generic-MDE contribution of the paper.

## Layout

- `src/main/resources/metamodel/mogao_dt.ecore` — the domain metamodel
- `src/main/resources/templates/` — EGL code-generation templates
- `src/main/resources/eol-scripts/` — EOL domain operations
- `src/main/resources/models/instances/` — example model instances
- `src/main/java/.../codegen/CodeGenerator.java` — the generator driver

## Build & run

```bash
mvn compile
# Transformation workflow: see the steps below (from RUN_TRANSFORMATIONS.md)
```

<!-- Summarise the RUN_TRANSFORMATIONS.md steps here in prose. -->

## Not included

The generated runtime is published separately as the operational backend (not
in this public release). Sample texture images were removed.
```

- [ ] **Step 3: Commit**

```bash
git add mde/README.md
git commit -m "docs(mde): README describing the metamodel + transformation workflow"
```

---

## Phase 3 — `viewer/` (standalone 3D-twin demo)

### Task 3.1: Copy the viewer source subset

**Files:**
- Create: `viewer/components/ModelViewer.js`, `viewer/services/DeteriorationRenderer.js`, `viewer/services/SimulationEngine.js`, `viewer/pigment/PigmentIdentifier.js`, `viewer/pigment/PigmentDatabase.js`, `viewer/pigment/PigmentAnalysis.js`, `viewer/styles/`, `viewer/css/`, `viewer/lib/DeteriorationService.js`

- [ ] **Step 1: Copy the files**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
mkdir -p viewer/components viewer/services viewer/pigment viewer/styles viewer/css viewer/lib
cp ../mogao-digital-twin/frontend/components/ModelViewer.js viewer/components/
cp ../mogao-digital-twin/frontend/services/DeteriorationRenderer.js viewer/services/
cp ../mogao-digital-twin/frontend/services/SimulationEngine.js viewer/services/
cp ../mogao-digital-twin/frontend/pigment/*.js viewer/pigment/
cp ../mogao-digital-twin/frontend/styles/model-viewer.css viewer/styles/ 2>/dev/null || true
cp ../mogao-digital-twin/frontend/styles/simulation-panel.css viewer/styles/ 2>/dev/null || true
cp ../mogao-digital-twin/frontend/css/simulation.css viewer/css/ 2>/dev/null || true
cp ../mogao-digital-twin/backend/runtime/services/domain/DeteriorationService.js viewer/lib/DeteriorationService.js
```

- [ ] **Step 2: Convert `viewer/lib/DeteriorationService.js` to an ES module export**

At the end of the file, replace the CommonMS `module.exports = { ... }` block with an ES export so the browser can import it. Add:
```javascript
// Browser ES-module export (the deployed app uses CommonJS require()).
export { assess, chemicalFading, lifetimeMultiplier, mouldGrowth,
         saltCrystallization, fatigueDamage,
         CHEMICAL_DEFAULTS, LIFETIME_DEFAULTS, MOULD_DEFAULTS,
         SALT_DEFAULTS, FATIGUE_DEFAULTS };
```
Keep the `module.exports` line guarded so it doesn't crash in the browser:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { /* ...existing exports... */ };
}
```

- [ ] **Step 3: Commit**

```bash
git add viewer/
git commit -m "feat(viewer): import 3D viewer, renderer, sim engine, segmenter + kernels"
```

### Task 3.2: Local API shim + demo.html (offline)

**Files:**
- Create: `viewer/lib/localApi.js`
- Create: `viewer/demo.html` (basis: `../mogao-digital-twin/frontend/model-viewer-demo.html`)

- [ ] **Step 1: Inspect the two backend calls in `SimulationEngine.js`**

Run: `grep -n "window.api.deterioration" viewer/services/SimulationEngine.js`
Expected: two hits — `.assess({...})` (~line 170) and `.defaults()` (~line 200).

- [ ] **Step 2: Write `viewer/lib/localApi.js`** — implements those two calls locally

```javascript
// Offline shim for window.api.deterioration. The deployed app calls a Node
// endpoint that wraps DeteriorationService.js; here we call the kernels
// directly in-browser so the demo needs no backend.
import { assess, CHEMICAL_DEFAULTS, LIFETIME_DEFAULTS, MOULD_DEFAULTS,
         SALT_DEFAULTS, FATIGUE_DEFAULTS } from './DeteriorationService.js';

window.api = window.api || {};
window.api.deterioration = {
  async assess(params) { return assess(params); },
  async defaults() {
    return {
      chemical: CHEMICAL_DEFAULTS, lifetime: LIFETIME_DEFAULTS,
      mould: MOULD_DEFAULTS, salt: SALT_DEFAULTS, fatigue: FATIGUE_DEFAULTS,
    };
  },
};
```

- [ ] **Step 3: Confirm `SimulationEngine.js` consumes `assess`/`defaults` return values directly** (not an axios `{data}` wrapper)

Run: `grep -n "response" viewer/services/SimulationEngine.js | head`
If the code reads `response.data`, change the shim to return `{ data: ... }`; if it reads the object directly, keep as above. Adjust the shim to match what the call sites expect, then re-grep to confirm both sites are satisfied.

- [ ] **Step 4: Write `viewer/demo.html`** (adapted from `model-viewer-demo.html`; loads the shim first, points at the bundled asset from Task 3.3)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mogao Digital Twin — 3D viewer demo</title>
  <link rel="stylesheet" href="styles/model-viewer.css">
  <script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                 "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/" } }
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import './lib/localApi.js';                 // installs window.api.deterioration
    import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
    import ModelViewer from './components/ModelViewer.js';
    createApp({
      components: { ModelViewer },
      data() {
        return {
          assetReference: {
            modelLocation: './assets/demo/model.obj',
            textureLocation: './assets/demo/texture.jpg',
          },
        };
      },
      template: `<model-viewer :asset-reference="assetReference" />`,
    }).mount('#app');
  </script>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add viewer/lib/localApi.js viewer/demo.html
git commit -m "feat(viewer): offline API shim + standalone demo.html"
```

### Task 3.3: Bundle a licence-clean demo asset

**Files:**
- Create: `viewer/assets/demo/model.obj`, `viewer/assets/demo/texture.jpg`, `viewer/assets/demo/SOURCE.md`

- [ ] **Step 1: Choose a licence-clean asset.** Confirm the provenance/licence of the bodhisattva model referenced by the original demo (likely a Met Museum Open Access object, CC0). If confirmed CC0/clean, use it; otherwise pick any CC0 low-poly model + texture.

- [ ] **Step 2: Place the files** as `viewer/assets/demo/model.obj` and `texture.jpg` (downscale to a low-poly/≤2k texture so the repo stays light).

- [ ] **Step 3: Write `viewer/assets/demo/SOURCE.md`** recording the asset's title, source URL, author, and licence (e.g. "Met Museum Open Access, CC0").

- [ ] **Step 4: Commit**

```bash
git add viewer/assets/demo/
git commit -m "feat(viewer): bundle licence-clean demo model + texture"
```

### Task 3.4: Verify the demo renders offline + viewer/README

**Files:**
- Create: `viewer/README.md`

- [ ] **Step 1: Serve and open the demo with no backend running**

Run:
```bash
cd c:/Users/willr/Git/mogao-digital-twin-public/viewer
python -m http.server 8077
```
Open `http://localhost:8077/demo.html` in a browser.
Expected: the model loads and renders; orbit/zoom work; no console errors about `window.api` being undefined; the deterioration sliders update the model (the shim answers `assess`/`defaults` locally). If a console error appears, fix the shim/return-shape (Task 3.2 Step 3) before proceeding.

- [ ] **Step 2: Write `viewer/README.md`**

```markdown
# `viewer/` — 3D physical-twin demo

A standalone, backend-free demo of the digital twin's 3D viewer: the Three.js
`ModelViewer`, the `DeteriorationRenderer` that applies per-mechanism visual
effects, the `SimulationEngine`, and the HSV-threshold pigment segmenter
(`pigment/PigmentIdentifier.js`, the paper's Model 1). The deterioration math is
the canonical `lib/DeteriorationService.js`, called in-browser via
`lib/localApi.js` (no server needed).

## Run

```bash
python -m http.server 8077
# open http://localhost:8077/demo.html
```

A licence-clean demo model + texture ship under `assets/demo/` (see its
SOURCE.md). Point `assetReference` in `demo.html` at your own `.obj`+texture to
view a different object.

## Not included

The full Vue application (login, dashboards, sensor API client) and the
operational Node/MongoDB backend are not part of this public release.
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/willr/Git/mogao-digital-twin-public
git add viewer/README.md
git commit -m "docs(viewer): README + verified offline demo"
```

---

## Phase 4 — Top-level README and publication

### Task 4.1: Final top-level README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the full root `README.md`**

````markdown
# Mogao Digital Twin — public code companion

Code accompanying *"A Model-Based Digital Twin for Predicting Deterioration of
Mogao Polychrome Sculpture"* (npj Heritage Science, 2026).

This repository exposes the code behind the paper's four contributions. The
operational Node/MongoDB runtime, measured pilot data, and heritage images are
not included (available from the authors on request).

| Paper contribution | Folder | Language |
| --- | --- | --- |
| Arrhenius + Paltakari–Karlsson fading kinetics | [`models/`](models/) | Python |
| Multi-mechanism composite risk | [`models/`](models/) | Python |
| Generic MDE / metamodel framework | [`mde/`](mde/) | Java + Epsilon |
| 3D physical twin (+ pigment segmenter, Model 1) | [`viewer/`](viewer/) | JavaScript |

## Quick start

- **Models:** `cd models && pip install -e ".[test]" && pytest -q`
- **MDE:** `cd mde && mvn compile`
- **Viewer:** `cd viewer && python -m http.server 8077` → open `demo.html`

Each folder has its own README.

## Citation

See [`CITATION.cff`](CITATION.cff). Licensed under [MIT](LICENSE).

## Not included

Operational runtime (telemetry, auth, sensor REST API), measured pilot
colorimetry, heritage images, and the data-/image-dependent figures.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: complete top-level README mapping components to contributions"
```

### Task 4.2: Publication handoff (manual — do NOT run without user confirmation)

- [ ] **Step 1: Confirm the repo name with the user** (`mogao-digital-twin-public` vs alternative).
- [ ] **Step 2: Create the GitHub remote** (user runs, or confirms): `gh repo create <name> --public --source . --remote origin`
- [ ] **Step 3: Push:** `git push -u origin main`
- [ ] **Step 4: Add the repo URL to the paper's Code Availability section and update `CITATION.cff` `repository-code`/DOI.**

---

## Self-Review

**Spec coverage:**
- Reproducibility package, no server/DB → only `models/` Python, `mde/` design-time, `viewer/` demo; operational runtime excluded. ✅
- One repo, three folders → Phase 0–4 build a single repo with `models/`, `mde/`, `viewer/`. ✅
- Canonical kernels (post-brainstorm decision, supersedes spec's figure-script provenance) → Phase 1 ports `DeteriorationService.js`, verified via reference fixture. ✅ (Spec text still says figure-script source; the canonical-kernels decision was taken after spec sign-off and is recorded in this plan's header + Phase 1.)
- MDE component → Phase 2. ✅
- 3D twin + segmenter → Phase 3; segmenter ships as JS in `viewer/`, no Python port. ✅
- No measured data / no heritage images → Task 2.2 drops sample textures; only a licence-clean generic demo asset is bundled (Task 3.3), per the "ship one demo asset" decision. ✅
- MIT + CITATION.cff → Task 0.1. ✅
- Demo-asset licence risk → Task 3.3 Step 1. ✅
- SimulationEngine coupling risk → Task 3.2 resolves via local shim. ✅

**Placeholder scan:** `mde/README.md` contains an HTML comment to summarise `RUN_TRANSFORMATIONS.md` in prose — Task 2.3 Step 1 reads that file first so the prose is concrete; acceptable as a fill-from-source instruction, not a content placeholder. No other TBD/TODO content steps.

**Type consistency:** Python field names (`scientific_degradation`, `mould_index`, `cumulative_damage`, `effective_years`, `intensity`) are defined in Tasks 1.3–1.8 and consumed consistently by `to_sub_indices` (1.8) and `test_api.py` (1.9). JS oracle field names (`rateConstant`, `mouldIndex`, `saltCryst`, `RH_amplitude`) match `DeteriorationService.js`. Shim exports in Task 3.1 Step 2 match imports in Task 3.2 Step 2.

**Note on spec divergence:** the approved spec names the figure scripts as the `models/` source of truth; the later user decision (canonical deployed kernels) supersedes it. Recommend updating the spec's provenance section to match before or during execution.
