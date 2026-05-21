# Mogao Digital Twin — Backend

Model-driven backend for the Mogao Digital Twin. Source of truth is the
Ecore metamodel at
[src/main/resources/metamodel/mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore);
the runtime is **Node.js + Express + Mongoose** at
[runtime/](runtime/).

For a deep dive into the code generation pipeline (templates, what is /
isn't generated, how to add a new entity, common pitfalls), see
[CODEGEN.md](CODEGEN.md).

## Layout

```
backend/
├── src/main/                       Build-time generator (Java + Maven + Epsilon)
│   ├── java/digital/twin/mogao/
│   │   ├── codegen/CodeGenerator.java   Entry point for `mvn exec:java@codegen`
│   │   └── util/EpsilonModelManager.java Epsilon façade
│   └── resources/
│       ├── metamodel/              Ecore metamodel (source of truth)
│       ├── models/instances/       Flexmi sample model instances
│       └── transformation/
│           ├── mongodb/            Mongoose backend EGL templates
│           └── eol/                EOL operation script template (legacy)
├── runtime/             Runtime backend (Node.js)
├── exhibit_models/                 3D model + texture assets served at /exhibit_models
├── pom.xml                         Maven config — Epsilon/EMF deps only
└── generate-code.bat / .sh         Run the codegen
```

## Runtime backend (Node.js)

The Mongoose backend at [runtime/](runtime/) is what
serves the application. Some of it is auto-generated from the metamodel
(models, per-entity CRUD services, controllers, routers); a substantial
hand-written tier sits alongside the generated CRUD and consumes it
(telemetry ingestion, sensor admin, anomaly detection, the maintenance
triage queue, deterioration replay with caching, the per-exhibit defect
log, the validation harness, JWT auth, file upload). The directory name
reflects history, not current state — see [CODEGEN.md](CODEGEN.md) for
the precise scope of "generated".

Run it directly:

```bash
cd runtime
npm install
node server.js                    # listens on http://localhost:8008
```

Tests:

```bash
cd runtime
npm test                          # Jest suites against the live backend
```

## Code generator (Maven, build-time only)

```bash
cd backend
./generate-code.bat               # Windows
./generate-code.sh                # macOS/Linux
```

Both scripts run `mvn -q compile && mvn -q exec:java@codegen`. The
generator reads
[src/main/resources/metamodel/mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore)
and emits Mongoose models, services, controllers, and routers under
[runtime/](runtime/). It does **not** start the
server. After regen, inspect the diff with

```bash
git status runtime/
```

before committing — the generator overwrites unconditionally.

For the full pipeline description (templates, type mappings, inheritance
flattening, what's generated vs hand-written, how to add a new entity),
read [CODEGEN.md](CODEGEN.md).
