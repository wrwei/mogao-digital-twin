# Mogao Digital Twin

A Model-Driven Engineering (MDE) system for the Mogao Caves Digital Twin, a UNESCO World Heritage Site in Gansu, China.

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| **Design-time** | Java 17, Micronaut 4.2.3, Epsilon EGL/EOL, Eclipse EMF (Ecore) | Metamodel-driven code generation |
| **Runtime backend** | Node.js, Express.js, MongoDB, Mongoose | REST API + persistence |
| **Runtime frontend** | Vue 3 (CDN), Three.js, Chart.js, Axios, TensorFlow.js | SPA with 3D visualisation |
| **Authentication** | JWT (jsonwebtoken), bcryptjs | Token-based auth with role system; sensor devices authenticate via API key |
| **Testing** | Jest | Unit tests for deterioration models |

## Features

- **Model-Driven**: A single Ecore metamodel generates the entire backend (Mongoose models, Express routers, controllers, services) and frontend (Vue CRUD components, composables, i18n)
- **3D Visualisation**: Three.js-based viewer for OBJ/MTL heritage artefacts with real-time deterioration texture effects (chemical fading, mould patches, salt efflorescence, lifetime desaturation, hygro-mechanical craquelure)
- **Five Deterioration Models** (peer-reviewed conservation science):
  - Chemical pigment fading — Arrhenius kinetics on Paltakari-Karlsson sorption isotherm
  - Michalski lifetime multiplier — Climate for Culture eLM variant
  - VTT mould growth — Hukka-Viitanen 1999
  - Salt crystallisation pressure — Correns / Steiger 2005
  - Hygro-mechanical fatigue — Basquin + Miner's rule, after Bratasz 2013
- **ML Pigment Analysis**:
  - Per-pixel pigment classification into 8 mineralogical classes (heuristic HSV default, optional MobileNetV2 neural net)
  - Database-driven colour restoration using reference chromaticities from published conservation analyses
- **Telemetry Pipeline** — live monitoring with per-sensor API keys:
  - Single-sample, batch, and CSV-file ingestion endpoints
  - 10-minute sampling cadence by default
  - Time-series environment query per artifact with raw / hourly / daily aggregation
  - Compound unique index for idempotent re-ingestion
- **Sensor Dashboard** (admin-only) — fleet-view of all sensors with health status, per-sensor detail panels with endpoint URLs and API-key rotation, bulk CSV backfill with filename auto-matching
- **Live Data Panel** (per-artifact) — current reading card, dual-axis T/RH time-series chart with data-gap visualisation, time-range and interval selectors, auto-refresh, admin controls for sensor linking and CSV upload
- **Multilingual**: Chinese and English with reactive locale switching
- **Authentication**: JWT login with role system (admin, researcher, conservator, viewer, guest) plus read-only guest access; sensors authenticate independently via `X-Sensor-Key` header
- **8 Colour Themes**: Mogao Sand, Ocean Blue, Forest Green, Modern Slate, Royal Plum, Warm Ember, Midnight Dark, Sakura Blossom

## Quick Start

### Prerequisites

- Node.js 18+ and npm (for runtime backend)
- MongoDB 5.0+ (running on `localhost:27017`)
- Python 3 (only for the lightweight frontend HTTP server — any static host works)
- Java 17+ and Maven 3.8+ (only if you want to **regenerate** code from the Ecore metamodel)

### Launch both servers

From the repo root:

```bash
./start.bat     # Windows — opens two console windows
./start.sh      # Linux / macOS / Git Bash — runs in one terminal, Ctrl+C stops both
```

Or manually:

```bash
cd backend/generated/mongoose && npm install && npm start    # backend on :8008
cd frontend && python -m http.server 8009                    # frontend on :8009
```

### First-run setup

```bash
cd backend/generated/mongoose
npm run seed:admin                                            # creates admin/admin123 (override via env)
ADMIN_PASSWORD='YourStrong!' npm run seed:admin               # custom password
```

To register a demo sensor and obtain its API key:

```bash
npm run seed:sensor
```

### Access

- **Frontend**: http://localhost:8009 (login or use guest access)
- **API**: http://localhost:8008
- **Health check**: http://localhost:8008/health

## Testing

```bash
cd backend/generated/mongoose
npm test                                                      # runs Jest unit tests
```

Current coverage: 25 tests across the five deterioration models (chemical fading, Michalski lifetime, VTT mould, salt crystallisation, hygro-mechanical fatigue) and the combined `/assess` endpoint wiring.

## Project Structure

```
mogao-digital-twin/
├── start.bat / start.sh                        # Top-level dual launcher
│
├── backend/
│   ├── src/main/                               # Code-generation source
│   │   ├── java/digital/twin/mogao/
│   │   │   ├── codegen/CodeGenerator.java
│   │   │   └── util/EpsilonModelManager.java
│   │   └── resources/
│   │       ├── metamodel/mogao_dt.ecore
│   │       ├── models/instances/mogao.model
│   │       └── transformation/                 # EGL templates
│   │           ├── backend/                    #   Java DTOs (design-time)
│   │           ├── mongodb/                    #   Mongoose/Express generation
│   │           └── frontend/                   #   Vue component generation
│   ├── generated/mongoose/                     # ← RUNTIME BACKEND
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── models/                             # Mongoose schemas
│   │   │   ├── [Entity].js                     #   (auto-generated)
│   │   │   ├── Sensor.js                       #   (manual — telemetry)
│   │   │   └── EnvironmentSample.js            #   (manual — telemetry)
│   │   ├── routers/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── DeteriorationService.js         # 5 scientific models
│   │   │   └── TelemetryService.js             # Sensor + sample logic
│   │   ├── middleware/
│   │   │   ├── auth.js                         # JWT + guest
│   │   │   └── sensorAuth.js                   # X-Sensor-Key
│   │   ├── scripts/
│   │   │   ├── seed-admin.js
│   │   │   └── seed-sensor.js
│   │   ├── __tests__/                          # Jest unit tests
│   │   │   └── DeteriorationService.test.js
│   │   └── start.bat                           # Sets CORS_ORIGINS, starts node
│   └── pom.xml
│
├── frontend/
│   ├── index.html
│   ├── config.js                               # API_BASE_URL (edit for deployment)
│   ├── api.js                                  # axios + api.{sensors,exhibits,...}
│   ├── app.js                                  # Vue app, routing, auth
│   ├── i18n.js                                 # zh + en translations
│   ├── components/
│   │   ├── [Entity]Card/List/Form/Detail.js    # Generated CRUD
│   │   ├── ModelViewer.js                      # Three.js 3D viewer
│   │   ├── SimulationPanel.js                  # 5-model deterioration UI
│   │   ├── PigmentAnalysisPanel.js             # ML pigment ID + restorer
│   │   ├── LiveDataPanel.js                    # Real-time telemetry
│   │   ├── SensorDashboard.js                  # Fleet management (admin)
│   │   └── SettingsView.js                     # User settings
│   ├── ml/                                     # PigmentIdentifier, PigmentRestorer, PigmentDatabase
│   ├── workers/
│   │   ├── deterioration-worker.js
│   │   └── pigment-deterioration-worker.js
│   └── css/
│
├── ml/inpainting/                              # PyTorch U-Net training scripts (future work)
├── ARCHITECTURE.md
├── ML-MODELS.md                                # Pigment ID + restorer background
└── README.md                                   # This file
```

## API Endpoints

All entity endpoints support CRUD + GID-based access with pagination (`?page=N&limit=N&sort=field`).

### Core entities

| Route | Description |
|-------|-------------|
| `/caves`, `/statues`, `/murals`, `/paintings`, `/inscriptions` | Heritage artefacts |
| `/defects` | Defect records |
| `/temperatures`, `/humidities`, `/lightIntensities` | Legacy per-type environmental readings |
| `/coordinates`, `/parameters`, `/assetReferences`, `/dTPackages` | Utility entities |
| `/users` | Authentication (login/register) + user management |
| `/health` | Health check |
| `/api/upload` | File upload (3D models, textures) |

### Cross-entity queries

| Route | Description |
|-------|-------------|
| `/exhibits` | All exhibit types in one list |
| `/exhibits/:gid` | Single exhibit across Statue/Mural/Painting/Inscription |
| `/exhibits/:gid/environment?from=&to=&interval=raw\|hourly\|daily` | Time-series T/RH/light for an artifact |
| `/exhibits/critical`, `/exhibits/with-defects`, `/exhibits/requiring-attention` | Filtered views |

### Deterioration models

| Route | Description |
|-------|-------------|
| `POST /deterioration/assess` | Run all five models at once |
| `POST /deterioration/chemical\|lifetime\|mould\|salt\|fatigue` | Individual model |
| `GET /deterioration/defaults` | Default parameter sets |

### Telemetry (`X-Sensor-Key` auth)

| Route | Description |
|-------|-------------|
| `POST /telemetry/samples` | Single reading |
| `POST /telemetry/samples/batch` | Up to 10,000 readings per call |
| `POST /telemetry/samples/upload` | Multipart CSV (columns: timestamp, temperature, humidity, lightKlux) |

### Sensor admin (JWT auth, admin role)

| Route | Description |
|-------|-------------|
| `GET /sensors` | List all sensors |
| `GET /sensors/:gid` | Single sensor |
| `POST /sensors` | Register new sensor; returns plaintext API key once |
| `PATCH /sensors/:gid` | Update mutable fields (name, model, channels, location, calibration) |
| `DELETE /sensors/:gid` | Deactivate |
| `POST /sensors/:gid/link-artifact` | Bind sensor to a specific artifact via `explicitArtifacts` |
| `DELETE /sensors/:gid/link-artifact/:artGid` | Unbind |
| `POST /sensors/:gid/rotate-key` | Issue a fresh API key (invalidates previous one) |
| `POST /sensors/:gid/samples/batch` | Admin batch ingestion without needing the sensor key |
| `POST /sensors/:gid/samples/upload` | Admin CSV upload |

## Environment Variables (Runtime)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8008 | Backend port |
| `MONGO_URI` | `mongodb://localhost:27017/mogao_dt` | MongoDB connection |
| `JWT_SECRET` | random (dev) / **required** (prod) | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:8009,...` | Allowed CORS origins (comma-separated). Add the deployed frontend URL when deploying. |
| `NODE_ENV` | — | Set `production` to enforce `JWT_SECRET` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` | `admin` / `admin123` / `admin@mogao.local` | Used only by `npm run seed:admin` |
| `SENSOR_NAME` / `SENSOR_CAVE` / `SENSOR_MODEL` | defaults | Used only by `npm run seed:sensor` |

## Development Workflow

### Modifying the Metamodel

1. Edit `backend/src/main/resources/metamodel/mogao_dt.ecore`
2. Regenerate code: `cd backend && ./generate-code.bat`
3. Restart the backend and refresh the frontend

Adding a new heritage artefact type (e.g. `Textile`) to the metamodel automatically generates the complete backend API and frontend UI.

### Modifying Templates

1. Edit EGL templates in `backend/src/main/resources/transformation/`
2. Regenerate code: `cd backend && ./generate-code.bat`
3. Restart and refresh

### Hand-written components (not auto-generated)

Several runtime components were added by hand rather than through the EGL templates:

- **Backend**: `DeteriorationService`, `TelemetryService`, `Sensor` model, `EnvironmentSample` model, sensor/telemetry controllers and routers, `sensorAuth` middleware
- **Frontend**: `ModelViewer`, `SimulationPanel`, `PigmentAnalysisPanel`, `LiveDataPanel`, `SensorDashboard`, ML helpers (`PigmentIdentifier`, `PigmentRestorer`, `PigmentDatabase`), deterioration web workers

If you regenerate from the metamodel, these files survive untouched (the generator only produces the auto-generated ones listed in the Ecore).

## Documentation

- [System Architecture & Deterioration Models](ARCHITECTURE.md) — full technical reference
- [Deterioration Simulation Guide](frontend/DETERIORATION_SIMULATION.md) — Strlic dose-response framework
- [ML Models](ML-MODELS.md) — pigment identifier + restorer background
- [Predictive Analytics Plan](PREDICTION-PLAN.md) — roadmap for historical replay, forecast ETA, anomaly detection, and maintenance triage built on top of the telemetry pipeline
- [i18n Guide](frontend/I18N_README.md) — multilingual support

## Troubleshooting

### Backend fails to start
- Ensure MongoDB is running (`mongosh` succeeds)
- Check port 8008 is free
- Run `npm install` in `backend/generated/mongoose/`

### Frontend not loading
- Regenerate code if components are missing: `cd backend && ./generate-code.bat`
- Check backend is running (CORS errors indicate backend is down)
- For deployed frontend: edit `frontend/config.js` to point `API_BASE_URL` at the public backend host, and add that host to `CORS_ORIGINS` on the backend

### 3D models not loading
- Ensure model files are in `backend/generated/mongoose/exhibit_models/`
- Check file extensions (`.obj`, `.mtl`, `.glb`, `.gltf`, `.jpg`, `.png`)

### Sensor can't push data
- Confirm the `X-Sensor-Key: prefix.secret` header is set correctly
- If the key was lost, any admin can rotate it from the Live Data panel or `POST /sensors/:gid/rotate-key`
- Verify the sensor is `status.active: true` via `GET /sensors/:gid` or the Sensor Dashboard

---

Built with Model-Driven Engineering for heritage conservation research.
