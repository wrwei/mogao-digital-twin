# Model-to-Text Transformations

This directory contains EGL (Epsilon Generation Language) templates for generating Java code from the Mogao Digital Twin metamodel.

## Templates

### GenerateDTO.egl
Generates a Data Transfer Object (DTO) class from an EClass in the metamodel.

**Parameters:**
- `eClass`: The EClass to generate DTO for
- `packageName`: The package name for the DTO

**Usage:**
```java
Map<String, Object> params = new HashMap<>();
params.put("eClass", someEClass);
params.put("packageName", "digital.twin.mogao.dto");
String dtoCode = modelManager.executeEglTemplate("transformation/GenerateDTO.egl", params);
```

### GenerateService.egl
Generates a Service class from an EClass in the metamodel.

**Parameters:**
- `eClass`: The EClass to generate Service for
- `packageName`: The package name for the Service

### GenerateAllDTOs.egl
Main orchestration template that generates DTOs for all concrete classes in the metamodel.

## Running Transformations

Use the `EpsilonModelManager` to execute these templates:

```java
EpsilonModelManager manager = new EpsilonModelManager();
String result = manager.executeEglTemplate("transformation/GenerateAllDTOs.egl");
```

## Metamodel Reference

The transformations work with the `mogao_dt.ecore` metamodel located at:
`src/main/resources/metamodel/mogao_dt.ecore`

## Generated Code Location

Generated code will be placed in the `generated/` directory by default.

## Hand-written Extensions (NOT regenerated)

The MDE pipeline covers the domain-model CRUD layer. Several runtime
components were added by hand afterwards and are intentionally outside
the regeneration loop. Running `generate-code.bat` **will not** produce
or modify them:

### Backend

| File | Purpose |
|---|---|
| `services/DeteriorationService.js` | Five peer-reviewed deterioration models (chemical fading, Michalski lifetime, VTT mould, salt crystallisation, hygro-mechanical fatigue) |
| `controllers/DeteriorationController.js` | REST handlers for `/deterioration/*` endpoints |
| `routers/deteriorationRouter.js` | Router for the five deterioration endpoints |
| `models/Sensor.js` | Sensor device metadata with bcrypt-hashed API key |
| `models/EnvironmentSample.js` | 10-minute telemetry sample with compound (sensor, timestamp) unique index |
| `services/TelemetryService.js` | Sensor + sample business logic; batch + CSV ingestion |
| `controllers/TelemetryController.js` | REST handlers for `/sensors/*` and `/telemetry/*` |
| `routers/telemetryRouter.js` | Separate sensor-authenticated and admin-authenticated sub-routers |
| `middleware/sensorAuth.js` | `X-Sensor-Key` validation (bcrypt compare) |
| `scripts/seed-admin.js`, `scripts/seed-sensor.js` | Bootstrap scripts for first-run setup |
| `__tests__/DeteriorationService.test.js` | Jest unit tests for the five deterioration models |
| Extensions in `controllers/ExhibitController.js` and `routers/exhibitRouter.js` | `GET /exhibits/:gid/environment` time-series query endpoint |
| Extensions in `app.js` | CORS middleware with env-var override, sensor-auth route mounting (before JWT), telemetry route registration |

### Frontend

| File | Purpose |
|---|---|
| `components/ModelViewer.js` | Three.js 3D viewer with per-model texture effects (chemical, mould, salt, lifetime, fatigue) |
| `components/SimulationPanel.js` | Five-model deterioration simulation UI with preset catalogue |
| `components/PigmentAnalysisPanel.js` | ML pigment identifier + database-driven restorer controls |
| `components/LiveDataPanel.js` | Real-time telemetry view with dual-axis chart, data-gap visualisation, admin sensor management |
| `components/SensorDashboard.js` | Admin fleet-view with health stats, table, bulk CSV import |
| `ml/PigmentIdentifier.js`, `ml/PigmentRestorer.js`, `ml/PigmentDatabase.js` | HSV-heuristic classifier + target chromaticity database |
| `workers/deterioration-worker.js`, `workers/pigment-deterioration-worker.js` | Web Workers for texture processing |

### Rationale

These components encode *scientific models* (deterioration, sorption
isotherm, fatigue law) and *infrastructure concerns* (sensor auth,
time-series storage, 3D rendering) that don't map cleanly to the
domain metamodel. Keeping them outside the template loop preserves the
generator's focus on CRUD scaffolding while allowing these bespoke
modules to evolve independently.

If the metamodel is extended in future (e.g. adding a `Sensor` EClass),
the existing templates will generate a CRUD shell for it, but the
hand-written specifics (bcrypt field, compound index, API-key rotation)
would still require manual augmentation.

