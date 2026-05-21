# Mogao Digital Twin — System Architecture and Deterioration Models

*Technical reference document for the research manuscript*

---

## 1. System Overview

The Mogao Digital Twin is a model-driven engineering (MDE) system for heritage conservation at the Mogao Caves (敦煌莫高窟), a UNESCO World Heritage Site in Gansu, China. The system integrates three pillars:

1. **Model-driven code generation** — A single Ecore metamodel drives automatic generation of backend services, frontend components, and data transfer objects via Epsilon EGL templates
2. **3D visualisation** — Interactive Three.js-based rendering of heritage artefacts (statues, murals, paintings, inscriptions) with real-time deterioration effects applied to textures via Web Worker
3. **Scientific deterioration simulation** — Four peer-reviewed conservation science models computed server-side via REST API, with configurable parameters and reactive UI

### Technology Stack

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| **Design-time** | | | |
| Metamodelling | Eclipse EMF (Ecore) | 2.23.0 | Domain metamodel |
| Code generation | Epsilon (EGL, EOL, ETL, EVL) | 2.8.0 | Template-based generation |
| Build tool | Maven (Java 17) | 3.x | Builds and runs the code generator |
| Model format | Flexmi | (Epsilon bundle) | Concise model instances |
| **Runtime** | | | |
| Backend framework | Express.js (Node.js) | — | REST API server |
| Database | MongoDB | 5.0 | Document persistence |
| ODM | Mongoose | — | Schema + query layer |
| Authentication | JWT (jsonwebtoken) | — | Token-based auth |
| Frontend framework | Vue.js | 3.x (CDN) | SPA framework |
| 3D rendering | Three.js | 0.147.0 | OBJ/MTL model viewer |
| HTTP client | Axios | 1.6.2 | API communication |
| Charting | Chart.js | 4.4.1 | Time-series visualisation |
| Internationalisation | Custom Vue 3 composable | — | zh + en |
| Build step | None (vanilla ES modules) | — | — |

---

## 2. Model-Driven Architecture

### 2.1 Metamodel

The domain is captured in a single Ecore metamodel (`mogao_dt.ecore`) with the following class hierarchy:

```
DTElement (abstract)
├── UtilityElement (abstract)
│   ├── Coordinates {x, y, z, roll, pitch, yaw}
│   ├── Parameter {expression, value, unit: Unit}
│   └── AssetReference {modelLocation, metadataLocation, textureLocation}
└── ModelElement (abstract) {name, description}
    ├── Package (abstract) {objects: Object[*]}
    │   └── DTPackage {importPackages: Package[*]}
    └── Object (abstract) {reference: AssetReference, coordinates: Coordinates}
        ├── HeritageArtifact (abstract)
        │   │   {label, creationPeriod, lastInspectionDate, inspectionNotes,
        │   │    environmentConditions: EnvironmentCondition[*], defects: Defect[*]}
        │   ├── Cave {exhibits: Exhibit[*]}
        │   └── Exhibit (abstract) {material, period, conservationStatus: ConservationStatus}
        │       ├── Statue {width, depth, height, subject}
        │       ├── Mural {width, height, technique}
        │       ├── Painting {width, height, style}
        │       └── Inscription {language, content}
        ├── Defect {defectType: DefectType, severity: DefectSeverity, detectionDate,
        │           affectedArea, treatmentHistory, requiresImmediateAction}
        └── EnvironmentCondition (abstract) {timestamp}
            ├── Temperature {reading: Parameter}
            ├── Humidity {reading: Parameter}
            └── LightIntensity {reading: Parameter}
```

**Enumerations:**

| Enum | Values |
|------|--------|
| `Unit` | null, mm, K, RH, lux |
| `ConservationStatus` | excellent, good, fair, poor, critical |
| `DefectSeverity` | minor, moderate, severe, critical |
| `DefectType` | cracking, flaking, blistering, detachment, materialLoss, disruption, alveolization, saltEfflorescence, colorAlteration, acidAttack, paintLoss, microbialGrowth, blackSpots, lichenGrowth, insectDamage, waterSeepage, sootDeposition, erosion, structuralCollapse, graffiti |

### 2.2 Model Instance

A Flexmi model instance (`mogao.model`) populates the metamodel with cave, exhibit, and environmental data for the Mogao Caves site. Flexmi provides a concise YAML/XML-like syntax for EMF model instances without requiring full XMI verbosity.

### 2.3 Code Generation via Epsilon EGL

The code generator emits the Mongoose data layer (and only the Mongoose data layer) into `backend/runtime/`. The Vue 3 frontend is hand-written by design — its 3D viewer, deterioration simulation, prediction panel, maintenance queue, sensor dashboard, and application shell are too purpose-built to be a deterministic function of the metamodel.

Templates live under `backend/src/main/resources/transformation/`:

| Template | Generates |
|----------|-----------|
| `mongodb/GenerateMongooseModel.egl` | Mongoose schema (one per EClass, concrete + abstract) |
| `mongodb/GenerateMongooseService.egl` | Service: CRUD + GID-based queries (concrete EClasses only) |
| `mongodb/GenerateMongooseController.egl` | Controller: HTTP request/response handling |
| `mongodb/GenerateMongooseRouter.egl` | Express router: CRUD + `/gid/:gid` endpoints |
| `eol/GenerateEOLOperations.egl` | EOL operations scaffolding (currently dormant) |

`CodeGenerator.entityClasses` controls which 13 concrete EClasses get a Service/Controller/Router triple; all EClasses (including abstract) get a Mongoose schema. The `writeToFile` method refuses to write outside `backend/runtime/`, so the codegen physically cannot touch `frontend/`.

Adding a new heritage artefact type (e.g., a `Textile` class) to the Ecore metamodel auto-generates its Mongoose schema, service, controller, and router — but its UI must be written by hand under `frontend/components/`.

### 2.4 Hand-Written vs Generated Code

| Component | Generated | Hand-written |
|-----------|:---------:|:------------:|
| Backend Mongoose schemas (per EClass) | ✓ | |
| Backend per-entity CRUD: services, controllers, routers (top-level) | ✓ | |
| Backend domain services / controllers / routers (under `domain/`) | | ✓ |
| Backend auth middleware, JWT utilities | | ✓ |
| Backend deterioration / anomaly / maintenance / telemetry / replay / validation | | ✓ |
| Backend `app.js`, `server.js`, `package.json`, the three `index.js` aggregators | | ✓ |
| Frontend entity Card / List / Detail / Form components | | ✓ |
| Frontend application shell (`app.js`, sidebar, topbar, dashboard) | | ✓ |
| Frontend `useEntity` composable | | ✓ |
| Frontend i18n (`i18n.js`) | | ✓ |
| `ModelViewer.js` (Three.js 3D viewer) | | ✓ |
| `SimulationPanel.js`, `SimulationEngine.js` (deterioration UI + state) | | ✓ |
| `PigmentAnalysisPanel.js`, `PigmentAnalysis.js`, `PigmentDatabase.js`, `PigmentIdentifier.js` | | ✓ |
| `SettingsView.js` + section components (Profile / Appearance / UserMgmt / DatabaseStats) | | ✓ |
| `LiveDataPanel.js`, `PredictionPanel.js`, `MaintenanceQueue.js`, `SensorDashboard.js` | | ✓ |
| `config.js`, `api.js`, `utils/` (a11y, keyboard, router) | | ✓ |
| Web Workers (`deterioration-worker.js`, `pigment-deterioration-worker.js`) | | ✓ |
| CSS styles | | ✓ |

---

## 3. System Architecture

### 3.1 Design-Time vs Runtime

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESIGN TIME                              │
│  ┌──────────────┐    EGL Templates    ┌──────────────────────┐  │
│  │   Java +     │ ─────────────────→ │  Generated Code      │  │
│  │   Maven +    │                    │  • Node.js backend   │  │
│  │   Epsilon    │                    └──────────────────────┘  │
│  │  mogao_dt    │                                              │
│  │  .ecore      │                                              │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME                                  │
│                                                                 │
│  ┌──────────────────────────────────┐                           │
│  │  Frontend (Vue 3 SPA) :8009      │                           │
│  │  ┌────────┐ ┌─────────────────┐  │                           │
│  │  │ app.js │ │ Components (28) │  │                           │
│  │  └────────┘ └─────────────────┘  │                           │
│  │  ┌────────┐ ┌─────────────────┐  │                           │
│  │  │ api.js │ │ Web Worker      │  │                           │
│  │  └───┬────┘ │ (texture proc.) │  │                           │
│  │      │      └─────────────────┘  │                           │
│  └──────┼───────────────────────────┘                           │
│         │ HTTP REST (Axios)                                     │
│  ┌──────▼───────────────────────────┐     ┌──────────────────┐  │
│  │  Node.js/Express Backend :8008   │     │                  │  │
│  │  ┌──────────┐ ┌──────────────┐   ├────►│  MongoDB :27017  │  │
│  │  │ 15 Routes│ │ Auth (JWT)   │   │     │  mogao_dt        │  │
│  │  └──────────┘ └──────────────┘   │     │                  │  │
│  │  ┌──────────┐ ┌──────────────┐   │     │  14 collections  │  │
│  │  │17 Contrlr│ │ Deterioration│   │     └──────────────────┘  │
│  │  └──────────┘ │ Service      │   │                           │
│  │               └──────────────┘   │                           │
│  └──────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend (Node.js/Express + MongoDB)

The runtime backend is a Node.js/Express application with Mongoose ODM, serving as a REST API over MongoDB:

```
HTTP Request → Express Router → Controller → Service → Mongoose Model → MongoDB
```

**Key features:**
- **Persistence:** MongoDB document database (`mogao_dt`)
- **Authentication:** JWT-based with role system (admin, researcher, conservator, viewer, guest)
- **Guest access:** Read-only mode via `X-Guest-Access` header (checked only when no JWT present)
- **Rate limiting:** In-memory rate limiter on login (10 attempts per 15min per IP)
- **File uploads:** Multer with type filtering (.obj, .mtl, .jpg, .png, .glb, .gltf) and 100MB size limit
- **CORS:** Configurable origins via `CORS_ORIGINS` environment variable
- **Pagination:** All getAll endpoints support `?page=N&limit=N&sort=field` query params
- **GID generation:** Server auto-generates GID on create if not provided (`entity-timestamp-random`)
- **Deterioration API:** Scientific models computed server-side via `/deterioration/*` endpoints
- **Port:** 8008 (default)

**API routes (16 routers, 16 controllers):**

| Route | Methods | Description |
|-------|---------|-------------|
| `/users` | POST login/register, GET/PUT/DELETE profile | Authentication + user management |
| `/caves` | CRUD + `/gid/:gid` variants | Cave entities |
| `/statues` | CRUD + `/gid/:gid` variants | Statue exhibits |
| `/murals` | CRUD + `/gid/:gid` variants | Mural exhibits |
| `/paintings` | CRUD + `/gid/:gid` variants | Painting exhibits |
| `/inscriptions` | CRUD + `/gid/:gid` variants | Inscription exhibits |
| `/defects` | CRUD + `/gid/:gid` variants | Defect records |
| `/temperatures` | CRUD + `/gid/:gid` variants | Temperature readings |
| `/humidities` | CRUD + `/gid/:gid` variants | Humidity readings |
| `/lightIntensities` | CRUD + `/gid/:gid` variants | Light intensity readings |
| `/coordinates` | CRUD + `/gid/:gid` variants | Spatial coordinates |
| `/parameters` | CRUD + `/gid/:gid` variants | Measurement parameters |
| `/assetReferences` | CRUD + `/gid/:gid` variants | 3D model/texture references |
| `/dTPackages` | CRUD + `/gid/:gid` variants | Digital twin packages |
| `/exhibits` | CRUD + `/gid/:gid` variants | Exhibit entities (polymorphic) |
| `/deterioration` | POST assess/chemical/lifetime/mould/salt, GET defaults | Deterioration calculations |
| `/health` | GET | Health check (inline in app.js) |
| `/api/upload` | POST | File upload (multipart, inline in app.js) |
| `/api/avatar` | POST | Avatar upload (inline in app.js) |

### 3.3 Code Generator (Design-Time Only)

The code generator at `backend/src/main/java/digital/twin/mogao/codegen/CodeGenerator.java` is a plain Java 17 program built with Maven. It loads the Ecore metamodel via Eclipse EMF and runs the Epsilon engines (EGL/EOL/ETL/EVL) to emit the Mongoose data layer into `backend/runtime/`. It is **not** part of the runtime architecture and runs only on demand via `mvn exec:java@codegen` (or the helper scripts in `backend/`).

### 3.4 Frontend

The frontend is a single-page Vue 3 application loaded entirely from CDN with no build step:

```
index.html
├── Vue 3 (CDN)
├── Three.js + OBJLoader + MTLLoader + OrbitControls (CDN)
├── Axios (CDN)
├── Chart.js (CDN)
├── config.js                          ← API URL configuration
├── api.js                             ← Axios wrapper (all endpoints)
├── i18n.js                            ← Custom composable (zh + en)
├── composables/
│   ├── useEntity.js                   ← Factory function (DRY)
│   ├── useCaves.js                    ← 3-line delegation to factory
│   ├── useStatues.js, useMurals.js, usePaintings.js,
│   ├── useInscriptions.js, useDefects.js
├── components/
│   ├── [Entity]Card.js                ← Generated (6 entity types)
│   ├── [Entity]List.js                ← Generated
│   ├── [Entity]DetailView.js          ← Generated
│   ├── [Entity]Form.js                ← Generated (with file upload validation)
│   ├── ModelViewer.js                 ← Hand-written (Three.js)
│   ├── SimulationPanel.js             ← Hand-written (deterioration UI)
│   └── SettingsView.js                ← Hand-written (profile, themes, admin)
├── workers/
│   └── deterioration-worker.js        ← Web Worker (texture processing)
├── deterioration/
│   └── DeteriorationEngine.js         ← Legacy client-side models (kept for reference)
└── css/
    ├── main.css, components.css, drawers.css, forms.css,
    ├── simulation.css, login.css
    └── styles/model-viewer.css
```

**Component count:** All Vue components under `frontend/components/` are hand-written. The metamodel does not generate any frontend artefacts — see §2.3.

**UI features:**
- Left sidebar navigation (M-Gemini branding)
- 8 colour themes (Mogao Sand, Ocean Blue, Forest Green, Modern Slate, Royal Plum, Warm Ember, Midnight Dark, Sakura Blossom)
- Dashboard with entity counts and quick actions
- Bilingual UI (Chinese/English) with reactive locale switching
- Guest mode (read-only, no login required)

### 3.5 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                            │
│                                                                 │
│  SimulationPanel.js                                             │
│  ├── Temperature / RH / Light / Exposure sliders                │
│  ├── Calls POST /deterioration/assess (debounced 150ms)         │
│  ├── Model toggle checkboxes (4 models)                         │
│  └── $emit('simulation-changed', { ... })                       │
│           │                                                     │
│           ▼                                                     │
│  ModelViewer.js                                                 │
│  ├── Three.js scene (OBJ + texture loading)                     │
│  ├── Sends pixel data to Web Worker for processing              │
│  │   └── deterioration-worker.js (off main thread)              │
│  │       ├── Chemical fading (per-pixel desaturation)            │
│  │       └── Yellowing effect                                   │
│  ├── Receives processed pixels, applies mould spots             │
│  └── CanvasTexture → MeshPhongMaterial → 3D mesh                │
│                                                                 │
│  [Entity]List.js / DetailView.js                                │
│  ├── Axios GET/POST/PUT/DELETE via api.js ───────┐              │
│  └── Renders entity data + 3D viewer             │              │
│                                                  │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                        HTTP REST API (JSON)
                                                   │
┌──────────────────────────────────────────────────┼──────────────┐
│              Node.js/Express Backend             │               │
│                                                  │               │
│  Express Router ←────────────────────────────────┘               │
│  ├── Auth middleware (JWT verify → guest fallback)               │
│  ├── Write-access middleware (guests read-only)                  │
│  ├── Rate limiter (login endpoint)                               │
│  ├── Controller → Service → Mongoose Model → MongoDB            │
│  │                                                               │
│  DeteriorationService                                            │
│  ├── Chemical fading (Arrhenius + Paltakari-Karlsson)            │
│  ├── Lifetime multiplier (Michalski eLM)                         │
│  ├── Mould growth (VTT Finnish model)                            │
│  └── Salt crystallization (Scherer/Steiger)                      │
│                                                                  │
│  FileUpload (Multer)                                             │
│  └── 3D model + texture file storage (exhibit_models/)           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  MongoDB :27017  │
              │  mogao_dt        │
              │                  │
              │  14 collections: │
              │  users, caves,   │
              │  statues, murals,│
              │  paintings,      │
              │  inscriptions,   │
              │  defects,        │
              │  temperatures,   │
              │  humidities,     │
              │  lightintensities│
              │  coordinates,    │
              │  parameters,     │
              │  assetreferences,│
              │  dtpackages      │
              └──────────────────┘
```

---

## 4. Authentication & Security

### 4.1 Authentication Flow

```
1. POST /users/login { username, password }
2. Server verifies bcrypt hash (10 rounds)
3. Returns JWT token (24h expiry) + user profile
4. Frontend stores token in localStorage
5. Axios interceptor adds Authorization: Bearer <token> to all requests
6. Auth middleware verifies token on every protected request
7. Auto-refresh: near-expiry tokens are refreshed server-side
8. 401 response triggers automatic logout + page reload
```

### 4.2 Role System

| Role | Read | Write | Admin |
|------|:----:|:-----:|:-----:|
| admin | ✓ | ✓ | ✓ |
| researcher | ✓ | ✓ | |
| conservator | ✓ | ✓ | |
| viewer | ✓ | | |
| guest | ✓ | | |

### 4.3 Security Measures

- **JWT secret:** Environment variable `JWT_SECRET` required in production (crashes if unset); random per-process in development
- **Password hashing:** bcryptjs with 10 salt rounds
- **Auth priority:** JWT token verified before guest header (prevents bypass)
- **Rate limiting:** 10 login attempts per IP per 15-minute window (429 response)
- **CORS:** Restricted to origins in `CORS_ORIGINS` env var
- **Request limits:** JSON body 10MB, file upload 100MB
- **File type filtering:** Only .obj, .mtl, .jpg, .jpeg, .png, .gif, .json, .glb, .gltf allowed
- **Session expiration:** Frontend 401 interceptor clears credentials and reloads

---

## 5. Deterioration Simulation Engine

The deterioration engine (`DeteriorationService.js`) runs server-side as a Node.js module exposed via REST API. The SimulationPanel calls `POST /deterioration/assess` with environmental parameters and receives computed results. All four models are evaluated per request.

### 5.1 Model 1: Chemical Pigment Fading

**Scientific basis:** Arrhenius kinetics combined with first-order photochemical degradation and the Paltakari-Karlsson moisture sorption isotherm.

**References:**
- Strlič, M. et al. (2015). Damage function for historic paper. *Heritage Science*, 3:40
- Johnston-Feller, R. et al. (1984). The kinetics of fading: opaque paint films pigmented with alizarin lake and titanium dioxide. *JAIC*, 23(2):114–129
- Feller, R. (1994). *Accelerated Aging: Photochemical and Thermal Aspects*. Getty Conservation Institute

**Moisture content** is calculated via the Paltakari-Karlsson sorption isotherm:

$$[\text{H}_2\text{O}] = \left| \frac{\ln(1 - RH)}{1.67T - 285.655} \right|^{1/(2.491 - 0.012T)}$$

where *RH* is relative humidity as a fraction (0–1) and *T* is temperature in Kelvin.

**Composite rate constant** combines dark ageing and photofading via Arrhenius terms:

$$k = k_{0,\text{dark}} \cdot [\text{H}_2\text{O}]^q \cdot \exp\!\left(\frac{-E_{a,\text{dark}}}{RT}\right) + k_{0,\text{light}} \cdot I^p \cdot [\text{H}_2\text{O}]^q \cdot \exp\!\left(\frac{-E_{a,\text{light}}}{RT}\right)$$

**First-order degradation:**

$$\text{degradationFactor} = \exp(-k \cdot t)$$

$$\text{scientificDegradation} = (1 - \text{degradationFactor}) \times 100\%$$

| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| $E_{a,\text{dark}}$ | 70,000 | J/mol | Activation energy, dark oxidation |
| $E_{a,\text{light}}$ | 25,000 | J/mol | Activation energy, photofading |
| $k_{0,\text{dark}}$ | 0.0001 | — | Pre-exponential factor, dark ageing |
| $k_{0,\text{light}}$ | 0.001 | — | Pre-exponential factor, light fading |
| $q$ | 0.8 | — | Reaction order w.r.t. water |
| $p$ | 0.9 | — | Light reciprocity exponent |

**Visual effect:** Per-pixel texture manipulation via Web Worker — desaturation toward warm gray, yellowing (red/green shift), and blue reduction.

---

### 5.2 Model 2: Michalski Equivalent Lifetime Multiplier (eLM)

**Scientific basis:** The Climate for Culture equivalent Lifetime Multiplier compares chemical degradation rate at current environmental conditions to a museum reference of 20 °C / 50% RH.

**References:**
- Michalski, S. (2002). Double the life for each five-degree drop, more than double the life for each halving of relative humidity. *Preprints of ICOM-CC 13th Triennial Meeting*, Rio de Janeiro
- Leissner, J. et al. (2015). Climate for Culture: assessing the impact of climate change on the future indoor climate in historic buildings using simulations. *Heritage Science*, 3:38

**Equation:**

$$LM = \exp\!\left[\frac{E_a}{R}\left(\frac{1}{T} - \frac{1}{T_0}\right)\right] \cdot \left(\frac{RH_0}{RH}\right)^n$$

| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| $E_a$ | 70,000 | J/mol | Activation energy |
| $n$ | 1.3 | — | Humidity exponent |
| $T_0$ | 20 | °C | Reference temperature |
| $RH_0$ | 50 | % | Reference humidity |

**Interpretation:**
- *LM* > 1: Object lasts longer than at reference conditions
- *LM* = 1: Equivalent to museum reference
- *LM* < 1: Object degrades faster than reference

| Conditions | LM | Interpretation |
|------------|-----|----------------|
| 20 °C / 50% RH | ~1.0× | Museum reference |
| 10 °C / 30% RH | ~8× | 8× longer lifetime |
| 30 °C / 70% RH | ~0.1× | Degrades 10× faster |
| 0 °C / 30% RH | ~150× | Cold storage benefit |

---

### 5.3 Model 3: VTT Mould Growth Model

**Scientific basis:** The VTT model (Finnish Technical Research Centre) predicts mould growth on heritage substrates using a temperature-dependent critical humidity threshold and a standardised 0–6 mould index scale. It is the primary mould risk model used in European heritage conservation.

**References:**
- Hukka, A. & Viitanen, H. (1999). A mathematical model of mould growth on wooden material. *Wood Science and Technology*, 33:475–485
- Ojanen, T. et al. (2011). Mould growth modeling of building structures using sensitivity classes of materials. *Proceedings of Building Simulation 2011*

**Critical RH threshold** — below this humidity, no mould grows:

$$RH_{\text{crit}} = -0.0026T^3 + 0.160T^2 - 3.13T + 100.0$$

Valid for $T$ = 0–50 °C. Examples:

| Temperature | $RH_{\text{crit}}$ |
|-------------|---------------------|
| 5 °C | ~92% |
| 15 °C | ~84% |
| 25 °C | ~77% |

**Mould index scale (0–6):**

| M | Description |
|---|-------------|
| 0 | No growth |
| 1 | Microscopic growth visible |
| 2 | Visible under microscope |
| 3 | Surface coverage < 10% |
| 4 | Surface coverage 10–50% |
| 5 | Surface coverage 50–100% |
| 6 | Tight, complete coverage |

**Growth rate** when $RH \geq RH_{\text{crit}}$ and $T > 0$ °C:

$$\frac{dM}{dt} = 0.13 \cdot \frac{RH - RH_{\text{crit}}}{100} \cdot \frac{T}{20} \quad \text{(per day)}$$

**Decline rate** when $RH < RH_{\text{crit}}$: $dM/dt = -0.128$ per day.

| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| growthCoeff | 0.13 | — | Growth rate coefficient |
| declineRate | −0.128 | /day | Decline rate when dry |

**Visual effect:** Procedural dark green-black mould spots applied to the 3D texture using deterministic pseudo-random noise with dark-pixel bias (moisture-prone recesses) and soft-edged falloff. Coverage scales linearly with mould index.

---

### 5.4 Model 4: Salt Crystallization Pressure

**Scientific basis:** The Scherer/Steiger crystallization pressure model predicts mechanical stress exerted on pore walls by growing salt crystals. Salt damage — manifesting as efflorescence, granular disintegration, flaking, and spalling — is the single most destructive deterioration mechanism at the Mogao Caves, primarily driven by Na₂SO₄ (thenardite/mirabilite) under the dramatic diurnal RH swings of the Gobi desert.

**References:**
- Scherer, G.W. (1999). Crystallization in pores. *Cement and Concrete Research*, 29(8):1347–1358
- Steiger, M. (2005). Crystal growth in porous materials — I: The crystallization pressure of large crystals. *Journal of Crystal Growth*, 282(3–4):455–469

**Deliquescence RH threshold** — temperature-dependent boundary between crystallization and dissolution:

$$DRH(T) = DRH_{\text{ref}} + DRH_{\text{slope}} \cdot (T - T_{\text{ref}})$$

For Na₂SO₄ (thenardite): $DRH \approx 84.2\%$ at 25 °C, slope = −0.17 %/°C.

**Crystallization pressure** — when $RH < DRH$, the solution supersaturates:

$$\Delta P = \frac{RT}{V_m} \cdot \ln(S)$$

where the supersaturation ratio $S = DRH / RH$ (approximated from the ratio of water activities at the deliquescence point vs. current conditions).

**Damage ratio** — crystallization pressure relative to substrate tensile strength:

$$\text{damageRatio} = \frac{\Delta P}{\sigma_{\text{tensile}}}$$

A damageRatio > 1.0 indicates the crystallization pressure exceeds the mechanical strength of the substrate.

**Cumulative damage** — accounts for repeated wet-dry cycling over the exposure period:

$$\text{cumulativeDamage} = \text{damageRatio} \times \text{totalCycles} \times 0.5$$

$$\text{totalCycles} = \frac{\text{totalDays}}{365.25} \times \text{cyclesPerYear}$$

| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| $V_m$ | 5.33 × 10⁻⁵ | m³/mol | Molar volume of Na₂SO₄ (thenardite) |
| $DRH_{\text{ref}}$ | 84.2 | % | Deliquescence RH at reference temperature |
| $DRH_{\text{slope}}$ | −0.17 | %/°C | Temperature coefficient of DRH |
| $T_{\text{ref}}$ | 25 | °C | Reference temperature for DRH |
| $\sigma_{\text{tensile}}$ | 3.0 | MPa | Tensile strength of plaster/sandstone substrate |
| cyclesPerYear | 120 | — | Estimated wet-dry cycles per year (desert diurnal) |

**Risk classification:**

| Condition | Label |
|-----------|-------|
| $RH \geq DRH$ (salt dissolved) | Safe |
| damageRatio < 0.5 | Low |
| damageRatio 0.5–1.5 | Moderate |
| damageRatio 1.5–3.0 | High |
| damageRatio ≥ 3.0 | Critical |

| Conditions | Pressure | Damage Ratio | Status |
|------------|----------|--------------|--------|
| 20 °C / 50% RH | ~8.1 MPa | ~2.7× | Critical — crystallizing |
| 20 °C / 70% RH | ~2.9 MPa | ~1.0× | Moderate — crystallizing |
| 20 °C / 85% RH | 0 MPa | 0× | Safe — dissolved |

### 5.5 Deterioration API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/deterioration/assess` | POST | Run all 4 models, return combined results |
| `/deterioration/chemical` | POST | Chemical pigment fading only |
| `/deterioration/lifetime` | POST | Lifetime multiplier only |
| `/deterioration/mould` | POST | Mould growth only |
| `/deterioration/salt` | POST | Salt crystallization only |
| `/deterioration/defaults` | GET | Return default parameter sets |

**Request body** (for `/assess`):
```json
{
  "T_celsius": 25,
  "RH_percent": 65,
  "light_klux": 0.5,
  "totalDays": 365,
  "prevMouldIndex": 0,
  "chemicalParams": {},
  "lifetimeParams": {},
  "mouldParams": {},
  "saltCrystParams": {}
}
```

---

## 6. 3D Visualisation Pipeline

### 6.1 Model Loading

Three.js loads OBJ-format 3D models with associated texture images from the backend file storage:

```
Backend storage          Three.js Loaders           Scene
/exhibit_models/model/   ─── OBJLoader ──────→  Object3D (geometry)
/exhibit_models/texture/ ─── TextureLoader ──→  MeshPhongMaterial (appearance)
```

The viewer provides:
- Orbit controls (rotate, zoom, pan)
- Ambient + directional lighting
- Automatic camera framing based on model bounding box

### 6.2 Deterioration Texture Pipeline

When the simulation panel emits environmental changes, the 3D viewer applies deterioration effects via a Web Worker:

```
1. Original texture (stored on load as ImageData)
     │
2. Extract pixel data from canvas
     │
3. Post to Web Worker (off main thread)
     ├── Chemical fading: desaturation toward warm gray
     ├── Yellowing: red/green shift, blue reduction
     └── Transfer buffer back to main thread
     │
4. Main thread receives processed pixels
     ├── Apply mould spots (if enabled, mouldIndex > 0.1)
     │   ├── Deterministic pseudo-random noise (seeded hash)
     │   ├── Dark green-black colour (RGB 20, 40, 15)
     │   └── Dark-pixel bias + soft-edged falloff
     │
5. Write to offscreen canvas → CanvasTexture → apply to mesh materials
```

---

## 7. Simulation Panel User Interface

The simulation panel provides:

### 7.1 Environmental Controls
- **Temperature** slider (−10 to 40 °C, with °F conversion)
- **Relative Humidity** slider (10–90%)
- **Light Intensity** slider (0–50 klux) — in advanced settings
- **Exposure Time** slider (0–200 years) — in advanced settings

### 7.2 Deterioration Models Card
A master control card showing all 4 model toggles with enable/disable checkboxes and a counter (e.g., "3 / 4").

### 7.3 Per-Model Result Cards
Each enabled model displays a dedicated card:

| Model | Primary Metric | Secondary Display |
|-------|---------------|-------------------|
| Chemical Fading | Degradation % | Rate constant (k /day) |
| Lifetime Multiplier | Multiplier value (×) | Longer/shorter label |
| Mould Growth | Mould index (0–6 gauge) | RH threshold + status |
| Salt Crystallization | Pressure (MPa) | Damage ratio gauge + DRH threshold |

Each card includes:
- Risk badge (colour-coded: green/yellow/orange/red)
- Expandable parameter configuration section
- Reset-to-defaults button (fetches from backend API)

### 7.4 Additional Features
- **Quick presets:** Museum (100y), 1 Year, 10 Years, Poor Storage, Extreme
- **Time progression:** Play/pause mode with configurable speed (0.1–20× real-time)
- **Time-series chart:** Chart.js line graph tracking temperature, humidity, light, degradation, and mould index over simulated time
- **Scientific metrics:** Raw numerical outputs for all models

### 7.5 Internationalisation
All UI labels are available in Chinese (zh) and English (en) via a custom Vue 3 composable with reactive locale switching.

---

## 8. Configuration & Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8008 | Node.js backend port |
| `MONGO_URI` | `mongodb://localhost:27017/mogao_dt` | MongoDB connection string |
| `JWT_SECRET` | (random in dev, **required** in production) | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:8009,...` | Comma-separated allowed origins |
| `NODE_ENV` | — | Set to `production` to enforce JWT_SECRET |

Frontend configuration is in `frontend/config.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8008',
};
```

---

## 9. File Structure

```
mogao-digital-twin/
├── backend/
│   ├── pom.xml                                    Maven project (codegen only)
│   ├── src/main/
│   │   ├── java/digital/twin/mogao/
│   │   │   ├── codegen/CodeGenerator.java         EGL code generation driver
│   │   │   └── util/EpsilonModelManager.java      EMF model loader
│   │   └── resources/
│   │       ├── metamodel/mogao_dt.ecore            Ecore metamodel
│   │       ├── models/instances/mogao.model        Flexmi model instance
│   │       └── transformation/
│   │           ├── mongodb/                        Mongoose model/service/controller/router templates
│   │           └── eol/                            EOL helper operations
│   ├── runtime/                        ← RUNTIME BACKEND
│   │   ├── app.js                                 Express app (middleware, routes)
│   │   ├── server.js                              Entry point (port 8008)
│   │   ├── package.json                           Node.js dependencies
│   │   ├── start.bat                              Start script (Windows)
│   │   ├── middleware/auth.js                     JWT + guest auth middleware
│   │   ├── util/jwt.js                            JWT generation/verification
│   │   ├── models/                                Mongoose schemas (14 models)
│   │   ├── routers/                               Express routers (16 routers)
│   │   ├── controllers/                           Request handlers (16 controllers)
│   │   ├── services/                              Business logic (16 services)
│   │   │   └── DeteriorationService.js            Scientific models (hand-written)
│   │   └── exhibit_models/                        Uploaded 3D models + textures
│   └── exhibit_models/                            Static 3D model storage
├── frontend/
│   ├── index.html                                 Entry point (CDN imports)
│   ├── config.js                                  API URL configuration
│   ├── api.js                                     Axios wrapper (all endpoints)
│   ├── app.js                                     Vue app (views, routing, auth)
│   ├── i18n.js                                    Internationalisation (zh + en)
│   ├── composables/
│   │   ├── useEntity.js                           Factory function (DRY)
│   │   └── use[Entity].js                         Per-entity delegations (6 files)
│   ├── components/
│   │   ├── [Entity]Card.js                        Generated card components (7)
│   │   ├── [Entity]List.js                        Generated list components (7)
│   │   ├── [Entity]DetailView.js                  Generated detail views (7)
│   │   ├── [Entity]Form.js                        Generated forms (7)
│   │   ├── ModelViewer.js                         Three.js 3D viewer
│   │   └── SimulationPanel.js                     Deterioration simulation UI
│   ├── workers/
│   │   └── deterioration-worker.js                Web Worker (texture processing)
│   ├── deterioration/
│   │   └── DeteriorationEngine.js                 Legacy client-side models
│   ├── css/
│   │   ├── main.css, components.css, drawers.css, forms.css,
│   │   ├── simulation.css, login.css
│   │   └── styles/model-viewer.css, simulation-panel.css
│   ├── start-frontend.bat                         Start script (Python HTTP server)
│   └── start.bat                                  Start script (with port cleanup)
└── ARCHITECTURE.md                                This document
```

---

## 10. Pigment Analysis System

The pigment analysis system identifies historical pigments in 3D model textures and feeds the resulting per-pixel class map into the per-pigment Arrhenius extension of the chemical fading model. It runs entirely client-side in the browser and uses an HSV decision tree — no machine-learning model is loaded (the dependency footprint is zero ML libraries).

### 10.1 Problem Statement

Heritage artefact textures are photographs of **already-degraded** surfaces. Applying uniform Arrhenius fading to a 1200-year-old faded texture compounds degradation on top of degradation. The pigment-aware path:

1. **Identifies** what pigments are present in each texture region.
2. **Applies per-pigment degradation** with pigment-specific Arrhenius parameters in the deterioration worker.

### 10.2 Architecture

```
Texture (originalPixelData captured at load via fetch → ImageBitmap → canvas)
                    │
              PigmentIdentifier
              (HSV decision tree)
                    │
              pigmentMap: Uint8Array
              (per-pixel class ID)
                    │
              PigmentAnalysis.computePerPigmentParams(env)
                    │
              perPigmentParams: { [classId]: { degradationFactor,
                                               targetRGB, fadedRGB,
                                               agingTint } }
                    │
              pigment-deterioration-worker.js
              (per-pixel: fade toward fadedRGB + apply agingTint)
                    │
              Region-aware texture degradation
              (vermilion darkens, azurite greens, lead white yellows)
```

### 10.3 Pigment Database (`frontend/pigment/PigmentDatabase.js`)

Eight Dunhuang-specific pigment classes with per-pigment Arrhenius kinetic parameters sourced from conservation literature:

| ID | Pigment | Chinese | Ea_dark (J/mol) | Ea_light (J/mol) | Stability | Degradation behaviour |
|----|---------|---------|-----------------|-------------------|-----------|----------------------|
| 0 | Background/substrate | 底色 | 70,000 | 25,000 | Moderate | Uniform warm-grey fading |
| 1 | Azurite | 石青 | 85,000 | 18,000 | Low (light) | Green shift (CuO formation) |
| 2 | Malachite | 石绿 | 90,000 | 22,000 | Moderate | Relatively stable |
| 3 | Vermilion | 朱砂 | 75,000 | 15,000 | Low (light) | Darkens/blackens (meta-cinnabar) |
| 4 | Lead white | 铅白 | 65,000 | 30,000 | Moderate | Yellowing, darkens with H₂S |
| 5 | Gold leaf | 金箔 | 120,000 | 50,000 | Very high | Minimal tarnishing |
| 6 | Red ochre | 赭石 | 95,000 | 35,000 | Very high | Very lightfast (Fe₂O₃) |
| 7 | Carbon black | 墨 | 110,000 | 45,000 | Very high | Extremely stable |

Vermilion, azurite, and lead white also carry an `agingTint: { amount, dR, dG, dB }` field that the worker applies as a secondary effect on top of the base fade.

### 10.4 Pigment Identifier (`frontend/pigment/PigmentIdentifier.js`)

HSV colour-space classification with conservative thresholds tuned for Dunhuang pigments. The classifier is an order-dependent decision tree: most-distinctive signatures first (carbon black, lead white, gold leaf), then a red-family branch (vermilion vs red ochre by saturation), then green/blue ranges. Saturation thresholds are deliberately high (0.25–0.50) so that neutral/brown tones remain as "background" rather than being aggressively classified as chromatic pigments.

Output:
```javascript
{
  pigmentMap: Uint8Array,        // Per-pixel class index (0–7)
  pigmentNames: string[],        // Class names matching PigmentDatabase keys
  confidence: Float32Array,      // Per-pixel max confidence (0–1)
  regionSummary: [{ pigmentName, displayName, pixelCount, percentage, color }]
}
```

### 10.5 Pigment Analysis Module (`frontend/pigment/PigmentAnalysis.js`)

Single seam in front of the pigment subsystem. Three stateless functions:

- `identifyPigments(pixelData, w, h)` — delegates to PigmentIdentifier, caches the instance.
- `computePerPigmentParams({ T_celsius, RH_percent, light_klux, totalDays })` — runs the per-pigment Arrhenius math from PigmentDatabase entries and returns the payload the worker consumes.
- `runDeteriorationWorker({ pixelData, pigmentMap, perPigmentParams, width, height, amplification })` — owns the worker singleton, posts a message, returns a Promise that resolves with the processed pixel buffer.

PigmentAnalysisPanel and SimulationEngine and ModelViewer all import from this module — none reach for PigmentIdentifier or PigmentDatabase directly.

### 10.6 Per-Pigment Deterioration Worker (`frontend/workers/pigment-deterioration-worker.js`)

Runs off the main thread. For each pixel:

1. Look up the pixel's pigment class from `pigmentMap`.
2. Read that pigment's `{ degradationFactor, fadedRGB, agingTint }` from `pigmentParams`.
3. Compute `visualDeg = 1 − degradationFactor^amplification` (amplification = 3).
4. Blend the pixel toward `fadedRGB` by `visualDeg`.
5. If `agingTint` is present, apply `delta = visualDeg * tint.amount` as signed deltas (`dR`, `dG`, `dB`) — vermilion darkens, azurite shifts green, lead white yellows. Pigments without an `agingTint` field skip this step.

The worker reads tints from the params payload; it has no hard-coded class IDs.

### 10.7 UI (`frontend/components/PigmentAnalysisPanel.js`)

A side panel rendered by `CaveList` alongside `SimulationPanel`. Provides:

- **"Identify Pigments"** button — runs `PigmentAnalysis.identifyPigments` on the captured texture pixels.
- **Display mode toggle** — *Current* (the simulation effect renders) vs *Pigment Map* (50% translucent class-coloured overlay on the 3D model).
- **Detected pigments legend** — colour swatches, Chinese / English names, percentage breakdown.

The panel writes results directly into `SimulationEngine.setPigmentAnalysisResult({...})`. SimulationEngine's `renderCommand` picks the appropriate mode for ModelViewer to consume.

### 10.8 File Inventory

| File | Purpose |
|------|---------|
| `frontend/pigment/PigmentDatabase.js` | Data: 8 pigment classes with Arrhenius params, target/faded RGB, optional agingTint |
| `frontend/pigment/PigmentIdentifier.js` | HSV decision-tree classifier |
| `frontend/pigment/PigmentAnalysis.js` | Public module: identify / compute params / run worker |
| `frontend/workers/pigment-deterioration-worker.js` | Per-pigment texture fading (runs off main thread) |
| `frontend/components/PigmentAnalysisPanel.js` | Vue panel: identify button, display-mode toggle, legend |

---

## 11. References

1. Strlič, M. et al. (2015). Damage function for historic paper. *Heritage Science*, 3:40.
2. Johnston-Feller, R. et al. (1984). The kinetics of fading: opaque paint films pigmented with alizarin lake and titanium dioxide. *JAIC*, 23(2):114–129.
3. Feller, R. (1994). *Accelerated Aging: Photochemical and Thermal Aspects*. Getty Conservation Institute.
4. Michalski, S. (2002). Double the life for each five-degree drop, more than double the life for each halving of relative humidity. *Preprints of ICOM-CC 13th Triennial Meeting*, Rio de Janeiro.
5. Leissner, J. et al. (2015). Climate for Culture: assessing the impact of climate change on the future indoor climate in historic buildings using simulations. *Heritage Science*, 3:38.
6. Hukka, A. & Viitanen, H. (1999). A mathematical model of mould growth on wooden material. *Wood Science and Technology*, 33:475–485.
7. Ojanen, T. et al. (2011). Mould growth modeling of building structures using sensitivity classes of materials. *Proceedings of Building Simulation 2011*.
8. Scherer, G.W. (1999). Crystallization in pores. *Cement and Concrete Research*, 29(8):1347–1358.
9. Steiger, M. (2005). Crystal growth in porous materials — I: The crystallization pressure of large crystals. *Journal of Crystal Growth*, 282(3–4):455–469.
10. Kowalski, S. et al. (2017). Thermal-oxidative stability of linseed oil by PDSC. *Journal of Thermal Analysis and Calorimetry*, 130:53–60.
