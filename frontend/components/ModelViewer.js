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
            textureCanvas: null,    // Canvas for texture manipulation
            textureContext: null,   // Canvas 2D context
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
    },
    beforeUnmount() {
        this.cleanup();
    },
    watch: {
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
                    this.degradationEnabled = true;
                    this.applyDeteriorationToTexture();
                } else if (newData === null || !newData) {
                    // Reset to original texture when simulation stops
                    this.degradationEnabled = false;
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

            // Create renderer with high-quality settings
            this.renderer = markRaw(new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                precision: 'highp'
            }));
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 0.75;  // Darker for museum-style lighting
            container.appendChild(this.renderer.domElement);

            // Add museum-style warm lighting - slightly darker
            // Soft ambient base light
            const ambientLight = markRaw(new THREE.AmbientLight(0xfff5e6, 0.35));  // Warm white, softer
            this.scene.add(ambientLight);

            // Main key light - warm from upper right
            const directionalLight1 = markRaw(new THREE.DirectionalLight(0xfff8f0, 0.45));  // Warm key light
            directionalLight1.position.set(5, 5, 5);
            this.scene.add(directionalLight1);

            // Fill light - softer from left
            const directionalLight2 = markRaw(new THREE.DirectionalLight(0xffeedd, 0.2));  // Subtle warm fill
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
                const baseURL = 'http://localhost:8080';
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
                            child.material = new THREE.MeshPhongMaterial({
                                color: 0xcccccc,
                                shininess: 30
                            });
                        }
                    });
                }

                // Apply texture if available
                if (texturePath && this.model) {
                    const textureLoader = new THREE.TextureLoader();
                    const fullTexturePath = texturePath.startsWith('http') ? texturePath : baseURL + texturePath;

                    // Enable CORS for canvas manipulation
                    textureLoader.setCrossOrigin('anonymous');

                    const texture = await new Promise((resolve, reject) => {
                        textureLoader.load(fullTexturePath, resolve, undefined, reject);
                    });

                    // Store original texture for deterioration simulation
                    this.originalTexture = texture;

                    // Log texture info
                    console.log('Texture loaded:', {
                        path: fullTexturePath,
                        image: texture.image,
                        width: texture.image?.width,
                        height: texture.image?.height,
                        complete: texture.image?.complete
                    });

                    this.model.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    mat.map = texture;
                                    mat.needsUpdate = true;
                                });
                            } else {
                                child.material.map = texture;
                                child.material.needsUpdate = true;
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
         * Strlič dose-response framework implementation
         * Calculate moisture content using Paltakari-Karlsson isotherm
         */
        calculateMoistureContent(RH_fraction, T_kelvin) {
            // [H₂O] = |ln(1 − RH) / (1.67T − 285.655)|^(1/(2.491 − 0.012T))
            // RH must be < 1.0 to avoid ln(0)
            // Using absolute value to handle negative base with fractional exponent
            const RH_safe = Math.min(Math.max(RH_fraction, 0.01), 0.999);
            const numerator = Math.log(1 - RH_safe);
            const denominator = 1.67 * T_kelvin - 285.655;
            const base = Math.abs(numerator / denominator); // Take absolute value!
            const exponent = 1 / (2.491 - 0.012 * T_kelvin);
            return Math.pow(base, exponent);
        },

        /**
         * Calculate degradation rate constant
         * k = k₀ · [H₂O]^q · exp(−Eₐ/RT) · I^p
         */
        calculateRateConstant(T_celsius, RH_percent, light_klux) {
            const T_kelvin = T_celsius + 273.15;
            const RH_fraction = RH_percent / 100.0;
            const R = 8.314; // J/(mol·K)

            // Material-specific parameters (typical values for organic pigments)
            const Ea_dark = 70000;      // Activation energy for dark oxidation (J/mol) - linseed oil
            const Ea_light = 25000;     // Activation energy for photofading (J/mol)
            const k0_dark = 0.0001;     // Pre-exponential factor for dark aging
            const k0_light = 0.001;     // Pre-exponential factor for light fading
            const q = 0.8;              // Reaction order w.r.t. water (0.5-1.0)
            const p = 0.9;              // Light reciprocity exponent (~1.0 for linear)

            // Calculate moisture content
            const H2O = this.calculateMoistureContent(RH_fraction, T_kelvin);

            // Dark (thermal/hydrolytic) degradation component
            const k_dark = k0_dark * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_dark / (R * T_kelvin));

            // Photochemical degradation component (only if light present)
            const k_light = light_klux > 0
                ? k0_light * Math.pow(light_klux, p) * Math.pow(Math.abs(H2O), q) * Math.exp(-Ea_light / (R * T_kelvin))
                : 0;

            return k_dark + k_light;
        },

        /**
         * Get total exposure time in days
         */
        getTotalDays() {
            return this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);
        },

        /**
         * Apply deterioration to texture using dose-response model
         * Simulates color fading, yellowing, and darkening
         */
        applyDeteriorationToTexture() {
            if (!this.originalTexture || !this.model) {
                console.warn('No texture or model available for deterioration');
                return;
            }

            const img = this.originalTexture.image;

            // Check if image is loaded and has valid dimensions
            if (!img || !img.width || !img.height) {
                console.error('Texture image not ready or invalid dimensions:', img);
                return;
            }

            // Show notification that texture processing is starting
            this.isProcessing = true;
            this.showToast('⚙️ Applying texture deterioration...', 'info', 0); // No auto-hide

            console.log('Applying deterioration to texture:', img.width, 'x', img.height);

            try {
                // Calculate degradation based on environmental parameters
                const k = this.calculateRateConstant(this.simTemp, this.simRH, this.simLight);
                const t_days = this.getTotalDays();

                // First-order kinetics: C(t) = C₀ · exp(−k·t)
                // For color: fraction remaining after degradation
                const degradationFactor = Math.exp(-k * t_days);

                console.log('Degradation params:', { k, t_days, degradationFactor });

                // Create canvas for texture manipulation if not exists
                if (!this.textureCanvas) {
                    this.textureCanvas = document.createElement('canvas');
                    this.textureContext = this.textureCanvas.getContext('2d');
                }

                this.textureCanvas.width = img.width;
                this.textureCanvas.height = img.height;

                // Clear canvas first
                this.textureContext.clearRect(0, 0, img.width, img.height);

                // Draw original image
                this.textureContext.drawImage(img, 0, 0);

                // Get pixel data
                const imageData = this.textureContext.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;

                if (data.length === 0) {
                    console.error('No pixel data retrieved from canvas');
                    return;
                }

            // Degradation effects parameters
            // Amplify visual effects for demonstration (10x amplification)
            const visualAmplification = 10.0;
            const effectiveDegradation = Math.min(1.0, (1 - degradationFactor) * visualAmplification);

            const fadeFactor = 1 - effectiveDegradation;     // Amplified color saturation loss
            const yellowShift = effectiveDegradation * 60;   // Yellowing (0-60)
            const darkenFactor = 1 - (effectiveDegradation * 0.25); // Darkening

            // Apply deterioration to each pixel
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Convert RGB to LAB-like space for better color manipulation
                // Simplified approach: desaturate toward gray and shift yellow
                const gray = (r + g + b) / 3;

                // Fade colors toward gray (desaturation)
                let newR = r * fadeFactor + gray * (1 - fadeFactor);
                let newG = g * fadeFactor + gray * (1 - fadeFactor);
                let newB = b * fadeFactor + gray * (1 - fadeFactor);

                // Add yellowing (increase red, reduce blue)
                newR = Math.min(255, newR + yellowShift * 0.8);
                newG = Math.min(255, newG + yellowShift * 0.4);
                newB = Math.max(0, newB - yellowShift * 0.6);

                // Apply darkening
                newR *= darkenFactor;
                newG *= darkenFactor;
                newB *= darkenFactor;

                // Write back
                data[i] = Math.round(newR);
                data[i + 1] = Math.round(newG);
                data[i + 2] = Math.round(newB);
                // Alpha channel (i+3) unchanged
            }

            // Put modified pixel data back
            this.textureContext.putImageData(imageData, 0, 0);

            // Create new texture from canvas
            const newTexture = new THREE.CanvasTexture(this.textureCanvas);
            newTexture.needsUpdate = true;

            // Apply to model materials
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.map = newTexture;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.map = newTexture;
                        child.material.needsUpdate = true;
                    }
                }
            });

                console.log(`Applied deterioration: k=${k.toExponential(3)}, scientific_degradation=${(100 * (1 - degradationFactor)).toFixed(1)}%, visual_degradation=${(effectiveDegradation * 100).toFixed(1)}%, fade=${fadeFactor.toFixed(3)}`);

                // Show success notification
                this.isProcessing = false;
                const degradationPercent = (100 * (1 - degradationFactor)).toFixed(1);
                const totalDays = this.getTotalDays().toFixed(0);
                this.showToast(`✅ Texture applied: ${degradationPercent}% degradation after ${totalDays} days`, 'success', 3000);

            } catch (error) {
                console.error('Error applying deterioration:', error);
                this.error = 'Deterioration simulation failed: ' + error.message;
                this.isProcessing = false;
                this.showToast(`❌ Error: ${error.message}`, 'error', 5000);
            }
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
