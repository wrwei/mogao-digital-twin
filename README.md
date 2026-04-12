# Mogao Digital Twin

A Model-Driven Engineering (MDE) system for the Mogao Caves Digital Twin, a UNESCO World Heritage Site in Gansu, China.

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| **Design-time** | Java 17, Micronaut 4.2.3, Epsilon EGL/EOL, Eclipse EMF (Ecore) | Metamodel-driven code generation |
| **Runtime backend** | Node.js, Express.js, MongoDB, Mongoose | REST API + persistence |
| **Runtime frontend** | Vue 3 (CDN), Three.js, Chart.js, Axios | SPA with 3D visualisation |
| **Authentication** | JWT (jsonwebtoken), bcryptjs | Token-based auth with role system |

## Features

- **Model-Driven**: A single Ecore metamodel generates the entire backend (Mongoose models, Express routers, controllers, services) and frontend (Vue CRUD components, composables, i18n)
- **3D Visualisation**: Three.js-based viewer for OBJ/MTL heritage artefacts with real-time deterioration texture effects via Web Worker
- **Deterioration Simulation**: Four peer-reviewed conservation science models (chemical fading, lifetime multiplier, mould growth, salt crystallisation) computed server-side
- **Multilingual**: Chinese and English with reactive locale switching
- **Authentication**: JWT-based login with role system (admin, researcher, conservator, viewer, guest) and read-only guest access
- **8 Colour Themes**: Mogao Sand, Ocean Blue, Forest Green, Modern Slate, Royal Plum, Warm Ember, Midnight Dark, Sakura Blossom

## Quick Start

### Prerequisites

- Java 17+ and Maven 3.8+ (for code generation only)
- Node.js 18+ and npm (for runtime backend)
- MongoDB 5.0+ (running on localhost:27017)
- Python 3.x (for frontend dev server)

### 1. Generate Code from Metamodel

```bash
cd backend
./generate-code.bat   # Windows
./generate-code.sh    # Linux/Mac
```

This generates:
- **Backend**: Mongoose models, Express routers/controllers/services in `backend/generated/mongoose/`
- **Frontend**: Vue components, composables, app.js, i18n.js, index.html in `frontend/`

### 2. Start Backend Server

```bash
cd backend/generated/mongoose
npm install           # First time only
npm start             # Or: node server.js
```

Backend API available at: **http://localhost:8008**

### 3. Start Frontend Server

```bash
cd frontend
./start-frontend.bat   # Windows
./start-frontend.sh    # Linux/Mac
```

Frontend available at: **http://localhost:8009**

### 4. Access the Application

- **Frontend**: http://localhost:8009 (login or use guest access)
- **API**: http://localhost:8008 (REST endpoints)
- **Health check**: http://localhost:8008/health

## Project Structure

```
mogao-digital-twin/
├── backend/
│   ├── src/main/
│   │   ├── java/digital/twin/mogao/
│   │   │   ├── codegen/CodeGenerator.java    # Code generation driver
│   │   │   └── util/EpsilonModelManager.java # EMF model loader
│   │   └── resources/
│   │       ├── metamodel/mogao_dt.ecore      # Ecore metamodel
│   │       ├── models/instances/mogao.model   # Flexmi model instance
│   │       └── transformation/               # EGL templates
│   │           ├── backend/                  #   Java DTOs (design-time)
│   │           ├── mongodb/                  #   Mongoose/Express generation
│   │           └── frontend/                 #   Vue component generation
│   ├── generated/mongoose/                   # ← RUNTIME BACKEND
│   │   ├── server.js                         # Entry point (port 8008)
│   │   ├── app.js                            # Express app + middleware
│   │   ├── models/                           # Mongoose schemas (14)
│   │   ├── routers/                          # Express routers (15)
│   │   ├── controllers/                      # Request handlers (17)
│   │   ├── services/                         # Business logic (18)
│   │   │   └── DeteriorationService.js       # Scientific models
│   │   └── middleware/auth.js                # JWT + guest auth
│   └── pom.xml
│
├── frontend/
│   ├── index.html                            # Entry point (CDN imports)
│   ├── config.js                             # API URL configuration
│   ├── api.js                                # Axios wrapper
│   ├── app.js                                # Vue app (routing, auth, views)
│   ├── i18n.js                               # Internationalisation (zh + en)
│   ├── components/                           # Vue components (28 total)
│   │   ├── [Entity]Card/List/Form/Detail.js  # Generated CRUD (24)
│   │   ├── ModelViewer.js                    # Three.js 3D viewer
│   │   ├── SimulationPanel.js                # Deterioration simulation UI
│   │   └── SettingsView.js                   # User settings (Principia-style)
│   ├── composables/                          # Vue 3 composables (7)
│   ├── deterioration/DeteriorationEngine.js  # Client-side models (reference)
│   ├── workers/deterioration-worker.js       # Web Worker (texture processing)
│   └── css/                                  # Stylesheets
│
├── ARCHITECTURE.md                           # Full technical reference
└── README.md                                 # This file
```

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

## API Endpoints

All entity endpoints support CRUD + GID-based access with pagination (`?page=N&limit=N&sort=field`):

| Route | Description |
|-------|-------------|
| `/caves`, `/statues`, `/murals`, `/paintings`, `/inscriptions` | Heritage artefacts |
| `/defects` | Defect records |
| `/temperatures`, `/humidities`, `/lightIntensities` | Environmental readings |
| `/coordinates`, `/parameters`, `/assetReferences`, `/dTPackages` | Utility entities |
| `/users` | Authentication (login/register) + user management |
| `/deterioration` | Scientific deterioration models (assess, chemical, lifetime, mould, salt) |
| `/health` | Health check |
| `/api/upload` | File upload (3D models, textures) |

## Environment Variables (Runtime)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8008 | Backend port |
| `MONGO_URI` | `mongodb://localhost:27017/mogao_dt` | MongoDB connection |
| `JWT_SECRET` | Random (dev) / **required** (prod) | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:8009,...` | Allowed CORS origins |
| `NODE_ENV` | — | Set `production` to enforce JWT_SECRET |

## Documentation

- [System Architecture & Deterioration Models](ARCHITECTURE.md) — full technical reference
- [Deterioration Simulation Guide](frontend/DETERIORATION_SIMULATION.md) — Strlic dose-response framework
- [Mathematical Deterioration Models](deterioration%20models.md) — peer-reviewed model equations
- [i18n Guide](frontend/I18N_README.md) — multilingual support

## Troubleshooting

### Backend fails to start
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check port 8008 is free
- Run `npm install` in `backend/generated/mongoose/`

### Frontend not loading
- Regenerate code if components are missing
- Check backend is running (CORS errors indicate backend is down)
- Hard refresh browser (Ctrl+F5)

### 3D models not loading
- Ensure model files are in `backend/generated/mongoose/exhibit_models/`
- Check file extensions are allowed (.obj, .mtl, .glb, .gltf, .jpg, .png)

---

Built with Model-Driven Engineering for heritage conservation research.
