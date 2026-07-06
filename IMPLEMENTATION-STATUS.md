# Mogao Digital Twin - Implementation Status

## Completed

### Model-Driven Code Generation
- [x] Ecore metamodel (`mogao_dt.ecore`) with full heritage domain hierarchy
- [x] Flexmi model instance (`mogao.model`) with sample cave/exhibit/defect data
- [x] Java CodeGenerator driver (`CodeGenerator.java`)
- [x] EpsilonModelManager for EMF model loading
- [x] Generation scripts (`generate-code.bat/sh`)

### Backend EGL Templates
- [x] `GenerateDTO.egl` — Java Data Transfer Objects (design-time)
- [x] `GenerateService.egl` — Java services (design-time)
- [x] `mongodb/GenerateMongooseModel.egl` — Mongoose schemas (one per EClass)
- [x] `mongodb/GenerateMongooseService.egl` — CRUD services with `/gid/:gid` queries
- [x] `mongodb/GenerateMongooseController.egl` — HTTP request handlers
- [x] `mongodb/GenerateMongooseRouter.egl` — Express router declarations
- [x] `eol/GenerateEOLOperations.egl` — EOL operation scaffolding (currently dormant)

Frontend EGL templates were retired in Phase 1 — the Vue 3 frontend is hand-written end-to-end. The codegen refuses to write outside `backend/runtime/`.

### Generated Runtime Backend (Node.js/Express/MongoDB)
- [x] Express app with CORS, body parsing, static file serving
- [x] 26 Mongoose schema models (from metamodel EClasses, one per EClass incl. abstract)
- [x] 13 generated CRUD entities (a router + controller + service each), plus 8 hand-written domain routers/controllers
- [x] Hand-written domain services layered on top (deterioration, telemetry, replay, anomaly, maintenance, etc.); file upload and health check are inline in app.js
- [x] JWT authentication middleware with role system
- [x] Guest read-only access mode
- [x] Rate limiting on login endpoint
- [x] File upload (Multer) for 3D models and textures
- [x] Deterioration API (5 scientific models)
- [x] Health check endpoint

### Frontend (Vue 3 SPA — hand-written end-to-end)

The Vue frontend is no longer generated. The codegen scope is the Mongoose data layer only; everything under `frontend/` is hand-written.

- [x] Per-entity Card / List / Detail / Form components for Cave, Statue, Mural, Painting, Inscription, Defect
- [x] `useEntity` composable factory (callers pass entity name + plural + api key)
- [x] Application shell: `app.js` (AppContainer), `AppSidebar`, `AppTopbar`, `DashboardView`, `LoginPage`
- [x] i18n module with Chinese/English and reactive locale switching
- [x] Axios API layer with JWT token management
- [x] `ModelViewer.js` — Three.js 3D model viewer (OBJ/MTL loading, orbit controls)
- [x] `SimulationPanel.js` + `SimulationEngine.js` — Deterioration simulation UI + state singleton
- [x] `PigmentAnalysisPanel.js` + `PigmentAnalysis.js` — Pigment-domain module (identification, restoration, worker dispatch)
- [x] `SettingsView.js` + ProfileSection / AppearanceSection / UserManagementPanel / DatabaseStatsPanel
- [x] `LiveDataPanel.js`, `PredictionPanel.js`, `MaintenanceQueue.js`, `SensorDashboard.js`
- [x] `effects-worker.js` — single consolidated Web Worker for texture processing
- [x] `config.js` — API URL configuration
- [x] `useEntity.js` — Composable factory function

### Infrastructure
- [x] CSS styling system (main, components, drawers, forms, simulation, login)
- [x] Generation script backup/restore for manual components
- [x] Backend start scripts
- [x] Frontend start scripts

### Pigment Analysis System (HSV heuristic, no ML wired in)
- [x] `frontend/pigment/PigmentDatabase.js` — 8 Dunhuang pigment classes with Arrhenius params, target/faded RGB, and optional agingTint per pigment
- [x] `frontend/pigment/PigmentIdentifier.js` — HSV decision-tree classifier
- [x] `frontend/pigment/PigmentAnalysis.js` — single seam: identify, compute per-pigment params, dispatch the worker
- [x] `frontend/workers/effects-worker.js` — single consolidated worker; per-pigment texture fading (uses `agingTint` from PigmentDatabase, not hard-coded class IDs)
- [x] `frontend/components/PigmentAnalysisPanel.js` — identify button + display-mode toggle + legend
- [x] SimulationEngine + ModelViewer integration via PigmentAnalysis module (no PigmentRestorer; restoration is not part of the current system)

## Summary

| Layer | Generated | Hand-Written |
|-------|:-:|:-:|
| Backend (Mongoose data layer) | 26 schema models + 13 CRUD entities (router + controller + service each) | Domain tier (deterioration, telemetry, replay, anomaly, maintenance), 8 domain routers/controllers, auth, JWT, file upload |
| Frontend (Vue) | none (frontend is hand-written end-to-end) | 56 components + composables, workers, i18n, app shell |

## Potential Enhancements

- [ ] Docker Compose for backend + MongoDB
- [ ] Additional languages (French, Japanese)
- [ ] CIELAB colour space for accurate deterioration delta-E
- [x] ~~Pigment-specific deterioration parameter sets~~ (implemented in PigmentDatabase.js)
- [ ] Non-uniform degradation (crack patterns, moisture gradients)
- [ ] Photo upload for exhibits and defects
- [ ] Real-time WebSocket updates
- [ ] Data export functionality
- [ ] Advanced filtering and search
- [ ] Replace the HSV pigment classifier with a trained model (e.g. MobileNet-v2 head) — `ml/inpainting/` has a partial PyTorch starter but no exporter / loader wired into the runtime
- [ ] XRF / Raman spectroscopy ground-truth dataset for training the above

---

Last Updated: 2026-04-11
