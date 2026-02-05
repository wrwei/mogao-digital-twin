# 3D Model Viewer Integration Guide

## Overview

The ModelViewer component uses Three.js to display 3D models (OBJ/MTL format) with textures in your Mogao Digital Twin application.

## Files Created

1. **`components/ModelViewer.js`** - Main Three.js viewer component
2. **`styles/model-viewer.css`** - Styling for the viewer
3. **`model-viewer-demo.html`** - Standalone demo page

## Prerequisites

Add these Three.js libraries to your HTML file:

```html
<!-- Three.js Core -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>

<!-- Three.js Extensions -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/MTLLoader.js"></script>

<!-- Model Viewer Styles -->
<link rel="stylesheet" href="styles/model-viewer.css">
```

## Quick Start - Standalone Demo

To test the viewer immediately:

1. Start your Micronaut backend (so static files are served)
2. Open `model-viewer-demo.html` in a browser through a local web server

```bash
# Option 1: Using Python
cd frontend
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server frontend -p 8000
```

3. Navigate to `http://localhost:8000/model-viewer-demo.html`

## Integration into Existing Components

### Option 1: Add to StatueCard Component

Update your **StatueCard.js** to show a 3D preview:

```javascript
import ModelViewer from './ModelViewer.js';

export default {
    name: 'StatueCard',
    components: {
        ModelViewer
    },
    props: {
        statue: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            showViewer: false
        };
    },
    emits: ['select', 'edit', 'delete'],
    template: `
        <div class="card statue-card" @click="$emit('select', statue)">
            <div class="card-header">
                <h3 class="card-title">{{ statue.name || '雕像' }}</h3>
                <span class="badge">{{ statue.conservationStatus || '未知' }}</span>
            </div>

            <div class="card-body">
                <!-- Asset Reference Section -->
                <div v-if="statue.reference" class="card-section">
                    <div class="field-label">资产引用:</div>
                    <div class="card-field" v-if="statue.reference.modelLocation">
                        <span class="field-label">3D模型:</span>
                        <span class="field-value">{{ statue.reference.modelLocation }}</span>
                    </div>

                    <!-- 3D Viewer Toggle -->
                    <button
                        @click.stop="showViewer = !showViewer"
                        class="btn btn-sm"
                        v-if="statue.reference.modelLocation"
                    >
                        {{ showViewer ? '隐藏' : '查看' }} 3D模型
                    </button>

                    <!-- 3D Viewer -->
                    <div v-if="showViewer" class="model-viewer-container" @click.stop>
                        <model-viewer
                            :asset-reference="statue.reference"
                            :width="400"
                            :height="300"
                        ></model-viewer>
                    </div>
                </div>

                <!-- Other fields... -->
            </div>

            <div class="card-footer">
                <button @click.stop="$emit('edit', statue)">✏️ 编辑</button>
                <button @click.stop="$emit('delete', statue)">🗑️ 删除</button>
            </div>
        </div>
    `
};
```

### Option 2: Create a Dedicated Detail View

Create a new **StatueDetailView.js** component:

```javascript
import ModelViewer from './ModelViewer.js';

export default {
    name: 'StatueDetailView',
    components: {
        ModelViewer
    },
    props: {
        statue: {
            type: Object,
            required: true
        }
    },
    template: `
        <div class="detail-view">
            <h1>{{ statue.name }}</h1>

            <div class="detail-grid">
                <!-- Left: 3D Model -->
                <div class="model-section">
                    <h2>三维模型</h2>
                    <model-viewer
                        v-if="statue.reference"
                        :asset-reference="statue.reference"
                        :width="600"
                        :height="450"
                        :auto-rotate="true"
                    ></model-viewer>
                </div>

                <!-- Right: Information -->
                <div class="info-section">
                    <h2>基本信息</h2>
                    <dl>
                        <dt>名称</dt>
                        <dd>{{ statue.name }}</dd>

                        <dt>材质</dt>
                        <dd>{{ statue.material }}</dd>

                        <dt>时期</dt>
                        <dd>{{ statue.period }}</dd>

                        <dt>保存状态</dt>
                        <dd>{{ statue.conservationStatus }}</dd>
                    </dl>
                </div>
            </div>
        </div>
    `
};
```

## Component Props

### ModelViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `assetReference` | Object | **required** | Object containing model paths |
| `width` | Number | `600` | Viewer width in pixels |
| `height` | Number | `400` | Viewer height in pixels |
| `autoRotate` | Boolean | `false` | Enable automatic rotation |

### AssetReference Object Structure

```javascript
{
    gid: 'ref-statue-001',  // Optional
    modelLocation: '/path/to/model.obj',  // Required
    metadataLocation: '/path/to/model.mtl',  // Optional
    textureLocation: '/path/to/texture.jpg'  // Optional
}
```

## Component Methods

You can access these methods using `ref`:

```javascript
// Reset camera to initial position
this.$refs.modelViewer.resetCamera();
```

## Styling

The viewer comes with default styles in `styles/model-viewer.css`. You can customize:

```css
/* Change viewer border */
.viewer-container {
    border: 2px solid #your-color;
    border-radius: 8px;
}

/* Change background color */
/* Modify in ModelViewer.js: */
this.scene.background = new THREE.Color(0xYOURCOLOR);
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Requires WebGL support.

## Performance Tips

1. **Model Optimization**: Keep OBJ files under 10MB for best performance
2. **Texture Size**: Use textures no larger than 2048×2048 pixels
3. **Multiple Viewers**: Avoid displaying more than 3 viewers simultaneously
4. **Cleanup**: The component automatically cleans up resources on unmount

## Troubleshooting

### Model Not Loading

1. Check browser console for errors
2. Verify file paths are correct and accessible
3. Ensure Micronaut static file serving is configured
4. Check CORS settings in `application.yml`

### Performance Issues

1. Reduce model polygon count
2. Compress textures
3. Disable auto-rotate
4. Lower viewer dimensions

### Three.js Errors

Make sure all Three.js scripts load in the correct order:
1. three.min.js (core)
2. OrbitControls.js
3. OBJLoader.js
4. MTLLoader.js

## Next Steps

1. **Test the demo page** to verify Three.js setup
2. **Integrate into StatueCard** for quick previews
3. **Create detail views** for full-screen model viewing
4. **Add measurement tools** for detailed analysis
5. **Implement annotations** to highlight defects or features
