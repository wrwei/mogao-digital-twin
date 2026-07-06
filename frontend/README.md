# Mogao Digital Twin - Frontend

Vue 3 single-page application for the Mogao Digital Twin system, with 3D visualisation and deterioration simulation.

## Quick Start

### Prerequisites
- Python 3.x (for local development server)
- Backend running on `http://localhost:8008` (see `../backend/README.md`)

### Running

**Windows:**
```bash
start-frontend.bat
```

**Linux/Mac:**
```bash
./start-frontend.sh
```

Frontend available at: **http://localhost:8009**

## Technology Stack

- **Vue 3** (CDN) — progressive framework, no build step
- **Three.js 0.147.0** — 3D OBJ/MTL model rendering
- **Chart.js 4.4.1** — time-series deterioration charts
- **Axios 1.6.2** — HTTP client with JWT token management
- **ES Modules** — native browser modules, no bundler

## Project Structure

```
frontend/
├── index.html                    # Entry point (CDN imports)
├── config.js                     # API_BASE_URL configuration
├── api.js                        # Axios wrapper (all endpoints, auth interceptors)
├── app.js                        # Main Vue app (routing, auth, views, sidebar)
├── i18n.js                       # Internationalisation (zh + en)
│
├── components/                   # 56 Vue components
│   ├── CaveCard.js              #   ┐
│   ├── CaveList.js              #   │ Generated CRUD components
│   ├── CaveForm.js              #   │ (6 entities x 4 types = 24)
│   ├── CaveDetailView.js        #   ┘
│   ├── Defect*, Statue*, Mural*, Painting*, Inscription*
│   ├── ModelViewer.js           # Hand-written: Three.js 3D viewer
│   ├── SimulationPanel.js       # Hand-written: Deterioration simulation UI
│   └── SettingsView.js          # Hand-written: Profile, themes, admin
│
├── composables/                  # Vue 3 composables
│   └── useEntity.js             # Factory: shared CRUD/loading/error state per entity
│
├── workers/
│   └── effects-worker.js        # Single consolidated Web Worker for texture processing
│
├── css/
│   ├── main.css                 # Theme, layout, sidebar
│   ├── components.css           # Component styles
│   ├── forms.css                # Form styles
│   ├── drawers.css              # Drawer/modal styles
│   ├── simulation.css           # Simulation panel
│   └── login.css                # Login page hero
│
└── styles/
    ├── model-viewer.css         # 3D viewer styles
    ├── detail-view.css          # Detail view layout
    └── simulation-panel.css     # Advanced simulation panel
```

## Key Features

### Authentication
- JWT-based login with username/password
- Guest access (read-only, no login required)
- Token stored in localStorage, auto-attached via Axios interceptor
- Automatic logout on 401 response

### UI
- Collapsible sidebar navigation (M-Gemini branding)
- Dashboard with entity counts and quick actions
- 8 colour themes (Mogao Sand default)
- Bilingual (Chinese/English) with reactive switching
- Responsive layout

### 3D Viewer (`ModelViewer.js`)
- Three.js OBJ/MTL loading with texture support
- Orbit controls (rotate, zoom, pan)
- Automatic camera framing based on model bounding box
- Real-time deterioration texture effects via Web Worker

### Deterioration Simulation (`SimulationPanel.js`)
- Five peer-reviewed conservation science models (chemical fading, Michalski lifetime, VTT mould, salt crystallisation, hygro-mechanical fatigue)
- Environmental controls (temperature, humidity, light, exposure time)
- Time progression with play/pause
- Chart.js time-series visualisation
- Per-model toggle, configuration, and risk indicators
- Server-side computation via `POST /deterioration/assess`

### Settings (`SettingsView.js`)
- Profile management (name, email, avatar upload)
- Appearance (8 themes, font size, sidebar collapse)
- Language switching
- Notification preferences
- Admin panel (user management, database statistics)

## Provenance

The whole Vue 3 frontend is hand-written. There used to be EGL templates that emitted the entity Card / List / Form / DetailView components, but those templates were retired in Phase 1 — the components are now maintained by hand under `components/`. The codegen at `backend/src/main/java/digital/twin/mogao/codegen/CodeGenerator.java` is scoped to the Mongoose data layer and refuses to write outside `backend/runtime/`.

## API Integration

The frontend connects to the Express backend via `api.js`:

```javascript
import api from './api.js';

// Fetch all caves
const caves = await api.caves.getAll();

// Get by GID
const cave = await api.caves.getByGid('cave-001');

// Create
const newCave = await api.caves.create({ name: 'Cave 001', ... });

// Update
await api.caves.update('cave-001', updatedData);

// Delete
await api.caves.delete('cave-001');
```

## Backend Connection

- **API URL**: Configured in `config.js` (default: `http://localhost:8008`)
- **CORS**: Backend allows requests from `http://localhost:8009`
