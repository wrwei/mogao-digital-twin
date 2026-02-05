# Mogao Digital Twin - Frontend Proposal

## Investigation Summary

### Existing Frontend (model-based-resolver)

**Technology Stack:**
- **A-Frame v1.7.0** - WebVR/3D framework for 3D visualization
- **Vanilla JavaScript** - No React/Vue/Angular
- **Chart.js** (for signal visualization)
- **Python HTTP Server** - Simple static file server (port 8001)
- **REST API Integration** - Connects to backend at `http://localhost:8080/api/resolver`

**Key Features:**
1. **3D Visualization** - A-Frame scene displaying 3D models (.obj/.mtl files)
2. **Parameter Configuration** - Sidebar drawers for parameter settings
3. **Real-time Data Visualization** - Charts for signals and data
4. **Simulation Controls** - Start/stop/reset simulation
5. **Data Export** - Export simulation results
6. **Responsive Drawers** - Side panels for different settings

**File Structure:**
```
frontend/
├── index.html              # Main HTML file
├── app.js                  # Main application logic + API calls
├── styles.css              # Main styles
├── drawer-styles.css       # Drawer/sidebar styles
├── model/                  # 3D models (.obj, .mtl)
├── images/                 # Image assets
├── *.js                    # Feature modules (charts, signals, etc.)
└── start.bat               # Python HTTP server launcher
```

---

## Proposed Frontend for Mogao Digital Twin

### Technology Stack (Vue.js-based)
- **Vue 3** - Progressive JavaScript framework for reactive UI
  - **Composition API** - Modern Vue development approach
  - **CDN-based** - No build step required (keep it simple)
  - **Vue Router** - Client-side routing (optional, can use CDN)
- **A-Frame v1.7.0** - For 3D cave and artifact visualization
  - **aframe-vue** - Integration between A-Frame and Vue
- **Chart.js** - For defect statistics, environmental data
- **Axios** - HTTP client for API calls (or fetch API)
- **Three.js** (via A-Frame) - Advanced 3D rendering
- **Python HTTP Server** - Port 8002 (8001 is used by resolver)

### Backend Integration
- **REST API**: `http://localhost:8080/caves`, `/defects`, `/statues`, etc.
- **Micronaut Controllers**: Use the generated REST endpoints

### Why Vue.js?
- ✅ **Reactive data binding** - Automatic UI updates when data changes
- ✅ **Component-based** - Reusable cave/exhibit/defect components
- ✅ **Better for CRUD-heavy apps** - Forms, lists, filters made easy
- ✅ **Two-way data binding** - Simplified form handling
- ✅ **Simple CDN setup** - No build tools needed
- ✅ **Easier state management** - Reactive data store

---

## Proposed Features

### 1. **3D Cave Visualization**
- **Main Scene**: 3D representation of Mogao caves
- **Navigation**: Click on caves to explore exhibits inside
- **Camera Controls**: Orbit, pan, zoom around caves
- **Interactive Exhibits**: Click on statues/murals/paintings to view details

### 2. **Cave Management Dashboard**
- **Cave List**: Display all caves with metadata
- **Cave Details**: Name, description, dimensions, exhibits count
- **Add/Edit/Delete**: CRUD operations for caves
- **Filter & Search**: Find caves by criteria

### 3. **Exhibit Management**
- **Exhibit Browser**: View all exhibits (statues, murals, paintings, inscriptions)
- **Exhibit Details**: Type-specific information
  - **Statues**: Material, height, deity/figure
  - **Murals**: Width, height, theme
  - **Paintings**: Technique, colors
  - **Inscriptions**: Language, text content
- **Conservation Status**: Visual indicators for status
- **3D Models**: Load and display exhibit 3D models if available

### 4. **Defect Tracking & Visualization**
- **Defect Map**: Visualize defects on exhibits using coordinates
- **Defect List**: Table view with filters (type, severity, status)
- **Defect Details**: Type, severity, description, coordinates
- **Visual Indicators**: Color-coded markers on 3D models
- **Add Defect**: Click on 3D model to add defect with coordinates

### 5. **Environmental Monitoring**
- **Real-time Charts**: Temperature, humidity, light intensity
- **Historical Data**: Time-series graphs
- **Cave-specific**: View conditions per cave
- **Alerts**: Visual warnings for out-of-range conditions

### 6. **Statistics & Analytics**
- **Overview Dashboard**: Total caves, exhibits, defects
- **Defect Statistics**: Pie charts by type, severity
- **Conservation Progress**: Track repair/restoration status
- **Timeline**: Historical changes and updates

---

## Proposed File Structure (Vue.js)

```
frontend/
├── index.html                      # Main HTML file with Vue app mount point
├── app.js                          # Vue app initialization & configuration
├── api.js                          # API service layer (Axios/fetch wrapper)
│
├── components/                     # Vue components
│   ├── Cave/
│   │   ├── CaveList.js            # Cave list component
│   │   ├── CaveCard.js            # Individual cave card
│   │   ├── CaveDetails.js         # Cave detail view
│   │   ├── CaveForm.js            # Create/Edit cave form
│   │   └── CaveScene.js           # 3D scene for cave
│   │
│   ├── Exhibit/
│   │   ├── ExhibitList.js         # Exhibit browser
│   │   ├── ExhibitCard.js         # Exhibit card component
│   │   ├── ExhibitDetails.js      # Type-specific exhibit details
│   │   ├── ExhibitForm.js         # Create/Edit exhibit form
│   │   └── ExhibitTypes.js        # Statue/Mural/Painting/Inscription
│   │
│   ├── Defect/
│   │   ├── DefectList.js          # Defect table/list
│   │   ├── DefectCard.js          # Defect card component
│   │   ├── DefectForm.js          # Create/Edit defect
│   │   ├── DefectMap.js           # Visual defect mapping on 3D
│   │   └── DefectFilters.js       # Filter controls
│   │
│   ├── Environment/
│   │   ├── EnvironmentMonitor.js  # Main environmental dashboard
│   │   ├── TemperatureChart.js    # Temperature visualization
│   │   ├── HumidityChart.js       # Humidity visualization
│   │   └── LightChart.js          # Light intensity visualization
│   │
│   ├── Statistics/
│   │   ├── Dashboard.js           # Main statistics dashboard
│   │   ├── DefectStats.js         # Defect statistics charts
│   │   └── ConservationProgress.js # Conservation tracking
│   │
│   ├── Layout/
│   │   ├── AppHeader.js           # Top navigation bar
│   │   ├── Sidebar.js             # Left sidebar component
│   │   ├── Drawer.js              # Sliding drawer component
│   │   └── Modal.js               # Modal dialog component
│   │
│   └── Common/
│       ├── LoadingSpinner.js      # Loading indicator
│       ├── ErrorMessage.js        # Error display
│       ├── ConfirmDialog.js       # Confirmation dialog
│       └── SearchBar.js           # Search/filter component
│
├── composables/                    # Vue composition functions
│   ├── useCaves.js                # Cave data & operations
│   ├── useExhibits.js             # Exhibit data & operations
│   ├── useDefects.js              # Defect data & operations
│   ├── useEnvironment.js          # Environmental data
│   └── useApi.js                  # API helper composable
│
├── store/                          # State management (optional)
│   ├── index.js                   # Root store
│   ├── caves.js                   # Cave state
│   ├── exhibits.js                # Exhibit state
│   └── app.js                     # App-wide state
│
├── css/
│   ├── main.css                   # Global styles
│   ├── components.css             # Component styles
│   ├── drawers.css                # Drawer/sidebar styles
│   ├── forms.css                  # Form styles
│   └── charts.css                 # Chart container styles
│
├── models/                         # 3D models
│   ├── caves/                     # Cave 3D models
│   └── exhibits/                  # Exhibit 3D models
│
├── images/                         # Icons, textures, photos
│   ├── icons/                     # UI icons
│   └── textures/                  # 3D textures
│
├── utils/                          # Utility functions
│   ├── coordinates.js             # Coordinate system helpers
│   ├── validators.js              # Form validation
│   └── formatters.js              # Data formatting
│
├── start.bat                       # Windows launcher
└── start.sh                        # Linux/Mac launcher
```

### Component Organization Note
- Using inline templates in separate `.js` files (no build step)
- Each component is a self-contained module
- Can be loaded via `<script type="module">` or individual script tags

---

## UI Layout Concept

### Main Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Mogao Digital Twin]           [统计] [设置] [导出]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [洞窟列表]                    3D Scene                       │
│  ├ Cave 001                   (A-Frame)                      │
│  ├ Cave 045                                                  │
│  ├ Cave 096                 Interactive                      │
│  └ Cave 254                 3D View                         │
│                                                               │
│                            ┌──────────────┐                  │
│                            │ Cave Details │                  │
│                            │ Exhibits     │                  │
│  [⚙️ 洞窟设置]             │ Defects      │                  │
│  [🎨 展品管理]             │ Environment  │                  │
│  [⚠️ 缺陷追踪]             └──────────────┘                  │
│  [🌡️ 环境监测]                                              │
│  [📊 统计分析]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar Drawers (Slide from sides)
- **Left**: Cave/Exhibit list and navigation
- **Right**: Details panel, forms, charts
- **Bottom**: Environmental monitoring timeline

---

## Implementation Plan (Vue.js)

### Phase 1: Vue Setup & Infrastructure (Week 1)
1. ✅ Create frontend directory structure
2. ✅ Set up index.html with Vue 3 (CDN)
3. ✅ Initialize Vue app with basic layout components
4. ✅ Create API service layer (api.js with composables)
5. ✅ Test connection to backend REST endpoints
6. ✅ Set up A-Frame integration with Vue
7. ✅ Create basic CSS styling and layout components
8. ✅ Create start.bat and start.sh

### Phase 2: Cave Management Components (Week 1-2)
1. ✅ Create CaveList component with reactive data
2. ✅ Implement CaveCard component
3. ✅ Build CaveDetails component
4. ✅ Create CaveForm component (Add/Edit)
5. ✅ Integrate with `/caves` API endpoint using composables
6. ✅ Implement CaveScene component (3D visualization)
7. ✅ Add search/filter functionality

### Phase 3: Exhibit Management Components (Week 2)
1. ✅ Create ExhibitList component
2. ✅ Build type-specific exhibit components
3. ✅ Implement ExhibitDetails component
4. ✅ Create ExhibitForm with type switching
5. ✅ Integrate with exhibit endpoints
6. ✅ Add exhibits to 3D scene

### Phase 4: Defect Tracking Components (Week 2-3)
1. ✅ Create DefectList component with filters
2. ✅ Build DefectCard component
3. ✅ Implement DefectForm component
4. ✅ Create DefectMap component (3D visualization)
5. ✅ Add coordinate system for defect placement
6. ✅ Implement visual markers (color-coded by severity)
7. ✅ Add click-to-create defect functionality

### Phase 5: Environmental Monitoring (Week 3)
1. ✅ Create EnvironmentMonitor component
2. ✅ Build Chart.js integration components
3. ✅ Implement real-time data display with Vue reactivity
4. ✅ Create historical data timeline
5. ✅ Add alert system for threshold breaches

### Phase 6: Statistics & Polish (Week 3-4)
1. ✅ Build Dashboard component
2. ✅ Create DefectStats charts
3. ✅ Implement data export functionality
4. ✅ Add loading states and error handling
5. ✅ UI polish and animations
6. ✅ Documentation
7. ✅ Testing and bug fixes

---

## API Endpoints Used

Based on generated backend:

```javascript
// Caves
GET    /caves              - List all caves
GET    /caves/{gid}        - Get cave by GID
POST   /caves              - Create new cave
PUT    /caves/{gid}        - Update cave
DELETE /caves/{gid}        - Delete cave

// Defects
GET    /defects            - List all defects
GET    /defects/{gid}      - Get defect by GID
POST   /defects            - Create defect
PUT    /defects/{gid}      - Update defect
DELETE /defects/{gid}      - Delete defect

// Exhibits (Statues, Murals, Paintings, Inscriptions)
GET    /statues            - List statues
GET    /murals             - List murals
GET    /paintings          - List paintings
GET    /inscriptions       - List inscriptions
// ... similar CRUD for each type
```

---

## Design Considerations

### 1. **Chinese/English Bilingual**
- Similar to model-based-resolver (uses Chinese)
- Consider i18n for future internationalization

### 2. **Responsive Design**
- Desktop-first (primary use case)
- Tablet support
- Mobile-friendly (limited 3D on mobile)

### 3. **Performance**
- Lazy load 3D models
- Optimize texture sizes
- Paginate long lists
- Cache API responses

### 4. **Accessibility**
- Keyboard navigation
- Screen reader support
- High contrast mode
- Proper ARIA labels

### 5. **Data Validation**
- Client-side form validation
- Coordinate bounds checking
- Required field indicators
- Error message display

---

## Next Steps

1. **User Approval**: Review and approve this proposal
2. **Create Frontend Directory**: Set up basic structure
3. **Start Phase 1**: Implement basic infrastructure
4. **Iterative Development**: Build features phase by phase
5. **Testing**: Test with real backend integration

---

## Questions for User

1. Do you have any 3D models (.obj, .gltf) for caves/exhibits?
2. Any preference for Chinese vs English UI text?
3. Should we include photo upload for exhibits/defects?
4. Any specific chart types for environmental data?
5. Need authentication/login system?

---

## Estimated Timeline (With Vue.js)

- **Vue Setup & Infrastructure**: 2-3 days
- **Cave Management**: 3-4 days
- **Exhibit Management**: 3-4 days
- **Defect Tracking**: 4-5 days
- **Environmental Monitoring**: 2-3 days
- **Statistics & Polish**: 3-4 days

**Total**: ~3-4 weeks for complete frontend

*Note: Vue's reactive system and component reusability should speed up development compared to vanilla JS*

---

## Vue.js Benefits for This Project

### 1. **Reactive Data Management**
```javascript
// Automatic UI updates when data changes
const caves = ref([]);
caves.value.push(newCave); // UI updates automatically
```

### 2. **Simplified Form Handling**
```javascript
// Two-way binding makes forms trivial
<input v-model="caveForm.name" />
<input v-model="caveForm.description" />
```

### 3. **Component Reusability**
- CaveCard, ExhibitCard, DefectCard - same pattern, different data
- Form components can be reused for Create/Edit
- Modal and Drawer components reusable everywhere

### 4. **Better State Management**
- Composables provide clean state management
- No need for complex state tracking
- Reactive computed properties

### 5. **Cleaner Code**
```javascript
// Vue - Clean and declarative
<cave-list :caves="caves" @select="selectCave" />

// Vanilla JS - Imperative and verbose
const list = document.getElementById('cave-list');
caves.forEach(cave => {
  const div = document.createElement('div');
  div.textContent = cave.name;
  div.addEventListener('click', () => selectCave(cave));
  list.appendChild(div);
});
```

---

## Dependencies (CDN-based)

```html
<!-- Vue 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<!-- A-Frame -->
<script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>

<!-- Axios (optional, can use fetch) -->
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.2/dist/axios.min.js"></script>
```

*Note: Using CDN links for simplicity - no build tools or npm required!*

### Vue Component Example

```javascript
// components/Cave/CaveCard.js
const CaveCard = {
  props: ['cave'],
  template: `
    <div class="cave-card" @click="$emit('select', cave)">
      <h3>{{ cave.name }}</h3>
      <p>{{ cave.description }}</p>
      <div class="cave-stats">
        <span>📊 {{ exhibitCount }} 展品</span>
        <span>⚠️ {{ defectCount }} 缺陷</span>
      </div>
    </div>
  `,
  computed: {
    exhibitCount() {
      return this.cave.exhibits?.length || 0;
    },
    defectCount() {
      return this.cave.defects?.length || 0;
    }
  }
};

export default CaveCard;
```

### Vue Composable Example

```javascript
// composables/useCaves.js
import { ref, computed } from 'vue';
import api from '../api.js';

export function useCaves() {
  const caves = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const selectedCave = ref(null);

  const fetchCaves = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/caves');
      caves.value = response.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createCave = async (caveData) => {
    try {
      const response = await api.post('/caves', caveData);
      caves.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const updateCave = async (gid, caveData) => {
    try {
      await api.put(`/caves/${gid}`, caveData);
      const index = caves.value.findIndex(c => c.gid === gid);
      if (index !== -1) {
        caves.value[index] = { ...caves.value[index], ...caveData };
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const deleteCave = async (gid) => {
    try {
      await api.delete(`/caves/${gid}`);
      caves.value = caves.value.filter(c => c.gid !== gid);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    caves,
    loading,
    error,
    selectedCave,
    fetchCaves,
    createCave,
    updateCave,
    deleteCave
  };
}
```

### Main App Setup

```javascript
// app.js
import { createApp } from 'vue';
import CaveList from './components/Cave/CaveList.js';
import ExhibitList from './components/Exhibit/ExhibitList.js';
import DefectTracker from './components/Defect/DefectTracker.js';

const app = createApp({
  components: {
    CaveList,
    ExhibitList,
    DefectTracker
  },
  data() {
    return {
      currentView: 'caves',
      selectedCave: null
    };
  },
  template: `
    <div id="app">
      <app-header :current-view="currentView" @change-view="currentView = $event" />

      <div class="main-content">
        <sidebar />

        <div class="center-content">
          <a-scene v-if="currentView === 'caves'">
            <!-- 3D scene content -->
          </a-scene>

          <cave-list
            v-if="currentView === 'caves'"
            @select="selectedCave = $event"
          />

          <exhibit-list v-if="currentView === 'exhibits'" />

          <defect-tracker v-if="currentView === 'defects'" />
        </div>

        <details-panel :cave="selectedCave" />
      </div>
    </div>
  `
});

app.mount('#app');
```
