/**
 * ModelViewer Component
 * Three.js-based 3D model viewer for OBJ/MTL files with textures
 */
import { renderEffect } from '../services/DeteriorationRenderer.js';
import * as Sim from '../services/SimulationEngine.js';

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
        }
    },
    emits: ['update:autoRotate', 'pixel-data-ready', 'processing-changed'],
    data() {
        return {
            loading: true,
            error: null,
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
            isProcessing: false     // True when texture is being processed
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
        // Subscribe to the SimulationEngine's render command. The engine
        // resolves activeModel + displayMode + pigmentMap into a single
        // mode + payload; the watcher dispatches via DeteriorationRenderer.
        this._unwatchRenderCommand = this.$watch(
            () => Sim.renderCommand.value,
            (cmd) => this.handleRenderCommand(cmd),
            { immediate: true }
        );
    },
    beforeUnmount() {
        if (this._unwatchRenderCommand) this._unwatchRenderCommand();
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
         * Translate a SimulationEngine renderCommand into a
         * DeteriorationRenderer call and upload the processed pixel
         * buffer to the Three.js material. Status toasts and processing
         * lifecycle live here; the actual per-pixel work happens off-thread.
         */
        async handleRenderCommand(cmd) {
            if (!cmd || !this.model) return;

            this.simTemp = Sim.env.temperature;
            this.simRH = Sim.env.humidity;
            this.simDays = Sim.exposure.days;
            this.simMonths = Sim.exposure.months;
            this.simYears = Sim.exposure.years;
            this.simLight = Sim.env.simLight;
            this.mouldResult = Sim.enabledModels.mould ? Sim.assessmentResults.value.mould : null;

            if (cmd.mode === 'reset') {
                this.degradationEnabled = false;
                this.resetTexture();
                return;
            }
            if (!this.originalPixelData || !this.originalPixelWidth || !this.originalPixelHeight) {
                console.warn('Pixel data not ready — texture may not have loaded yet');
                this.showToast('⚠️ Texture pixel data not ready. Try reloading the model.', 'warning', 4000);
                return;
            }

            const w = this.originalPixelWidth;
            const h = this.originalPixelHeight;
            const base = { originalPixelData: this.originalPixelData, width: w, height: h };
            let args = null;
            let toastMsg = '';

            switch (cmd.mode) {
                case 'pigment-overlay':
                    args = { ...base, mode: 'pigment-overlay', pigmentMap: cmd.pigmentMap };
                    toastMsg = '🎨 Pigment map overlay applied';
                    break;
                case 'chemical-fade': {
                    this.degradationEnabled = true;
                    this.enabledChemical = true;
                    this.chemicalDegradationFactor = cmd.degradationFactor;
                    const pct = ((1 - cmd.degradationFactor) * 100).toFixed(1);
                    const days = (this.simDays + this.simMonths * 30.44 + this.simYears * 365.25).toFixed(0);
                    if (cmd.pigmentMap && cmd.perPigmentParams) {
                        args = { ...base, mode: 'chemical-pigment',
                                 pigmentMap: cmd.pigmentMap,
                                 perPigmentParams: cmd.perPigmentParams,
                                 amplification: 3 };
                    } else {
                        args = { ...base, mode: 'chemical-uniform',
                                 degradationFactor: cmd.degradationFactor,
                                 amplification: 10 };
                    }
                    toastMsg = `✅ Texture applied: ${pct}% degradation after ${days} days`;
                    break;
                }
                case 'mould': {
                    args = { ...base, mode: 'mould', effect: cmd.mould.visualEffect };
                    const idx = cmd.mould.mouldIndex || 0;
                    const above = cmd.mould.isAboveThreshold;
                    const rh = cmd.mould.rhCritical;
                    toastMsg = idx <= 0
                        ? '🦠 Mould index: 0 — below critical RH, no growth'
                        : `🦠 Mould index ${idx.toFixed(1)}/6${above ? ` (RH ${(rh || 0).toFixed(0)}% threshold exceeded)` : ''}`;
                    break;
                }
                case 'salt': {
                    args = { ...base, mode: 'salt', effect: cmd.salt.visualEffect };
                    const dr = cmd.salt.damageRatio || 0;
                    toastMsg = dr <= 0
                        ? '🧂 No salt crystallisation at current conditions'
                        : `🧂 Salt efflorescence applied (damage ratio: ${dr.toFixed(2)}×)`;
                    break;
                }
                case 'lifetime': {
                    args = { ...base, mode: 'lifetime', effect: cmd.lifetime.visualEffect };
                    const mult = cmd.lifetime.multiplier || 1;
                    const actualY = (cmd.totalDays || 0) / 365.25;
                    const effY = mult > 0 ? actualY / mult : 0;
                    toastMsg = `⏳ ${mult.toFixed(2)}× lifetime → ${actualY.toFixed(0)}y ≈ ${effY.toFixed(0)}y at reference conditions`;
                    break;
                }
                case 'fatigue': {
                    args = { ...base, mode: 'fatigue', effect: cmd.fatigue.visualEffect };
                    const D = cmd.fatigue.cumulativeDamage || 0;
                    const stage = D >= 3 ? 'severe flaking'
                                : D >= 2 ? 'widespread cracks'
                                : D >= 1 ? 'first cracks appearing'
                                :          'early fatigue';
                    toastMsg = D <= 0.01
                        ? `🧱 D = ${D.toFixed(3)} — no cracking yet`
                        : `🧱 D = ${D.toFixed(2)} — ${stage}`;
                    break;
                }
                default:
                    return;
            }

            this.isProcessing = true;
            this.showToast('⚙️ Applying texture deterioration...', 'info', 0);

            try {
                const processed = await renderEffect(args);
                if (processed === null) return;  // superseded by a newer dispatch
                this._applyPixelDataToModel(processed, w, h);
                this.showToast(toastMsg, 'success', 3000);
            } catch (err) {
                this._handleWorkerError(cmd.mode, err);
            } finally {
                this.isProcessing = false;
            }
        },

        /** Surface worker failures via toast. Processing flag is cleared
         *  by handleRenderCommand's finally block. */
        _handleWorkerError(kind, err) {
            console.error(`${kind} deterioration worker failed:`, err);
            const msg = (err && err.message) ? err.message : 'unknown error';
            this.showToast(`⚠️ Texture processing failed (${kind}): ${msg}`, 'error', 5000);
        },

        /** Upload an RGBA pixel buffer to the 3D model's material. */
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
