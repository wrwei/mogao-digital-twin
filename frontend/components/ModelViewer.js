/**
 * ModelViewer Component
 * Three.js-based 3D model viewer for OBJ/MTL files with textures
 */
const { markRaw } = Vue;

export default {
    name: 'ModelViewer',
    props: {
        assetReference: {
            type: Object,
            required: true
        },
        width: {
            type: Number,
            default: 600
        },
        height: {
            type: Number,
            default: 400
        },
        autoRotate: {
            type: Boolean,
            default: false
        },
        simulationData: {
            type: Object,
            default: null
        }
    },
    emits: ['update:autoRotate', 'pixel-data-ready', 'processing-changed'],
    data() {
        return {
            loading: true,
            error: null,
            pigmentDeteriorationWorker: null,
            // Deterioration simulation parameters
            simTemp: 20,           // Temperature in °C
            simRH: 50,             // Relative humidity in %
            simDays: 0,            // Exposure time in days
            simMonths: 0,          // Exposure time in months
            simYears: 0,           // Exposure time in years
            simLight: 0,           // Light intensity in klux (0 = dark storage)
            degradationEnabled: false,
            showAdvanced: false,   // Show/hide advanced settings
            originalTexture: null,  // Store original texture for reset
            originalPixelData: null, // Raw RGBA pixels captured at load time (avoids canvas CORS taint)
            originalPixelWidth: 0,
            originalPixelHeight: 0,
            textureCanvas: null,    // Canvas for texture manipulation
            textureContext: null,   // Canvas 2D context
            // Multi-model deterioration results
            mouldResult: null,      // VTT mould growth model output
            enabledChemical: true,  // Whether chemical fading model is active
            chemicalDegradationFactor: 1.0,  // Pre-computed from SimulationPanel
            chemicalRateConstant: 0,         // Pre-computed from SimulationPanel
            // Notification system
            notification: null,     // Current notification message
            notificationType: 'info', // 'info', 'success', 'warning', 'error'
            showNotification: false,
            isProcessing: false,    // True when texture is being processed
            deteriorationWorker: null  // Web Worker for texture processing
        };
    },
    created() {
        // Store Three.js objects as non-reactive instance properties
        // to avoid Vue's proxy wrapping which breaks Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.animationId = null;
        // Store initial camera position and target for reset
        this.initialCameraPosition = null;
        this.initialControlsTarget = null;
    },
    mounted() {
        this.initViewer();
        this.loadModel();
        this.deteriorationWorker = new Worker('workers/deterioration-worker.js');
        this.deteriorationWorker.onmessage = (e) => {
            this.handleWorkerResult(e.data);
        };
        this.deteriorationWorker.onerror = (err) => this._handleWorkerError('uniform', err);
    },
    beforeUnmount() {
        if (this.deteriorationWorker) this.deteriorationWorker.terminate();
        if (this.pigmentDeteriorationWorker) this.pigmentDeteriorationWorker.terminate();
        this.cleanup();
    },
    watch: {
        isProcessing(v) {
            this.$emit('processing-changed', v);
        },
        autoRotate(newVal) {
            if (this.controls) {
                this.controls.autoRotate = newVal;
            }
        },
        assetReference: {
            deep: true,
            handler() {
                this.loadModel();
            }
        },
        simulationData: {
            deep: true,
            handler(newData) {
                if (newData && newData.deterioration) {
                    // Update local deterioration parameters from external simulation panel
                    this.simTemp = newData.temperature.celsius;
                    this.simRH = newData.humidity.value;
                    this.simDays = newData.deterioration.days;
                    this.simMonths = newData.deterioration.months;
                    this.simYears = newData.deterioration.years;
                    this.simLight = newData.deterioration.lightIntensity;
                    this.mouldResult = newData.deterioration.mould || null;
                    this.enabledChemical = newData.deterioration.chemical !== null;
                    this.chemicalDegradationFactor = newData.deterioration.degradationFactor;
                    this.chemicalRateConstant = newData.deterioration.rateConstant;
                    this.degradationEnabled = true;

                    // Handle display mode from PigmentAnalysisPanel
                    const displayMode = newData.deterioration.pigmentDisplayMode || 'current';
                    const activeModel = newData.activeModel || 'chemical';

                    // Reset to original when no exposure time and showing current view
                    if (newData.deterioration.totalDays === 0 && displayMode === 'current') {
                        this.resetTexture();
                        return;
                    }

                    if (displayMode === 'restored' && newData.deterioration.restoredTexture) {
                        this._applyRestoredTexture(newData.deterioration.restoredTexture);
                    } else if (displayMode === 'pigment-map' && newData.deterioration.pigmentMap) {
                        this._applyPigmentOverlay(newData.deterioration.pigmentMap);
                    } else if (activeModel === 'chemical') {
                        // Per-pigment chemical fading (Arrhenius)
                        this.applyDeteriorationToTexture(
                            newData.deterioration.pigmentMap || null,
                            newData.deterioration.perPigmentParams || null
                        );
                    } else if (activeModel === 'mould' && newData.deterioration.mould) {
                        this._applyMouldEffect(newData.deterioration.mould);
                    } else if (activeModel === 'salt' && newData.deterioration.saltCryst) {
                        this._applySaltEffect(newData.deterioration.saltCryst);
                    } else if (activeModel === 'lifetime' && newData.deterioration.lifetime) {
                        this._applyLifetimeEffect(newData.deterioration.lifetime, newData.deterioration.totalDays);
                    } else {
                        this.applyDeteriorationToTexture(null, null);
                    }
                } else if (newData === null || !newData) {
                    this.degradationEnabled = false;
                    this.mouldResult = null;
                    this.resetTexture();
                }
            }
        }
    },
    methods: {
        initViewer() {
            const container = this.$refs.viewerContainer;
            if (!container) return;

            // Create scene (markRaw prevents Vue reactivity)
            this.scene = markRaw(new THREE.Scene());
            this.scene.background = new THREE.Color(0xf5f5f5);

            // Create camera
            this.camera = markRaw(new THREE.PerspectiveCamera(
                45,
                this.width / this.height,
                0.1,
                1000
            ));
            this.camera.position.set(0, 0, 5);

            // Create renderer
            this.renderer = markRaw(new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
            }));
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            // No tone mapping — avoids colour shifts on UV-mapped museum textures
            this.renderer.toneMapping = THREE.NoToneMapping;
            container.appendChild(this.renderer.domElement);

            // Museum-style neutral lighting
            const ambientLight = markRaw(new THREE.AmbientLight(0xffffff, 0.6));
            this.scene.add(ambientLight);

            // Key light from upper right
            const directionalLight1 = markRaw(new THREE.DirectionalLight(0xffffff, 0.5));
            directionalLight1.position.set(5, 5, 5);
            this.scene.add(directionalLight1);

            // Fill light from left
            const directionalLight2 = markRaw(new THREE.DirectionalLight(0xffffff, 0.25));
            directionalLight2.position.set(-5, 3, -5);
            this.scene.add(directionalLight2);

            // Add controls
            this.controls = markRaw(new THREE.OrbitControls(this.camera, this.renderer.domElement));
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = this.autoRotate;
            this.controls.autoRotateSpeed = 2.0;

            // Start animation loop
            this.animate();
        },

        async loadModel() {
            if (!this.assetReference || !this.assetReference.modelLocation) {
                this.error = 'No model path provided';
                this.loading = false;
                return;
            }

            this.loading = true;
            this.error = null;

            // Remove existing model
            if (this.model) {
                this.scene.remove(this.model);
                this.model = null;
            }

            try {
                const modelPath = this.assetReference.modelLocation;
                const mtlPath = this.assetReference.metadataLocation;
                const texturePath = this.assetReference.textureLocation;

                // Construct full URLs for the backend
                const baseURL = window.CONFIG?.API_BASE_URL || 'http://localhost:8008';
                const fullModelPath = modelPath.startsWith('http') ? modelPath : baseURL + modelPath;
                const fullMtlPath = mtlPath && !mtlPath.startsWith('http') ? baseURL + mtlPath : mtlPath;

                console.log('Loading model:', fullModelPath);
                console.log('Loading MTL:', fullMtlPath);
                console.log('Texture path:', texturePath);

                // Load MTL file if available
                if (fullMtlPath) {
                    const mtlLoader = new THREE.MTLLoader();
                    mtlLoader.setPath(fullMtlPath.substring(0, fullMtlPath.lastIndexOf('/') + 1));

                    const materials = await new Promise((resolve, reject) => {
                        mtlLoader.load(
                            fullMtlPath.substring(fullMtlPath.lastIndexOf('/') + 1),
                            resolve,
                            undefined,
                            reject
                        );
                    });

                    materials.preload();

                    // Load OBJ with materials
                    const objLoader = new THREE.OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.setPath(fullModelPath.substring(0, fullModelPath.lastIndexOf('/') + 1));

                    this.model = markRaw(await new Promise((resolve, reject) => {
                        objLoader.load(
                            fullModelPath.substring(fullModelPath.lastIndexOf('/') + 1),
                            resolve,
                            undefined,
                            reject
                        );
                    }));
                } else {
                    // Load OBJ without materials
                    const objLoader = new THREE.OBJLoader();
                    objLoader.setPath(fullModelPath.substring(0, fullModelPath.lastIndexOf('/') + 1));

                    this.model = markRaw(await new Promise((resolve, reject) => {
                        objLoader.load(
                            fullModelPath.substring(fullModelPath.lastIndexOf('/') + 1),
                            resolve,
                            undefined,
                            reject
                        );
                    }));

                    // Apply basic material if no MTL
                    this.model.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xcccccc,
                                roughness: 0.85,
                                metalness: 0.0,
                            });
                        }
                    });
                }

                // Force light-responsive materials — MTL illum 0 creates
                // MeshBasicMaterial which ignores scene lights and looks flat.
                // Replace with MeshStandardMaterial for proper shading.
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach((mat, idx) => {
                            if (mat.isMeshBasicMaterial || (mat.type === 'MeshBasicMaterial')) {
                                const replacement = new THREE.MeshStandardMaterial({
                                    map: mat.map || null,
                                    color: mat.color ? mat.color.clone() : new THREE.Color(0xcccccc),
                                    roughness: 0.85,
                                    metalness: 0.0,
                                });
                                if (Array.isArray(child.material)) {
                                    child.material[idx] = replacement;
                                } else {
                                    child.material = replacement;
                                }
                                mat.dispose();
                            }
                        });
                    }
                });

                // Apply texture if available
                if (texturePath && this.model) {
                    const fullTexturePath = texturePath.startsWith('http') ? texturePath : baseURL + texturePath;

                    // ── Step 1: Fetch image as blob and decode to ImageBitmap ──────────
                    // Using fetch+blob bypasses the canvas "CORS taint" issue that would
                    // prevent getImageData() when the image is cross-origin.
                    let imageBitmap = null;
                    try {
                        const resp = await fetch(fullTexturePath);
                        const blob = await resp.blob();
                        imageBitmap = await createImageBitmap(blob);
                    } catch (fetchErr) {
                        console.warn('Could not fetch texture as blob, falling back to TextureLoader:', fetchErr.message);
                    }

                    // ── Step 2: Capture raw pixels into originalPixelData ─────────────
                    if (imageBitmap) {
                        const capCanvas = document.createElement('canvas');
                        capCanvas.width = imageBitmap.width;
                        capCanvas.height = imageBitmap.height;
                        const capCtx = capCanvas.getContext('2d');
                        capCtx.drawImage(imageBitmap, 0, 0);
                        const captured = capCtx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
                        this.originalPixelData = new Uint8ClampedArray(captured.data);
                        this.originalPixelWidth = imageBitmap.width;
                        this.originalPixelHeight = imageBitmap.height;
                        console.log(`Pixel data captured: ${imageBitmap.width}×${imageBitmap.height} (${this.originalPixelData.length} bytes)`);
                        // Notify parent so SimulationPanel / PigmentAnalysisPanel can use the pixel data
                        this.$emit('pixel-data-ready', { data: this.originalPixelData, width: imageBitmap.width, height: imageBitmap.height });
                    }

                    // ── Step 3: Load Three.js texture for rendering ───────────────────
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.setCrossOrigin('anonymous');
                    const texture = await new Promise((resolve, reject) => {
                        textureLoader.load(fullTexturePath, resolve, undefined, reject);
                    });
                    this.originalTexture = texture;

                    // Apply texture to all mesh materials.
                    // Also unify material type so all face groups render consistently
                    // (the MTL may split faces across "Solid" and a named material).
                    this.model.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            const applyTex = (mat) => {
                                mat.map = texture;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            };
                            if (Array.isArray(child.material)) {
                                child.material.forEach(applyTex);
                            } else {
                                applyTex(child.material);
                            }
                        }
                    });
                }

                // Center and scale model
                // First, get bounding box and center
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Move model so its center is at the origin
                this.model.position.x -= center.x;
                this.model.position.y -= center.y;
                this.model.position.z -= center.z;

                // Scale to fit viewport
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.5 / maxDim;
                this.model.scale.setScalar(scale);

                // Add to scene
                this.scene.add(this.model);

                // After all transformations, recalculate the actual center
                const finalBox = new THREE.Box3().setFromObject(this.model);
                const finalCenter = finalBox.getCenter(new THREE.Vector3());

                // Position camera and set controls target to the actual model center
                const cameraDistance = 4;
                this.camera.position.set(
                    finalCenter.x + cameraDistance,
                    finalCenter.y + cameraDistance * 0.8,
                    finalCenter.z + cameraDistance
                );
                this.camera.lookAt(finalCenter);
                this.controls.target.copy(finalCenter);
                this.controls.update();

                // Store initial camera position and target for reset
                this.initialCameraPosition = this.camera.position.clone();
                this.initialControlsTarget = this.controls.target.clone();

                this.loading = false;
                console.log('Model loaded successfully');

            } catch (err) {
                console.error('Error loading model:', err);
                this.error = 'Failed to load 3D model: ' + err.message;
                this.loading = false;
            }
        },

        animate() {
            this.animationId = requestAnimationFrame(this.animate);

            if (this.controls) {
                this.controls.update();
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        },

        resetCamera() {
            if (this.camera && this.controls && this.initialCameraPosition && this.initialControlsTarget) {
                this.camera.position.copy(this.initialCameraPosition);
                this.controls.target.copy(this.initialControlsTarget);
                this.camera.lookAt(this.initialControlsTarget);
                this.controls.update();
            }
        },

        /**
         * Apply deterioration to texture using dose-response model
         * Simulates color fading, yellowing, and darkening
         */
        applyDeteriorationToTexture(pigmentMap, perPigmentParams) {
            if (!this.model) {
                // Model still loading — silently skip; watcher will re-fire when ready
                return;
            }
            if (!this.originalPixelData || !this.originalPixelWidth || !this.originalPixelHeight) {
                console.warn('Pixel data not ready — texture may not have loaded yet');
                this.showToast('⚠️ Texture pixel data not ready. Try reloading the model.', 'warning', 4000);
                return;
            }

            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;

            this.isProcessing = true;
            this.showToast('⚙️ Applying texture deterioration...', 'info', 0);

            const degradationFactor = this.enabledChemical ? (this.chemicalDegradationFactor ?? 1.0) : 1.0;

            if (pigmentMap && perPigmentParams) {
                // ── Per-pigment deterioration via pigment worker ──────────
                if (!this.pigmentDeteriorationWorker) {
                    this.pigmentDeteriorationWorker = new Worker('workers/pigment-deterioration-worker.js');
                    this.pigmentDeteriorationWorker.onmessage = (e) => this.handleWorkerResult(e.data);
                    this.pigmentDeteriorationWorker.onerror = (err) => this._handleWorkerError('per-pigment', err);
                }
                const pixelCopy = new Uint8ClampedArray(this.originalPixelData).buffer;
                const mapCopy = new Uint8Array(pigmentMap).buffer;
                // Deep-copy perPigmentParams to a plain object (Vue reactive proxies can't be cloned by postMessage)
                const plainParams = {};
                for (const key of Object.keys(perPigmentParams)) {
                    const p = perPigmentParams[key];
                    plainParams[key] = {
                        degradationFactor: p.degradationFactor,
                        fadedRGB: p.fadedRGB ? [...p.fadedRGB] : null,
                        targetRGB: p.targetRGB ? [...p.targetRGB] : null
                    };
                }
                console.log(`Per-pigment deterioration: ${Object.keys(plainParams).length} classes, size=${w}×${h}`);
                this.pigmentDeteriorationWorker.postMessage(
                    { pixelData: pixelCopy, pigmentMap: mapCopy, pigmentParams: plainParams, width: w, height: h, amplification: 3 },
                    [pixelCopy, mapCopy]
                );
            } else {
                // ── Uniform deterioration (existing behaviour) ────────────
                const pixelCopy = new Uint8ClampedArray(this.originalPixelData).buffer;
                console.log(`Uniform deterioration: degradationFactor=${degradationFactor.toFixed(4)}, size=${w}×${h}`);
                this.deteriorationWorker.postMessage(
                    { pixelData: pixelCopy, width: w, height: h, degradationFactor, amplification: 10 },
                    [pixelCopy]
                );
            }
        },

        /** Apply restored (ML-reconstructed) texture to the 3D model */
        _applyRestoredTexture(result) {
            if (!this.model || !result || !result.restoredPixels) return;
            const { restoredPixels, width, height } = result;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(new ImageData(new Uint8ClampedArray(restoredPixels), width, height), 0, 0);
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const tex = new THREE.CanvasTexture(canvas);
                    if (child.material.map) { tex.flipY = child.material.map.flipY; tex.wrapS = child.material.map.wrapS; tex.wrapT = child.material.map.wrapT; }
                    child.material.map = tex;
                    child.material.needsUpdate = true;
                }
            });
            this.showToast('✨ Restored colours applied', 'success', 3000);
        },

        /** Render a translucent pigment-class overlay on the 3D model */
        _applyPigmentOverlay(pigmentMap) {
            if (!this.model || !pigmentMap || !this.originalPixelData) return;
            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;
            const overlayColors = [
                [200,180,150], [0,80,180], [0,140,60], [200,30,15],
                [245,240,230], [212,175,55], [180,70,30], [15,15,15]
            ];
            const out = new Uint8ClampedArray(this.originalPixelData);
            for (let i = 0; i < w * h; i++) {
                const cls = pigmentMap[i];
                const c = overlayColors[cls] || overlayColors[0];
                const off = i * 4;
                // 50% blend of original with pigment colour overlay
                out[off]     = Math.round(out[off] * 0.5 + c[0] * 0.5);
                out[off + 1] = Math.round(out[off + 1] * 0.5 + c[1] * 0.5);
                out[off + 2] = Math.round(out[off + 2] * 0.5 + c[2] * 0.5);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const tex = new THREE.CanvasTexture(canvas);
                    if (child.material.map) { tex.flipY = child.material.map.flipY; tex.wrapS = child.material.map.wrapS; tex.wrapT = child.material.map.wrapT; }
                    child.material.map = tex;
                    child.material.needsUpdate = true;
                }
            });
            this.showToast('🎨 Pigment map overlay applied', 'info', 3000);
        },

        /** Mould growth visualisation (VTT Hukka-Viitanen): spatially-coherent
         *  green/brown patches biased toward shadowed texture regions where
         *  moisture retention is higher. Patch density scales with mould index. */
        _applyMouldEffect(mouldResult) {
            if (!this.model || !this.originalPixelData) return;
            this.isProcessing = true;
            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;
            const out = new Uint8ClampedArray(this.originalPixelData);
            const mouldIndex = mouldResult.mouldIndex || 0;
            const coverage = Math.min(1, mouldIndex / 6);

            if (coverage <= 0) {
                this._applyPixelDataToModel(out, w, h);
                this.showToast('🦠 Mould index: 0 — below critical RH, no growth', 'info', 3000);
                return;
            }

            // Low-resolution noise grid for spatial coherence (32×32 patches)
            const G = 32;
            const noiseField = new Float32Array(G * G);
            for (let i = 0; i < G * G; i++) {
                noiseField[i] = ((i * 2654435761 + 42) >>> 0) / 4294967296;
            }
            // 3×3 box blur for soft patch edges
            const smoothed = new Float32Array(G * G);
            for (let y = 0; y < G; y++) {
                for (let x = 0; x < G; x++) {
                    let sum = 0, count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < G && ny >= 0 && ny < G) {
                                sum += noiseField[ny * G + nx];
                                count++;
                            }
                        }
                    }
                    smoothed[y * G + x] = sum / count;
                }
            }

            const scaleX = (G - 1) / w;
            const scaleY = (G - 1) / h;
            const threshold = 1 - coverage;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const pixIdx = y * w + x;
                    const off = pixIdx * 4;

                    // Bilinear lookup into smoothed noise field
                    const gx = x * scaleX, gy = y * scaleY;
                    const gx0 = Math.floor(gx), gy0 = Math.floor(gy);
                    const fx = gx - gx0, fy = gy - gy0;
                    const gx1 = Math.min(G - 1, gx0 + 1), gy1 = Math.min(G - 1, gy0 + 1);
                    const n00 = smoothed[gy0 * G + gx0];
                    const n01 = smoothed[gy0 * G + gx1];
                    const n10 = smoothed[gy1 * G + gx0];
                    const n11 = smoothed[gy1 * G + gx1];
                    const ny0 = n00 * (1 - fx) + n01 * fx;
                    const ny1 = n10 * (1 - fx) + n11 * fx;
                    let noise = ny0 * (1 - fy) + ny1 * fy;

                    // Bias toward darker (shadowed, moisture-retentive) regions
                    const r = out[off], g = out[off + 1], b = out[off + 2];
                    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    noise += (0.5 - brightness) * 0.3;

                    if (noise > threshold) {
                        const patchStrength = Math.min(1, (noise - threshold) / Math.max(0.05, 1 - threshold));
                        const intensity = 0.35 + patchStrength * 0.55;

                        // Hue variation: mix of green-brown shades
                        const hueNoise = (((x * 37 + y * 41 + 17) >>> 0) % 100) / 100;
                        const mouldR = 40 + hueNoise * 35;
                        const mouldG = 55 + hueNoise * 30;
                        const mouldB = 25 + hueNoise * 20;

                        out[off]     = Math.round(r * (1 - intensity) + mouldR * intensity);
                        out[off + 1] = Math.round(g * (1 - intensity) + mouldG * intensity);
                        out[off + 2] = Math.round(b * (1 - intensity) + mouldB * intensity);
                    }
                }
            }

            this._applyPixelDataToModel(out, w, h);
            const growthNote = mouldResult.isAboveThreshold
                ? ` (RH ${(mouldResult.rhCritical).toFixed(0)}% threshold exceeded)`
                : '';
            this.showToast(
                `🦠 Mould index ${mouldIndex.toFixed(1)}/6${growthNote}`,
                'info', 3000
            );
        },

        /** Salt crystallisation visualisation: white efflorescence patches */
        _applySaltEffect(saltResult) {
            if (!this.model || !this.originalPixelData) return;
            this.isProcessing = true;
            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;
            const out = new Uint8ClampedArray(this.originalPixelData);
            const damageRatio = saltResult.damageRatio || 0;
            const coverage = Math.min(1, damageRatio / 5);
            if (coverage <= 0) {
                this._applyPixelDataToModel(out, w, h);
                this.showToast('🧂 No salt crystallisation at current conditions', 'info', 3000);
                return;
            }
            const seed = 137;
            for (let i = 0; i < w * h; i++) {
                const noise = ((i * 2654435761 + seed) >>> 0) / 4294967296;
                if (noise < coverage) {
                    const off = i * 4;
                    const intensity = 0.4 + noise * 0.5;
                    // Blend towards white/grey salt efflorescence
                    out[off]     = Math.round(out[off] * (1 - intensity) + 230 * intensity);
                    out[off + 1] = Math.round(out[off + 1] * (1 - intensity) + 225 * intensity);
                    out[off + 2] = Math.round(out[off + 2] * (1 - intensity) + 220 * intensity);
                }
            }
            this._applyPixelDataToModel(out, w, h);
            this.showToast('🧂 Salt efflorescence applied (damage ratio: ' + damageRatio.toFixed(2) + '×)', 'info', 3000);
        },

        /** Lifetime multiplier visualisation: converts elapsed time into
         *  reference-condition years via the Michalski multiplier, then
         *  applies proportional desaturation + slight warm cast. */
        _applyLifetimeEffect(lifetimeResult, totalDays) {
            if (!this.model || !this.originalPixelData) return;
            this.isProcessing = true;
            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;
            const out = new Uint8ClampedArray(this.originalPixelData);

            const multiplier = Math.max(0.01, lifetimeResult.multiplier || 1);
            const actualYears = Math.max(0, (totalDays || 0) / 365.25);
            // Convert to equivalent ageing at reference conditions (20°C, 50% RH)
            const effectiveYears = actualYears / multiplier;
            // Fade intensity saturates at 200 reference-years
            const referenceSpan = 200;
            const fadeIntensity = Math.min(1, effectiveYears / referenceSpan);

            const desaturate = fadeIntensity * 0.75;
            const yellowing = fadeIntensity * 0.18; // slight warm cast from binder ageing

            for (let i = 0; i < w * h; i++) {
                const off = i * 4;
                const r = out[off], g = out[off + 1], b = out[off + 2];
                const grey = 0.299 * r + 0.587 * g + 0.114 * b;
                let nr = r * (1 - desaturate) + grey * desaturate;
                let ng = g * (1 - desaturate) + grey * desaturate;
                let nb = b * (1 - desaturate) + grey * desaturate;
                // Warm cast: +R/+G, -B
                nr += yellowing * 22;
                ng += yellowing * 10;
                nb -= yellowing * 22;
                out[off]     = Math.max(0, Math.min(255, Math.round(nr)));
                out[off + 1] = Math.max(0, Math.min(255, Math.round(ng)));
                out[off + 2] = Math.max(0, Math.min(255, Math.round(nb)));
            }
            this._applyPixelDataToModel(out, w, h);
            this.showToast(
                `⏳ ${multiplier.toFixed(2)}× lifetime → ${actualYears.toFixed(0)}y ≈ ${effectiveYears.toFixed(0)}y at reference conditions`,
                'info', 3000
            );
        },

        /** Clear processing state and surface worker failures so the UI unlocks. */
        _handleWorkerError(kind, err) {
            console.error(`${kind} deterioration worker failed:`, err);
            this.isProcessing = false;
            const msg = (err && err.message) ? err.message : 'unknown error';
            this.showToast(`⚠️ Texture processing failed (${kind}): ${msg}`, 'error', 5000);
        },

        /** Helper: apply raw pixel data to the 3D model texture */
        _applyPixelDataToModel(pixelData, w, h) {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').putImageData(new ImageData(pixelData, w, h), 0, 0);
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const tex = new THREE.CanvasTexture(canvas);
                    if (child.material.map) { tex.flipY = child.material.map.flipY; tex.wrapS = child.material.map.wrapS; tex.wrapT = child.material.map.wrapT; }
                    child.material.map = tex;
                    child.material.needsUpdate = true;
                }
            });
            this.isProcessing = false;
        },

        /**
         * Handle processed pixel data returned from the Web Worker
         */
        handleWorkerResult(result) {
            const { pixelData, width, height } = result;
            const imageData = new ImageData(new Uint8ClampedArray(pixelData), width, height);

            // Ensure canvas exists and matches texture dimensions
            if (!this.textureCanvas || this.textureCanvas.width !== width || this.textureCanvas.height !== height) {
                this.textureCanvas = document.createElement('canvas');
                this.textureContext = this.textureCanvas.getContext('2d');
                this.textureCanvas.width = width;
                this.textureCanvas.height = height;
            }
            this.textureContext.putImageData(imageData, 0, 0);

            // Update Three.js texture
            if (this.model) {
                this.model.traverse((child) => {
                    if (child.isMesh && child.material && child.material.map) {
                        const newTexture = new THREE.CanvasTexture(this.textureCanvas);
                        newTexture.flipY = child.material.map.flipY;
                        newTexture.wrapS = child.material.map.wrapS;
                        newTexture.wrapT = child.material.map.wrapT;
                        child.material.map = newTexture;
                        child.material.needsUpdate = true;
                    }
                });
            }

            this.isProcessing = false;
            const degradationPercent = (100 * (1 - this.chemicalDegradationFactor)).toFixed(1);
            const totalDays = (this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25)).toFixed(0);
            this.showToast(`✅ Texture applied: ${degradationPercent}% degradation after ${totalDays} days`, 'success', 3000);
        },

        /**
         * Reset to original texture
         */
        resetTexture() {
            if (!this.originalTexture || !this.model) return;

            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.map = this.originalTexture;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.map = this.originalTexture;
                        child.material.needsUpdate = true;
                    }
                }
            });
        },

        /**
         * Apply procedural mould spots to texture pixel data.
         * Uses deterministic seeded noise so spots are stable between frames.
         * Spots are dark green-black blotches biased toward darker pixels
         * (recesses hold more moisture).
         *
         * @param {Uint8ClampedArray} data  RGBA pixel data (mutated in place)
         * @param {number} width   Texture width
         * @param {number} height  Texture height
         * @param {object} mouldResult  Output from DeteriorationEngine.mouldGrowth()
         */
        applyMouldEffect(data, width, height, mouldResult) {
            const coverage = mouldResult.visualEffect.coverage;   // 0-1
            const intensity = mouldResult.visualEffect.intensity; // 0-1
            if (coverage <= 0) return;

            // Deterministic hash function for seeded pseudo-random spots
            const hash = (x, y, seed) => {
                let h = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
                h = ((h ^ (h >> 13)) * 1103515245) | 0;
                return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff; // 0-1
            };

            // Generate spots at a grid resolution (every 8px)
            const gridSize = 8;
            const spotRadius = 12; // pixels

            // Mould colour: dark green-black
            const mouldR = 20, mouldG = 40, mouldB = 15;

            for (let gy = 0; gy < height; gy += gridSize) {
                for (let gx = 0; gx < width; gx += gridSize) {
                    // Decide if this grid cell has a mould spot
                    const spotChance = hash(gx, gy, 42);
                    if (spotChance > coverage * 1.5) continue; // More spots as coverage grows

                    // Spot center with slight jitter
                    const cx = gx + hash(gx, gy, 7) * gridSize;
                    const cy = gy + hash(gx, gy, 13) * gridSize;

                    // Apply spot to nearby pixels
                    const r2 = spotRadius * spotRadius;
                    const startX = Math.max(0, Math.floor(cx - spotRadius));
                    const endX = Math.min(width - 1, Math.ceil(cx + spotRadius));
                    const startY = Math.max(0, Math.floor(cy - spotRadius));
                    const endY = Math.min(height - 1, Math.ceil(cy + spotRadius));

                    for (let py = startY; py <= endY; py++) {
                        for (let px = startX; px <= endX; px++) {
                            const dx = px - cx;
                            const dy = py - cy;
                            const dist2 = dx * dx + dy * dy;
                            if (dist2 > r2) continue;

                            // Soft-edged falloff
                            const falloff = 1 - Math.sqrt(dist2) / spotRadius;
                            const idx = (py * width + px) * 4;

                            // Bias: darker original pixels are more susceptible
                            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
                            const darkBias = 1 - brightness * 0.6; // 0.4 - 1.0

                            const blend = falloff * intensity * darkBias * 0.8;

                            data[idx]     = Math.round(data[idx]     * (1 - blend) + mouldR * blend);
                            data[idx + 1] = Math.round(data[idx + 1] * (1 - blend) + mouldG * blend);
                            data[idx + 2] = Math.round(data[idx + 2] * (1 - blend) + mouldB * blend);
                        }
                    }
                }
            }
        },

        /**
         * Toggle deterioration simulation
         */
        toggleDegradation() {
            this.degradationEnabled = !this.degradationEnabled;
            if (this.degradationEnabled) {
                this.applyDeteriorationToTexture();
            } else {
                this.resetTexture();
            }
        },

        /**
         * Update simulation parameters
         */
        updateSimulation() {
            if (this.degradationEnabled) {
                this.applyDeteriorationToTexture();
            }
        },

        /**
         * Apply preset scenario
         */
        applyPreset(preset) {
            const presets = {
                museum: { temp: 20, rh: 50, days: 0, months: 0, years: 100, light: 0.15 },
                poorStorage: { temp: 30, rh: 80, days: 0, months: 0, years: 50, light: 5 },
                outdoor: { temp: 25, rh: 70, days: 0, months: 0, years: 20, light: 20 },
                extreme: { temp: 40, rh: 100, days: 0, months: 0, years: 10, light: 30 },
                oneMonth: { temp: 25, rh: 60, days: 0, months: 1, years: 0, light: 10 },
                oneYear: { temp: 25, rh: 60, days: 0, months: 0, years: 1, light: 10 },
                tenYears: { temp: 25, rh: 60, days: 0, months: 0, years: 10, light: 10 }
            };

            const p = presets[preset];
            if (p) {
                this.simTemp = p.temp;
                this.simRH = p.rh;
                this.simDays = p.days;
                this.simMonths = p.months;
                this.simYears = p.years;
                this.simLight = p.light;
            }
        },

        /**
         * Reset simulation to default parameters
         */
        resetSimulation() {
            this.simTemp = 20;
            this.simRH = 50;
            this.simDays = 0;
            this.simMonths = 0;
            this.simYears = 0;
            this.simLight = 0;
            this.showAdvanced = false;
        },

        /**
         * Notification System
         */
        showToast(message, type = 'info', duration = 3000) {
            this.notification = message;
            this.notificationType = type;
            this.showNotification = true;

            // Auto-hide after duration
            if (duration > 0) {
                setTimeout(() => {
                    this.hideToast();
                }, duration);
            }
        },

        hideToast() {
            this.showNotification = false;
            setTimeout(() => {
                this.notification = null;
            }, 300); // Wait for fade-out animation
        },

        cleanup() {
            // Cancel animation frame
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            // Dispose of Three.js resources
            if (this.renderer) {
                this.renderer.dispose();
            }

            if (this.model) {
                this.scene.remove(this.model);
            }

            if (this.controls) {
                this.controls.dispose();
            }

            // Clear references
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.model = null;
        }
    },
    template: `
        <div class="model-viewer">
            <div class="viewer-container" ref="viewerContainer">
                <div v-if="loading" class="viewer-loading">
                    <div class="spinner"></div>
                    <p>Loading 3D model...</p>
                </div>
                <div v-if="error" class="viewer-error">
                    <p>{{ error }}</p>
                </div>
            </div>

            <div class="viewer-controls">
                <button @click="resetCamera" class="btn btn-sm">
                    Reset Camera
                </button>
            </div>

            <!-- Toast Notification -->
            <div v-if="showNotification" class="toast-notification" :class="'toast-' + notificationType">
                {{ notification }}
            </div>
        </div>
    `
};
