# Mogao Digital Twin - Frontend

Vue.js-based frontend for the Mogao Digital Twin system.

## 🚀 Quick Start

### Prerequisites
- Python 3.x (for local development server)
- Backend server running on `http://localhost:8080`

### Running the Frontend

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

The frontend will be available at: **http://localhost:8002**

## 📁 Project Structure

```
frontend/
├── index.html              # Main HTML file
├── app.js                  # Vue app initialization
├── api.js                  # API service layer
│
├── components/             # Vue components
│   ├── Cave/              # Cave management components
│   ├── Exhibit/           # Exhibit management components
│   ├── Defect/            # Defect tracking components
│   ├── Environment/       # Environmental monitoring
│   ├── Statistics/        # Analytics dashboard
│   ├── Layout/            # Layout components
│   └── Common/            # Reusable components
│
├── composables/           # Vue composition functions
├── store/                 # State management (optional)
├── css/                   # Stylesheets
├── models/                # 3D models
├── images/                # Icons and textures
└── utils/                 # Utility functions
```

## 🛠️ Technology Stack

- **Vue 3** - Progressive JavaScript framework (CDN-based, no build step)
- **A-Frame 1.7.0** - 3D/VR visualization
- **Chart.js 4.4.0** - Data visualization
- **Axios 1.6.2** - HTTP client
- **Python HTTP Server** - Development server

## 🔌 Backend Integration

The frontend connects to the Micronaut backend REST API:

- **Base URL**: `http://localhost:8080`
- **Endpoints**: `/caves`, `/defects`, `/statues`, `/murals`, `/paintings`, `/inscriptions`

## 📝 Development Notes

### CDN-Based Approach
- No build tools required (npm, webpack, etc.)
- All dependencies loaded via CDN
- Components use inline templates
- Modules loaded with `<script type="module">`

### Component Development
- Components are defined as plain JavaScript objects
- Use Vue 3 Composition API or Options API
- Export as ES modules

### API Usage
```javascript
// Using the API service
import api from './api.js';

// Fetch all caves
const caves = await api.caves.getAll();

// Create a new cave
const newCave = await api.caves.create({ name: 'Cave 001', ... });
```

## 🎨 Styling

- **CSS Variables** - Customizable theme colors
- **Responsive Design** - Mobile, tablet, desktop support
- **Component Styles** - Modular CSS organization

## 📚 Features

### Implemented
- ✅ Basic project structure
- ✅ Vue 3 app initialization
- ✅ API service layer
- ✅ 3D scene with A-Frame
- ✅ Responsive layout
- ✅ CSS styling system

### In Progress
- 🚧 Cave management components
- 🚧 Exhibit management components
- 🚧 Defect tracking system
- 🚧 Environmental monitoring
- 🚧 Statistics dashboard

### Planned
- ⏳ 3D model loading
- ⏳ Real-time updates
- ⏳ Data export functionality
- ⏳ Photo upload support
- ⏳ Advanced filtering

## 🤝 Contributing

1. Create feature components in appropriate directories
2. Follow Vue 3 best practices
3. Use composition API for new components
4. Maintain consistent styling

## 📄 License

Part of the Mogao Digital Twin project.

## 🔗 Links

- Backend: `../backend/`
- Proposal: `../frontend-proposal.md`
