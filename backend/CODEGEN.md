# Backend Code Generation

The Mongoose data layer at [runtime/](runtime/) is
emitted from the Ecore metamodel at
[src/main/resources/metamodel/mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore)
via Epsilon EGL templates. This document covers what is generated, what is
hand-written, and how the pipeline works end-to-end.

The runtime backend is Node.js + Express + Mongoose; the generator is Java +
Maven + Epsilon and runs only at build time. The two are deliberately
separate processes — `mvn` never starts the server, and `node server.js`
never invokes the generator.

## What is generated

For **every** EClass in the metamodel (concrete and abstract):

- `runtime/models/<ClassName>.js` — Mongoose schema with the
  full inheritance chain flattened in.

Plus once per regen:

- `runtime/models/index.js` — re-exports every schema.

For **each concrete EClass listed in the `entityClasses` array** of
[CodeGenerator.java](src/main/java/digital/twin/mogao/codegen/CodeGenerator.java)
(currently 13 entities: Cave, Defect, Statue, Mural, Painting, Inscription,
Coordinates, Parameter, AssetReference, DTPackage, Temperature, Humidity,
LightIntensity):

- `runtime/services/<ClassName>Service.js` — CRUD against the
  Mongoose model; `create` mints a server-side gid.
- `runtime/controllers/<ClassName>Controller.js` — HTTP handlers
  that delegate to the service and shape the response.
- `runtime/routers/<className>Router.js` (camelCase filename) —
  Express router wiring methods to routes.

## What is *not* generated (and why)

The generator never touches:

- `runtime/app.js`, `server.js`, `package.json` — wire MongoDB,
  CORS, file upload, JWT auth, and bootstrap. Hand-written infrastructure.
- `runtime/services/index.js`,
  `runtime/controllers/index.js`,
  `runtime/routers/index.js` — re-export aggregators with manual
  ordering decisions (e.g. `/gid/:gid` registered before `/:id`).
  **Adding a new entity to the metamodel requires manually adding it to
  these three index files** — the generator deliberately doesn't overwrite
  them because they encode load-bearing decisions that aren't visible in
  the metamodel.
- Hand-written services for entities that are **not** in the metamodel:
  `User`, `Sensor`, `EnvironmentSample` (the live telemetry record vs. the
  per-exhibit `EnvironmentCondition` summary in the metamodel).
- Cross-cutting domain services that **consume** generated CRUD but aren't
  themselves CRUD: `AnomalyDetectionService`, `MaintenanceService`,
  `TelemetryService`, `DeteriorationReplayService`,
  `DeteriorationService`, `ValidationHarness`. Same for their controllers
  and routers.
- The Vue 3 frontend at [../frontend/](../frontend/). Frontend EGL
  templates were retired in commit `9b33bc4`; the UI is hand-written by
  design (see `architecture_decisions.md` in the memory directory).

A lot of `runtime/` is thus *not* generator output. The path
name reflects history, not current state — the directory is a mix of
generator output and load-bearing hand-written code that consumes it.

## The pipeline

```
mogao_dt.ecore  ──┐
(metamodel)       │
                  ▼
        CodeGenerator.java                    (Java entry point)
            │
            │  for each EClass:
            │     params = { eClass: <EClass> }
            │     EpsilonModelManager.executeEglTemplateWithoutModel(...)
            ▼
        EGL template engine                   (Epsilon — Eclipse runtime)
            │
            │  reads template, evaluates [%%-blocks against params,
            │  emits text
            ▼
        runtime/<file>.js          (filesystem)
```

`executeEglTemplateWithoutModel` is the key entry: it spins up an
`EglTemplateFactory` with no model loaded (only the metamodel's `EClass`
in the frame stack as `eClass`). The template walks `eClass.eAllAttributes`
and `eClass.eAllReferences` to flatten the full inheritance chain — this
is what lets a single template emit a schema for a deeply-derived class
like `Statue` (DTElement → ModelElement → Object → HeritageArtifact →
Exhibit → Statue).

## The metamodel

[mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore) is the
serialized form; [mogao_dt.emf](src/main/resources/metamodel/mogao_dt.emf)
is the human-editable Emfatic equivalent that round-trips with the .ecore.
Edit the .emf if you have the Emfatic tooling, otherwise edit the .ecore
XML directly — the generator only reads the .ecore.

Inheritance hierarchy (abstract classes in italics):

- *DTElement* (gid)
  - *UtilityElement*
    - Coordinates, Parameter, AssetReference
  - *ModelElement* (name, description)
    - *Object* (reference, coordinates)
      - *HeritageArtifact* (label, period, defects, environmentConditions)
        - Cave (exhibits)
        - *Exhibit* (material, conservationStatus)
          - Statue, Mural, Painting, Inscription
      - Defect, *EnvironmentCondition*
        - Temperature, Humidity, LightIntensity
    - *Package*
      - DTPackage

Five enums: `Unit`, `ConservationStatus`, `DefectType`, `DefectSeverity`,
plus the empty `Unit` literal. All enums are stored as `String` in
Mongoose with an `enum: [...]` constraint.

## The templates

All under [src/main/resources/transformation/mongodb/](src/main/resources/transformation/mongodb/).

### `GenerateMongooseModel.egl` — schema per EClass

Reads `eClass.eAllAttributes` and `eClass.eAllReferences` (the `eAll*`
forms walk the full inheritance chain). Maps:

| Ecore type | Mongoose type |
|---|---|
| EString, EChar, ECharacterObject | `String` |
| EInt, EDouble, EFloat, ELong, EByte, EShort + Object variants | `Number` |
| EBoolean, EBooleanObject | `Boolean` |
| EDate | `Date` |
| EEnum | `String` with `enum: [literal, ...]` |
| references with `containment="true"` | `Schema.Types.Mixed` (embedded) |
| non-containment references | `Schema.Types.ObjectId` with `ref: ...` |

Multi-valued references (`isMany()`) are wrapped in arrays.

The collection name is derived by an inline `pluralize()` operation — most
classes get `+ s`/`+ es`/`+ ies` suffixes, with `Coordinates` hard-coded as
its own irregular plural.

Abstract classes export only the schema (`module.exports = { XSchema }`);
concrete classes additionally export a model (`mongoose.model('X', schema)`)
so they can be queried directly.

**Why flatten inheritance?** Mongoose discriminators don't support deep
inheritance chains. Trying to model `Statue extends Exhibit extends
HeritageArtifact extends Object extends ModelElement extends DTElement` as
nested discriminators breaks down past the second level. Flattening
trades the modelling purity for a layout that Mongoose's query and
populate engines can actually handle.

### `GenerateMongooseService.egl` — CRUD per concrete class

Emits an object literal with `create`, `getAll`, `getById`, `getByGid`,
`update`, `delete`, `updateByGid`, `deleteByGid`. The interesting bits:

- `create` always generates the gid server-side as
  `<varname>-<timestamp>-<random6>` and strips any client-supplied `_id`,
  to prevent client-controlled collisions.
- `getAll` accepts optional `{ page, limit, sort }` for pagination + sort.
- The `getByGid` family exists because the frontend uses gids for
  deep-links (`#/caves/cave-001`); the `_id` family exists because some
  hand-written services join on Mongo ObjectIds.

### `GenerateMongooseController.egl` — HTTP layer per concrete class

One function per service method. Always returns 201 on create, 404 when
the service returns null, and a 500 with the error message in JSON
otherwise. No middleware injection — auth and request validation live in
hand-written Express middleware (`runtime/middleware/`).

### `GenerateMongooseRouter.egl` — Express router per concrete class

Wires the eight controller methods to routes. The `/gid/:gid` routes are
registered **before** the `/:id` routes; the comment in the template
calls this out explicitly because Express would otherwise interpret the
literal string `gid` as a Mongo ObjectId and reach the wrong handler.

The router *file* is named camelCase (`statueRouter.js`) but the *export*
is `module.exports = router` — the index.js re-exporter is the place that
maps router filenames to URL prefixes.

### `GenerateAllMongooseModels.egl` (legacy)

Earlier all-in-one variant; kept for reference but not invoked from
`CodeGenerator.main()`. The active path is one model per EClass.

## The Java entry point

[CodeGenerator.java](src/main/java/digital/twin/mogao/codegen/CodeGenerator.java)
loads the metamodel via EMF's `XMIResourceFactoryImpl`, then iterates
`metamodel.getEClassifiers()` twice:

1. First pass: every EClass → `GenerateMongooseModel.egl` →
   `models/<Name>.js`. The class-by-class loop also accumulates the
   `models/index.js` re-export string.
2. Second pass: only the names in the `entityClasses` array →
   `GenerateMongooseService.egl`, `GenerateMongooseController.egl`,
   `GenerateMongooseRouter.egl`.

[EpsilonModelManager.java](src/main/java/digital/twin/mogao/util/EpsilonModelManager.java)
is the thin façade over Epsilon's `EglTemplateFactory`. The hot path is
`executeEglTemplateWithoutModel(templatePath, parameters)` — it pushes
the `eClass` parameter onto the frame stack and processes the template
with no loaded EMF model instance, only the metamodel itself.

The other methods on the manager (`loadModel`, `executeEolScript`,
`executeBatchOperations`, etc.) date from when the codegen also operated
on a live `models/instances/mogao.model` for EOL-driven mutations. The
runtime no longer needs them, but they're left in place because removing
them would force a Maven dependency prune and the cost-benefit doesn't
yet justify it.

## Running the generator

```bash
cd backend
./generate-code.bat        # Windows
./generate-code.sh         # macOS/Linux
```

Both scripts run `mvn -q compile` then `mvn -q exec:java@codegen`. The
`@codegen` execution is configured in [pom.xml](pom.xml) and points at
`digital.twin.mogao.codegen.CodeGenerator`. The script then prints

> `Done. Run \`git status backend/runtime/\` to inspect changes.`

That `git status` step is non-optional in practice — the generator
overwrites the model/service/controller/router files unconditionally, so
diffs against the previous run are how you confirm a metamodel change had
the expected blast radius.

## Workflows

### Adding a new entity type

1. Add the EClass to [mogao_dt.emf](src/main/resources/metamodel/mogao_dt.emf)
   (or directly to the .ecore). Decide its supertype — does it extend
   `Object` (positioned in 3D), `HeritageArtifact` (has defects + env
   conditions), `Exhibit` (lives inside a Cave), or something flatter?
2. If the .emf was edited, regenerate the .ecore from it. (If you edited
   the .ecore directly, skip this.)
3. Add the EClass name to the `entityClasses` array in `CodeGenerator.java`
   if it's concrete and needs CRUD endpoints.
4. Run `./generate-code.bat` (or `.sh`).
5. Manually add the new entity to:
   - `runtime/services/index.js`
   - `runtime/controllers/index.js`
   - `runtime/routers/index.js` (this also picks the URL prefix)
   - `runtime/app.js` (mounts the router on its prefix)
6. Restart `node server.js` and exercise the new endpoints.

### Modifying a template

1. Edit the relevant `.egl` under
   [src/main/resources/transformation/mongodb/](src/main/resources/transformation/mongodb/).
2. Run `./generate-code.bat` (or `.sh`).
3. `git diff backend/runtime/` to verify the change applied
   to every entity, not just the one you were thinking about.
4. Run `cd runtime && npm test` to confirm the Jest suite
   still passes against the regenerated layer.

### Modifying the metamodel without breaking hand-written services

The hand-written services
(`AnomalyDetectionService`, `MaintenanceService`, `TelemetryService`,
`DeteriorationReplayService`, `DeteriorationService`, `ValidationHarness`)
import from generated services and models. A metamodel change that:

- Renames a field → hand-written services that referenced the old name
  break. Search `runtime/services/` for the old name before
  regenerating.
- Removes a field → same failure mode, plus the seed/test data may have
  to be updated.
- Adds a field → safe; existing code ignores it.
- Changes a field's type → search for casts/comparisons. Type changes
  on enum literals are particularly noisy because the literal strings
  appear in seed data.

There is no compiler to catch these for you — the runtime is JavaScript
and the only pre-flight is `npm test` against the Jest suite.

## Common pitfalls

- **"Why are my changes to `services/index.js` getting reverted?"** —
  They aren't. The generator never writes to that file. If yours
  disappeared, check `git log -- runtime/services/index.js`.
- **"Why does the generated schema have a duplicate field?"** — A child
  class redeclared an attribute already on the parent. EMF allows it; the
  flattener just emits both. Fix it in the metamodel.
- **"Why is the schema for an abstract class also written to disk?"** —
  Because `models/index.js` re-exports it for use as a base type by
  hand-written code. Abstract schemas don't get a `mongoose.model(...)`
  call but the schema itself is reused.
- **"Why doesn't the Vue frontend regenerate?"** — Frontend codegen was
  retired (commit `9b33bc4`). The Vue 3 frontend at `../frontend/` is
  hand-written end-to-end; the EGL templates that used to emit it are
  gone. Don't try to bring them back without reading the architectural
  decision.
