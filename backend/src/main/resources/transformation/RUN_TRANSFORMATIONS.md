# How to Run EGL Transformations

This guide explains how to regenerate the Mongoose data layer from the
Mogao Digital Twin Ecore metamodel using EGL transformations.

## Prerequisites

- JDK 17+ on `PATH`
- Maven 3.9+ on `PATH`
- Metamodel present at `src/main/resources/metamodel/mogao_dt.ecore` (it
  is — no setup required)

## Running the Code Generator

### Method 1 — convenience scripts

Windows:
```bash
cd backend
generate-code.bat
```

macOS/Linux:
```bash
cd backend
./generate-code.sh
```

### Method 2 — Maven directly

```bash
cd backend
mvn -q compile
mvn -q exec:java@codegen
```

### Method 3 — from an IDE

Run `digital.twin.mogao.codegen.CodeGenerator` as a Java application.

## What the generator does

`CodeGenerator.main()` invokes `generateMongooseBackend()`, which walks
the metamodel and for each EClass emits a Mongoose model
(`backend/runtime/models/X.js`) plus, for each concrete
entity in the `entityClasses` array, a service / controller / Express
router. It also rewrites `models/index.js` (the schema catalogue).

After a clean run, `git status backend/runtime/` should
report no changes — the data layer is provably idempotent.

## What the generator does NOT do

- Does not emit `app.js`, `server.js`, `package.json`, or the
  `services/`, `controllers/`, `routers/` `index.js` files. These are
  hand-written infrastructure (auth, telemetry, sensor admin,
  maintenance, deterioration, file uploads, MongoDB connect).
- Does not touch any of the hand-written domain services
  (`AnomalyDetectionService`, `DeteriorationReplayService`,
  `MaintenanceService`, `TelemetryService`, `ValidationHarness`,
  `ExhibitService`, `UserService`, `DeteriorationService`) or their
  matching controllers/routers.
- Does not touch the Vue 3 frontend in `frontend/` — the frontend
  is hand-written end-to-end. Frontend EGL templates were retired:
  the substantive UI (3D viewer, simulation, prediction, maintenance
  queue, sensor dashboard, application shell) is not a deterministic
  function of the metamodel.

## Adding a new entity

1. Add a concrete `EClass` to `mogao_dt.ecore`.
2. Add the class name to the `entityClasses` array in `CodeGenerator.java`.
3. Run `mvn exec:java@codegen`. New `models/X.js`, `services/XService.js`,
   `controllers/XController.js`, and `routers/xRouter.js` are emitted.
4. Hand-edit `app.js` to require the new router and `app.use()` it on a
   route prefix, and `services/index.js`/`controllers/index.js`/
   `routers/index.js` if you want the new entity in the catalogue.
5. Add Vue 3 components (`Card`, `Form`, `List`, `DetailView`) and a
   composable by hand, modelled on an existing entity's files.

## Customising the templates

| Template | Output | Edit when… |
|---|---|---|
| `mongodb/GenerateMongooseModel.egl` | per-EClass schema | Mongoose schema convention changes (e.g. add a virtual, an index, a hook) |
| `mongodb/GenerateMongooseService.egl` | per-entity service | CRUD method shape changes (e.g. add `findMany(filter)`) |
| `mongodb/GenerateMongooseController.egl` | per-entity controller | HTTP error shape or response convention changes |
| `mongodb/GenerateMongooseRouter.egl` | per-entity router | URL layout changes |

After editing a template, re-run the generator and inspect
`git status backend/runtime/` to see the resulting diff.

## Troubleshooting

- *"Compilation failure: jakarta.inject"* — that import was removed
  during Phase 1. If you see it, you have stale build artefacts. Run
  `mvn clean compile`.
- *"Template not found"* — templates live at
  `src/main/resources/transformation/mongodb/`. The classpath resolves
  template paths relative to `resources/`.
- *"Metamodel not found"* — verify `src/main/resources/metamodel/mogao_dt.ecore`
  exists and is valid Ecore XMI.
