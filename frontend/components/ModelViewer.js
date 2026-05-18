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
            // Multi-model deterioration results
            mouldResult: null,      // VTT mould growth model output
            lifetimeResult: null,   // Michalski lifetime multiplier output
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
    },
    beforeUnmount() {
        if (this.deteriorationWorker) this.deteriorationWorker.terminate();
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
                    // Store per-model results if available (null = disabled)
                    this.mouldResult = newData.deterioration.mould || null;
                    this.lifetimeResult = newData.deterioration.lifetime || null;
                    this.enabledChemical = newData.deterioration.chemical !== null;
                    // Store pre-computed degradation factor from SimulationPanel
                    this.chemicalDegradationFactor = newData.deterioration.degradationFactor;
                    this.chemicalRateConstant = newData.deterioration.rateConstant;
                    this.degradationEnabled = true;
                    this.applyDeteriorationToTexture();
                } else if (newData === null || !newData) {
                    // Reset to original texture when simulation stops
                    this.degradationEnabled = false;
                    this.mouldResult = null;
                    this.lifetimeResult = null;
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

                    try {
                        const texture = await new Promise((resolve, reject) => {
                            textureLoader.load(fullTexturePath, resolve, undefined, reject);
                        });

                        // Store original texture for deterioration simulation
                        this.originalTexture = texture;

                        console.log('Texture loaded:', {
                            path: fullTexturePath,
                            width: texture.image?.width,
                            height: texture.image?.height
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
                    } catch (texErr) {
                        console.warn('Texture not available, model will use material colors:', texErr.message || texErr);
                    }
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
        applyDeteriorationToTexture() {
            if (!this.model) {
                console.warn('No model available for deterioration');
                return;
            }

            let degradationFactor = this.enabledChemical ? (this.chemicalDegradationFactor || 1.0) : 1.0;

            // If no texture, apply deterioration via material color
            if (!this.originalTexture) {
                this.applyDeteriorationToMaterial(degradationFactor);
                return;
            }

            const img = this.originalTexture.image;

            // Check if image is loaded and has valid dimensions
            if (!img || !img.width || !img.height) {
                console.error('Texture image not ready or invalid dimensions:', img);
                return;
            }

            // Skip if already processing
            if (this.isProcessing) return;

            // Show notification that texture processing is starting
            this.isProcessing = true;
            this.showToast('⚙️ Applying texture deterioration...', 'info', 0); // No auto-hide

            try {
                let k = this.enabledChemical ? (this.chemicalRateConstant || 0) : 0;
                const t_days = this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);

                // Downscale large textures for simulation (cap at 2048px)
                const maxSimSize = 2048;
                const scale = Math.min(1, maxSimSize / Math.max(img.width, img.height));
                const simW = Math.round(img.width * scale);
                const simH = Math.round(img.height * scale);

                // Create canvas for texture manipulation if not exists
                if (!this.textureCanvas) {
                    this.textureCanvas = document.createElement('canvas');
                    this.textureContext = this.textureCanvas.getContext('2d');
                }

                this.textureCanvas.width = simW;
                this.textureCanvas.height = simH;

                // Clear canvas first
                this.textureContext.clearRect(0, 0, simW, simH);

                // Draw original image (downscaled if needed)
                this.textureContext.drawImage(img, 0, 0, simW, simH);

                // Get pixel data
                const imageData = this.textureContext.getImageData(0, 0, simW, simH);
                const data = imageData.data;

                if (data.length === 0) {
                    console.error('No pixel data retrieved from canvas');
                    return;
                }

                // Compute lifetime aging factor:
                // multiplier < 1 means faster aging; effective age = exposure / multiplier
                // Normalize to a 0-1 aging intensity over a 500-year reference lifespan
                let lifetimeAgingFactor = 0;
                if (this.lifetimeResult && this.lifetimeResult.multiplier > 0) {
                    const effectiveYears = (t_days / 365.25) / this.lifetimeResult.multiplier;
                    lifetimeAgingFactor = Math.min(1, effectiveYears / 500);
                }

                // Post pixel data to Web Worker for off-main-thread processing
                this.deteriorationWorker.postMessage({
                    pixelData: imageData.data.buffer,
                    width: simW,
                    height: simH,
                    degradationFactor: degradationFactor,
                    amplification: 3,
                    lifetimeAgingFactor: lifetimeAgingFactor
                }, [imageData.data.buffer]);

                console.log(`Sent texture to worker: k=${k.toExponential(3)}, degradationFactor=${degradationFactor.toFixed(6)}`);

            } catch (error) {
                console.error('Error applying deterioration:', error);
                this.error = 'Deterioration simulation failed: ' + error.message;
                this.isProcessing = false;
                this.showToast(`❌ Error: ${error.message}`, 'error', 5000);
            }
        },

        /**
         * Apply deterioration directly to material color (for models without textures)
         */
        applyDeteriorationToMaterial(degradationFactor) {
            const amplification = 3;
            const visualDeg = 1 - Math.pow(degradationFactor, amplification);
            const fadeFactor = 1 - visualDeg;

            // Warm gray target for fading
            const targetR = 180 / 255, targetG = 170 / 255, targetB = 155 / 255;
            const yellowShift = visualDeg * 0.06; // Normalized yellowing

            // Lifetime aging factor
            const t_days = this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25);
            let aging = 0;
            if (this.lifetimeResult && this.lifetimeResult.multiplier > 0) {
                const effectiveYears = (t_days / 365.25) / this.lifetimeResult.multiplier;
                aging = Math.min(1, effectiveYears / 500);
            }

            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        // Store original color on first application
                        if (!mat.userData.originalColor) {
                            mat.userData.originalColor = mat.color.clone();
                        }
                        const orig = mat.userData.originalColor;

                        // Chemical: fading toward warm gray
                        let r = orig.r * fadeFactor + targetR * (1 - fadeFactor);
                        let g = orig.g * fadeFactor + targetG * (1 - fadeFactor);
                        let b = orig.b * fadeFactor + targetB * (1 - fadeFactor);

                        // Yellowing
                        r = Math.min(1, r + yellowShift);
                        g = Math.min(1, g + yellowShift * 0.7);
                        b = Math.max(0, b - yellowShift * 0.5);

                        // Lifetime aging
                        if (aging > 0) {
                            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                            const desatAmount = aging * 0.6;
                            r = r + (gray - r) * desatAmount;
                            g = g + (gray - g) * desatAmount;
                            b = b + (gray - b) * desatAmount;

                            const darken = 1 - aging * 0.35;
                            r *= darken; g *= darken; b *= darken;

                            const patina = aging * 0.08;
                            r = Math.min(1, r + patina * 0.5);
                            g = Math.min(1, g + patina * 0.15);
                            b = Math.max(0, b - patina * 0.6);
                        }

                        mat.color.setRGB(r, g, b);
                        mat.needsUpdate = true;
                    });
                }
            });

            const degradationPercent = (100 * (1 - degradationFactor)).toFixed(1);
            const totalDays = (this.simDays + (this.simMonths * 30.44) + (this.simYears * 365.25)).toFixed(0);
            this.showToast(`✅ Material updated: ${degradationPercent}% degradation after ${totalDays} days`, 'success', 3000);
        },

        /**
         * Handle processed pixel data returned from the Web Worker
         */
        handleWorkerResult(result) {
            const { pixelData, width, height } = result;
            const imageData = new ImageData(new Uint8ClampedArray(pixelData), width, height);
            const data = imageData.data;

            // ── Phase 2: Apply mould spots (VTT model) ─────────────────
            if (this.mouldResult && this.mouldResult.mouldIndex > 0.1) {
                this.applyMouldEffect(data, width, height, this.mouldResult);
            }

            if (!this.textureCanvas) {
                this.textureCanvas = document.createElement('canvas');
                this.textureContext = this.textureCanvas.getContext('2d');
            }
            this.textureCanvas.width = width;
            this.textureCanvas.height = height;
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
            if (!this.model) return;

            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        // Restore original texture if available
                        if (this.originalTexture) {
                            mat.map = this.originalTexture;
                        }
                        // Restore original material color
                        if (mat.userData.originalColor) {
                            mat.color.copy(mat.userData.originalColor);
                        }
                        mat.needsUpdate = true;
                    });
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

            // Sparse, isolated colonies — wide grid, small spots, no overlap
            const gridSize = 64;
            const spotRadius = 8;

            // Mould colour: dark green-black
            const mouldR = 30, mouldG = 50, mouldB = 20;

            // At max coverage only ~20% of grid cells get a colony
            const threshold = coverage * 0.2;

            for (let gy = 0; gy < height; gy += gridSize) {
                for (let gx = 0; gx < width; gx += gridSize) {
                    // Decide if this grid cell has a mould spot
                    const spotChance = hash(gx, gy, 42);
                    if (spotChance > threshold) continue;

                    // Spot center with jitter within grid cell
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

                            // Bias: darker/damper recesses get more mould
                            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
                            const darkBias = 1 - brightness * 0.5;

                            const blend = Math.min(0.35, falloff * intensity * darkBias * 0.35);

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
