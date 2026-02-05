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
        }
    },
    data() {
        return {
            loading: true,
            error: null
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
            this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }));
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(this.renderer.domElement);

            // Add lights
            const ambientLight = markRaw(new THREE.AmbientLight(0xffffff, 0.6));
            this.scene.add(ambientLight);

            const directionalLight1 = markRaw(new THREE.DirectionalLight(0xffffff, 0.8));
            directionalLight1.position.set(5, 5, 5);
            this.scene.add(directionalLight1);

            const directionalLight2 = markRaw(new THREE.DirectionalLight(0xffffff, 0.4));
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

                    const texture = await new Promise((resolve, reject) => {
                        textureLoader.load(fullTexturePath, resolve, undefined, reject);
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
        </div>
    `
};
