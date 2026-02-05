# 莫高窟数字孪生 Mogao Digital Twin

A Model-Driven Engineering (MDE) project for the Mogao Caves Digital Twin system.

## 🏗️ Architecture

- **Backend**: Java 17 + Micronaut framework
- **Frontend**: Vue 3 (vanilla JavaScript) + Three.js
- **Metamodel**: Eclipse EMF (Ecore)
- **Transformations**: Epsilon EGL templates
- **Model Instances**: Flexmi format

## ✨ Features

- **100% Model-Driven**: All DTOs, services, controllers, and frontend components are auto-generated from the Ecore metamodel
- **Multilingual Support**: Built-in i18n with Chinese (中文) and English
- **3D Visualization**: Three.js-based model viewer for heritage artifacts
- **REST API**: Full CRUD operations for caves, exhibits, defects, and environmental monitoring
- **Real-time Updates**: Reactive Vue 3 components with composition API

## 🚀 Quick Start

### Prerequisites

- Java 17 or higher
- Maven 3.8+
- Python 3.7+ (for frontend development server)

### 1. Generate Code from Metamodel

```bash
cd backend
./generate-code.bat   # Windows
# or
./generate-code.sh    # Linux/Mac
```

This generates:
- Backend: DTOs, Services, Controllers
- Frontend: Components, Composables, app.js, i18n.js, index.html

### 2. Start Backend Server

Open a terminal and run:

```bash
cd backend
./start-backend.bat   # Windows
# or
./start-backend.sh    # Linux/Mac
```

Backend will be available at: **http://localhost:8080**

### 3. Start Frontend Server

Open another terminal and run:

```bash
cd frontend
./start-frontend.bat   # Windows
# or
./start-frontend.sh    # Linux/Mac
```

Frontend will be available at: **http://localhost:8000**

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8080/api

## 📁 Project Structure

```
mogao-digital-twin/
├── backend/
│   ├── src/main/
│   │   ├── java/digital/twin/mogao/
│   │   │   ├── codegen/           # Code generation engine
│   │   │   ├── controller/        # Generated REST controllers
│   │   │   ├── dto/               # Generated Data Transfer Objects
│   │   │   ├── service/           # Generated service layer
│   │   │   └── util/              # Epsilon model manager
│   │   └── resources/
│   │       ├── metamodel/         # Ecore metamodel (mogao_dt.ecore)
│   │       ├── models/instances/  # Model instances (Flexmi)
│   │       ├── transformation/    # EGL templates
│   │       │   ├── backend/       # Backend code templates
│   │       │   └── frontend/      # Frontend code templates
│   │       └── application.yml    # Micronaut configuration
│   ├── generate-code.bat          # Code generation script (Windows)
│   ├── generate-code.sh           # Code generation script (Unix)
│   ├── start-backend.bat          # Start backend (Windows)
│   └── start-backend.sh           # Start backend (Unix)
│
├── frontend/
│   ├── components/                # Generated Vue components
│   │   ├── *Card.js              # Card display components
│   │   ├── *Form.js              # Form components
│   │   ├── *List.js              # List components
│   │   ├── *DetailView.js        # Detail view components
│   │   └── ModelViewer.js        # Manual: 3D model viewer
│   ├── composables/               # Generated Vue composables
│   ├── css/                       # Stylesheets
│   ├── styles/                    # Additional styles
│   ├── app.js                     # Generated: Main Vue app
│   ├── i18n.js                    # Generated: i18n resources
│   ├── index.html                 # Generated: HTML entry point
│   ├── start-frontend.bat         # Start frontend (Windows)
│   └── start-frontend.sh          # Start frontend (Unix)
│
└── README.md                      # This file
```

## 🔧 Development Workflow

### Modifying the Metamodel

1. Edit the metamodel: `backend/src/main/resources/metamodel/mogao_dt.ecore`
2. Update model instances if needed: `backend/src/main/resources/models/instances/`
3. Regenerate code: `cd backend && ./generate-code.bat`
4. Restart the backend server

### Modifying Templates

1. Edit EGL templates in `backend/src/main/resources/transformation/`
2. Regenerate code: `cd backend && ./generate-code.bat`
3. Refresh the frontend in your browser

### Adding New Entities

1. Add the entity class to `mogao_dt.ecore`
2. Add entity name to the list in `CodeGenerator.java` (entityClasses array)
3. Regenerate code
4. New REST endpoints and UI components will be created automatically

## 🌍 Internationalization (i18n)

The application supports multiple languages:
- **中文 (Chinese)**: Default language
- **English**: Secondary language

Switch languages using the 🇨🇳/🇬🇧 buttons in the app header.

### Adding New Languages

1. Edit `backend/src/main/resources/transformation/frontend/GenerateI18n.egl`
2. Add new language object to the messages structure
3. Regenerate code

## 🎨 Key Components

### Backend

- **CodeGenerator**: Main entry point for code generation
- **DTOs**: Auto-generated from Ecore classes
- **Services**: In-memory CRUD operations (can be replaced with database)
- **Controllers**: REST API endpoints with CORS support

### Frontend

- **Components**:
  - `*Card`: Display entity in card format
  - `*Form`: Create/edit entity forms
  - `*List`: List and search entities
  - `*DetailView`: Detailed view with 3D model support

- **Composables**: Vue 3 composables for API calls and state management
- **i18n**: Multilingual support with localStorage persistence
- **ModelViewer**: Three.js-based 3D model viewer (manual component)

## 📚 API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/caves` - List all caves
- `POST /api/caves` - Create new cave
- `GET /api/caves/{gid}` - Get cave by ID
- `PUT /api/caves/{gid}` - Update cave
- `DELETE /api/caves/{gid}` - Delete cave

Similar endpoints exist for:
- `/api/defects`
- `/api/statues`
- `/api/murals`
- `/api/paintings`
- `/api/inscriptions`

## 🔍 Technologies Used

### Backend
- **Micronaut 4.2.3**: Modern JVM framework
- **Eclipse EMF**: Ecore metamodeling
- **Epsilon**: Model transformation (EGL, EOL)
- **Jackson**: JSON serialization
- **SLF4J + Logback**: Logging

### Frontend
- **Vue 3**: Progressive JavaScript framework
- **Three.js**: 3D graphics library
- **ES Modules**: Modern JavaScript modules
- **CSS Variables**: Theming support

## 📝 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 🔗 Related Documentation

- [Frontend i18n Guide](frontend/I18N_README.md)
- [ModelViewer Integration Guide](frontend/MODEL_VIEWER_INTEGRATION.md)
- [Frontend Architecture Proposal](frontend-proposal.md)
- [Frontend Generation Proposal](frontend-generation-proposal.md)

## 🐛 Troubleshooting

### Backend fails to start
- Check if port 8080 is already in use
- Verify Java 17+ is installed: `java -version`
- Check Maven installation: `mvn -version`

### Frontend not loading components
- Regenerate code: `cd backend && ./generate-code.bat`
- Hard refresh browser (Ctrl+F5)
- Check browser console for errors

### 3D models not loading
- Ensure 3D model files are in `backend/src/main/resources/exhibit_models/`
- Check backend logs for file serving errors
- Verify CORS configuration in `application.yml`

---

**Built with Model-Driven Engineering** 🏛️✨
