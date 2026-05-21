# Mogao Digital Twin - Implementation Status

## Completed

### Model-Driven Code Generation
- [x] Ecore metamodel (`mogao_dt.ecore`) with full heritage domain hierarchy
- [x] Flexmi model instance (`mogao.model`) with sample cave/exhibit/defect data
- [x] Java CodeGenerator driver (`CodeGenerator.java`)
- [x] EpsilonModelManager for EMF model loading
- [x] Generation scripts (`generate-code.bat/sh`, `clean-and-regenerate.bat/sh`)

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
- [x] 14 Mongoose schemas (from metamodel EClasses)
- [x] 16 Express routers with CRUD + GID endpoints
- [x] 16 controllers and 16 services (file upload and health check are inline in app.js)
- [x] JWT authentication middleware with role system
- [x] Guest read-only access mode
- [x] Rate limiting on login endpoint
- [x] File upload (Multer) for 3D models and textures
- [x] Deterioration API (4 scientific models)
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
- [x] `deterioration-worker.js`, `pigment-deterioration-worker.js` — Web Workers for texture processing
- [x] `config.js` — API URL configuration
- [x] `useEntity.js` — Composable factory function

### Infrastructure
- [x] CSS styling system (main, components, drawers, forms, simulation, login)
- [x] Generation script backup/restore for manual components
- [x] Backend start scripts
- [x] Frontend start scripts

### ML Pigment Analysis System
- [x] `PigmentDatabase.js` — 8 Dunhuang pigment classes with per-pigment Arrhenius parameters, target/faded RGB
- [x] `PigmentIdentifier.js` — Model 1: pigment segmentation (HSV heuristic + TF.js model slot)
- [x] `PigmentRestorer.js` — Model 2: original colour reconstruction (colour-shift heuristic + TF.js U-Net slot)
- [x] `pigment-deterioration-worker.js` — Per-pigment texture fading Web Worker
- [x] `PigmentAnalysisPanel.js` — Vue UI: identify pigments, restore colours, display mode toggle
- [x] SimulationPanel integration — per-pigment Arrhenius computation, pigment data in emission payload
- [x] ModelViewer integration — pixel data capture, display modes (current/restored/pigment-map), pigment-aware worker dispatch
- [x] CaveList wiring — pixel-data-ready event, pixelData prop pass-through

## Summary

| Layer | Generated Files | Hand-Written Files |
|-------|:-:|:-:|
| Backend (Mongoose) | ~60 | 4 (auth, JWT, deterioration, file upload) |
| Frontend (Vue) | ~30 | 12 (ModelViewer, SimulationPanel, SettingsView, PigmentAnalysisPanel, ML models, etc.) |
| **Total** | **~90** | **16** |

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
- [ ] Trained TF.js models for PigmentIdentifier (MobileNet-v2 segmentation) and PigmentRestorer (U-Net)
- [ ] XRF/Raman spectroscopy ground-truth dataset for model training

---

Last Updated: 2026-04-11
