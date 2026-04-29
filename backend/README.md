# Mogao Digital Twin — Backend

Model-driven backend for the Mogao Digital Twin. Source of truth is the
Ecore metamodel at
[src/main/resources/metamodel/mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore).
The runtime is **Node.js + Express + Mongoose** at
[generated/mongoose/](generated/mongoose/).

## Layout

```
backend/
├── src/main/                       Build-time generator (Java + Maven + Epsilon)
│   ├── java/digital/twin/mogao/
│   │   ├── codegen/CodeGenerator.java   Entry point for `mvn exec:java@codegen`
│   │   └── util/EpsilonModelManager.java
│   └── resources/
│       ├── metamodel/              Ecore metamodel (source of truth)
│       ├── models/instances/       Flexmi sample model instances
│       └── transformation/         EGL templates
│           ├── frontend/           Vue 3 component templates
│           ├── mongodb/            Mongoose backend templates (Phase 2 work)
│           └── eol/                EOL operation script templates
├── generated/mongoose/             Runtime backend (Node.js, hand-extended)
├── exhibit_models/                 3D model + texture assets served at /exhibit_models
├── pom.xml                         Maven config — Epsilon/EMF deps only
├── generate-code.bat / .sh         Codegen entry point (currently a no-op)
└── clean-and-regenerate.bat / .sh  Disabled in Phase 1 (would clobber live code)
```

## Runtime backend (Node.js)

The Mongoose backend at [generated/mongoose/](generated/mongoose/) is what
serves the application. It started life as auto-generated code emitted from
the metamodel; it has since been hand-extended with telemetry ingestion,
sensor admin, anomaly detection, the maintenance triage queue, deterioration
replay with caching, the per-exhibit defect log, and the validation harness.
Run it directly:

```bash
cd generated/mongoose
npm install
node server.js                    # listens on http://localhost:8008
```

Tests:

```bash
cd generated/mongoose
npm test                          # 110 Jest tests across 5 suites
```

## Code generator (Maven, build-time only)

The generator lives under `src/main/java/digital/twin/mogao/codegen/` and
is **not** the runtime — it is a build-time tool that reads the Ecore
metamodel and emits code via Epsilon EGL templates.

**Phase 1 (current state):**
- The Java/Micronaut runtime backend has been retired. `pom.xml` no
  longer pulls in Micronaut.
- The Java-targeting EGL templates (`transformation/backend/`) and their
  dispatch methods have been deleted.
- `mvn exec:java@codegen` is a no-op informational message.
- `generate-code.bat`/`.sh` invoke the codegen entry point but generate
  nothing.
- `clean-and-regenerate.bat`/`.sh` are disabled — they would have wiped
  load-bearing directories (most importantly `generated/mongoose/`).

**Phase 2 (next):**
- Redesign the Mongoose generation pipeline so it preserves
  hand-extended business logic via fenced extension regions.
- Wire frontend regeneration (`transformation/frontend/`) into the Java
  entry point so the Vue 3 components, composables, app.js, i18n, and
  index.html can be regenerated from the metamodel without losing the
  hand-extended `ModelViewer.js`, `SimulationPanel.js`, etc.

For ad-hoc Epsilon invocations against the metamodel today, see
[src/main/resources/transformation/RUN_TRANSFORMATIONS.md](src/main/resources/transformation/RUN_TRANSFORMATIONS.md).
