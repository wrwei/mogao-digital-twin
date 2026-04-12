# Mogao Digital Twin - Backend

Model-driven backend using Eclipse EMF, Epsilon EGL, and a generated Node.js/Express/MongoDB runtime.

## Architecture

The backend has two layers:

1. **Design-time** (Java/Micronaut): Reads the Ecore metamodel and runs EGL templates to generate code
2. **Runtime** (Node.js/Express): The generated REST API server with MongoDB persistence

```
mogao_dt.ecore  →  EGL Templates  →  Generated Node.js Backend
                                     (models, routers, controllers, services)
```

## Quick Start

### 1. Build the Project (First Time)

```bash
mvn clean install
```

### 2. Generate Code from Metamodel

**Windows:**
```bash
generate-code.bat
```

**Linux/Mac:**
```bash
./generate-code.sh
```

This generates:
- **Node.js runtime** in `generated/mongoose/` (Mongoose models, Express routers, controllers, services)
- **Java DTOs** in `src/main/java/digital/twin/mogao/dto/` (design-time only)
- **Frontend components** in `../frontend/` (Vue Card, List, Form, DetailView, composables, app.js, i18n.js)

### 3. Start the Runtime Backend

```bash
cd generated/mongoose
npm install    # First time only
npm start      # Starts Express server on port 8008
```

### 4. Verify

```bash
curl http://localhost:8008/health
```

## Project Structure

```
backend/
├── src/main/
│   ├── java/digital/twin/mogao/
│   │   ├── codegen/CodeGenerator.java       # Code generation driver
│   │   ├── controller/                      # Micronaut controllers (design-time)
│   │   ├── service/                         # Micronaut services (design-time)
│   │   ├── dto/                             # Generated DTOs (design-time)
│   │   └── util/EpsilonModelManager.java    # EMF model loader
│   └── resources/
│       ├── metamodel/mogao_dt.ecore         # Ecore metamodel
│       ├── models/instances/mogao.model     # Flexmi model instance
│       ├── transformation/
│       │   ├── backend/                     # Java DTO/Service/Controller templates
│       │   ├── mongodb/                     # Mongoose/Express templates
│       │   ├── frontend/                    # Vue component templates
│       │   └── eol/                         # EOL helper operations
│       └── eol-scripts/                     # Domain-specific EOL operations
│
├── generated/mongoose/                      # ← RUNTIME BACKEND
│   ├── server.js                            # Entry point (port 8008)
│   ├── app.js                               # Express app + middleware + routes
│   ├── package.json                         # Node.js dependencies
│   ├── models/                              # Mongoose schemas (14 concrete + 8 abstract base classes)
│   ├── routers/                             # Express routers (16)
│   ├── controllers/                         # Request handlers (16)
│   ├── services/                            # Business logic (16)
│   │   └── DeteriorationService.js          # Scientific deterioration models
│   ├── middleware/auth.js                   # JWT + guest authentication
│   ├── util/jwt.js                          # JWT generation/verification
│   └── exhibit_models/                      # Uploaded 3D models + textures
│
├── pom.xml                                  # Maven (Micronaut 4.2.3, Epsilon 2.8.0, EMF 2.23.0)
├── generate-code.bat / .sh                  # Code generation scripts
├── clean-and-regenerate.bat / .sh           # Clean + regenerate scripts
└── start-backend.bat / .sh                  # Backend start scripts
```

## EGL Templates

### MongoDB/Express Generation

| Template | Output | Description |
|----------|--------|-------------|
| `GenerateMongooseModel.egl` | `models/*.js` | Mongoose schemas from EClasses |
| `GenerateExpressRouter.egl` | `routers/*.js` | CRUD + GID endpoints |
| `GenerateExpressController.egl` | `controllers/*.js` | Request handling |
| `GenerateExpressService.egl` | `services/*.js` | Business logic + queries |
| `GenerateExpressApp.egl` | `app.js` | Express app with middleware |
| `GenerateFileUploadController.egl` | File upload | Multer-based upload |
| `GenerateHealthController.egl` | Health check | GET /health |

### Frontend Generation

| Template | Output | Description |
|----------|--------|-------------|
| `GenerateVueCard.egl` | `components/*Card.js` | Entity card components |
| `GenerateVueList.egl` | `components/*List.js` | List + filtering |
| `GenerateVueForm.egl` | `components/*Form.js` | CRUD forms |
| `GenerateVueDetailView.egl` | `components/*DetailView.js` | Detail views |
| `GenerateComposable.egl` | `composables/use*.js` | API composables |
| `GenerateApp.egl` | `app.js` | Main Vue app |
| `GenerateI18n.egl` | `i18n.js` | i18n resources |
| `GenerateIndexHtml.egl` | `index.html` | HTML entry point |

## Runtime API

The generated Express backend exposes REST endpoints on port 8008:

- **Entity CRUD**: `/caves`, `/statues`, `/murals`, `/paintings`, `/inscriptions`, `/defects`
- **Polymorphic**: `/exhibits` (base type for all exhibit subtypes)
- **Environment**: `/temperatures`, `/humidities`, `/lightIntensities`
- **Utility**: `/coordinates`, `/parameters`, `/assetReferences`, `/dTPackages`
- **Auth**: `/users` (login, register, profile, admin user management)
- **Deterioration**: `/deterioration` (assess, chemical, lifetime, mould, salt, defaults)
- **Upload**: `/api/upload`, `/api/avatar` (inline in app.js)
- **Health**: `/health` (inline in app.js)

All entity endpoints support pagination (`?page=N&limit=N&sort=field`) and GID-based access (`/gid/:gid`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8008 | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/mogao_dt` | MongoDB connection |
| `JWT_SECRET` | Random (dev) / required (prod) | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:8009,...` | Allowed CORS origins |
| `NODE_ENV` | — | `production` enforces JWT_SECRET |

## Dependencies

### Design-Time (Java)
- Eclipse EMF 2.23.0
- Epsilon 2.8.0 (EOL, EGL, ETL, EVL)
- Micronaut 4.2.3
- Java 17

### Runtime (Node.js)
- Express 4.18.2
- Mongoose 8.0.0
- jsonwebtoken 9.0.3
- bcryptjs 3.0.3
- multer 1.4.5
- cors 2.8.5
- uuid 9.0.0

## Maven Goals

```bash
mvn clean compile      # Compile the project
mvn exec:java          # Run code generator
mvn clean install      # Full build
```
