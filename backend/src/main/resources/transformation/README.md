# Model-to-Text Transformations

EGL (Epsilon Generation Language) templates that emit code from the Mogao
Digital Twin Ecore metamodel. The metamodel itself lives at
[`../metamodel/mogao_dt.ecore`](../metamodel/mogao_dt.ecore).

## What is and is not generated

The runtime is split into a **generated data layer** and a **hand-written
domain layer**. Generation deliberately stops at the CRUD boundary.

### Generated (regeneratable)

Run `mvn exec:java@codegen` (or `backend/generate-code.bat`) to regenerate.

| Output | Template | Per-entity? |
|---|---|---|
| `models/X.js` (Mongoose schema) | `mongodb/GenerateMongooseModel.egl` | yes — every EClass, concrete + abstract |
| `models/index.js` (catalogue) | hard-coded in `CodeGenerator.java` | no |
| `services/XService.js` | `mongodb/GenerateMongooseService.egl` | yes — every concrete entity in the entityClasses array |
| `controllers/XController.js` | `mongodb/GenerateMongooseController.egl` | yes — same list |
| `routers/xRouter.js` | `mongodb/GenerateMongooseRouter.egl` | yes — same list |

The pipeline is provably idempotent: a fresh regeneration leaves
`backend/generated/mongoose/` byte-equivalent to what is checked in.

### Hand-written (outside the generator's remit)

| Layer | Files |
|---|---|
| Express infrastructure | `app.js`, `server.js`, `package.json`, the four `index.js` files in `services/`, `controllers/`, `routers/` |
| Auth | `middleware/auth.js`, `middleware/sensorAuth.js`, `services/UserService.js`, `routers/userRouter.js`, `util/jwt.js`, `models/User.js` |
| Telemetry pipeline | `models/Sensor.js`, `models/EnvironmentSample.js`, `services/TelemetryService.js`, `controllers/TelemetryController.js`, `routers/telemetryRouter.js` |
| Domain logic | `services/DeteriorationService.js`, `DeteriorationReplayService.js`, `AnomalyDetectionService.js`, `MaintenanceService.js`, `ValidationHarness.js`, `ExhibitService.js`, plus matching controllers/routers |
| Vue 3 frontend | `frontend/` in its entirety — purpose-built for the heritage-deterioration use case (3D viewer, deterioration simulation, prediction panel, maintenance queue, sensor dashboard, application shell, i18n, index.html). Frontend EGL templates were retired because the per-entity boilerplate they emitted was a small fraction of the live components and the substantive UI is not a deterministic function of the metamodel. |

## Templates in this directory

```
transformation/
├── README.md            (this file)
├── RUN_TRANSFORMATIONS.md   (build / run instructions)
├── mongodb/             (active — Mongoose backend data layer)
│   ├── GenerateMongooseModel.egl
│   ├── GenerateMongooseService.egl
│   ├── GenerateMongooseController.egl
│   ├── GenerateMongooseRouter.egl
│   └── GenerateAllMongooseModels.egl   (driver for ad-hoc model-only regen)
└── eol/                 (scaffolding — kept but not invoked from main())
    └── GenerateEOLOperations.egl
```

The `transformation/backend/` directory of Java/Micronaut templates was
retired during Phase 1 (Micronaut runtime retirement). The
`transformation/frontend/` directory of Vue 3 templates was subsequently
retired with the decision to keep the frontend hand-written.
