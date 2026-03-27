package digital.twin.mogao.codegen;

import digital.twin.mogao.util.EpsilonModelManager;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EPackage;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;

import java.io.File;
import java.io.FileWriter;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/**
 * Code Generator using EGL transformations
 * Generates DTOs and Service classes from the Mogao Digital Twin metamodel
 */
public class CodeGenerator {

    private static final String METAMODEL_PATH = "metamodel/mogao_dt.ecore";
    private static final String OUTPUT_BASE_DIR = "src/main/java/";
    private static final String DTO_PACKAGE = "digital.twin.mogao.dto";
    private static final String SERVICE_PACKAGE = "digital.twin.mogao.service";
    private static final String CONTROLLER_PACKAGE = "digital.twin.mogao.controller";

    // EOL scripts generation constants
    private static final String EOL_SCRIPTS_OUTPUT_DIR = "src/main/resources/eol-scripts/";

    // Mongoose backend generation constants
    private static final String MONGOOSE_OUTPUT_DIR = "generated/mongoose/";
    private static final String MONGOOSE_MODELS_DIR = MONGOOSE_OUTPUT_DIR + "models/";
    private static final String MONGOOSE_SERVICES_DIR = MONGOOSE_OUTPUT_DIR + "services/";
    private static final String MONGOOSE_CONTROLLERS_DIR = MONGOOSE_OUTPUT_DIR + "controllers/";
    private static final String MONGOOSE_ROUTERS_DIR = MONGOOSE_OUTPUT_DIR + "routers/";

    public static void main(String[] args) {
        try {
            CodeGenerator generator = new CodeGenerator();

            System.out.println("=== Mogao Digital Twin Code Generator ===\n");

            // Generate DTOs
            System.out.println("Generating DTOs...");
            generator.generateDTOs();

            // Generate Services
            System.out.println("\nGenerating Services...");
            generator.generateServices();

            // Generate Controllers
            System.out.println("\nGenerating Controllers...");
            generator.generateControllers();

            // Generate Health Controller
            System.out.println("\nGenerating Health Controller...");
            generator.generateHealthController();

            // Generate File Upload Controller
            System.out.println("\nGenerating File Upload Controller...");
            generator.generateFileUploadController();

            // Generate EOL Operation Scripts
            System.out.println("\nGenerating EOL Operation Scripts...");
            generator.generateEOLOperations();

            // Generate Mongoose Backend (MongoDB)
            System.out.println("\nGenerating Mongoose Backend...");
            generator.generateMongooseBackend();

            System.out.println("\n=== Code Generation Complete ===");

        } catch (Exception e) {
            System.err.println("Error during code generation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Generate DTO classes for all concrete classes in the metamodel
     */
    public void generateDTOs() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();
        System.out.println("Loaded metamodel: " + metamodel.getName());

        // Get all classes (including abstract ones to avoid reference issues)
        for (Object obj : metamodel.getEClassifiers()) {
            if (obj instanceof EClass) {
                EClass eClass = (EClass) obj;

                System.out.println("  Generating DTO for: " + eClass.getName() +
                    (eClass.isAbstract() ? " (abstract)" : ""));

                // Prepare parameters for EGL template
                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);
                params.put("packageName", DTO_PACKAGE);

                // Execute EGL template (without loading model instance)
                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/backend/GenerateDTO.egl", params);

                // Write to file
                String outputDir = OUTPUT_BASE_DIR + DTO_PACKAGE.replace('.', '/') + "/";
                String fileName = eClass.getName() + "DTO.java";
                writeToFile(outputDir, fileName, generatedCode);

                System.out.println("    -> Generated: " + outputDir + fileName);
            }
        }
    }

    /**
     * Generate Service classes for main entity classes
     */
    public void generateServices() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        // Entity classes we want to generate services for
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);

            if (eClass != null) {
                System.out.println("  Generating Service for: " + eClass.getName());

                // Prepare parameters for EGL template
                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);
                params.put("packageName", SERVICE_PACKAGE);

                // Execute EGL template (without loading model instance)
                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/backend/GenerateService.egl", params);

                // Write to file
                String outputDir = OUTPUT_BASE_DIR + SERVICE_PACKAGE.replace('.', '/') + "/";
                String fileName = eClass.getName() + "Service.java";
                writeToFile(outputDir, fileName, generatedCode);

                System.out.println("    -> Generated: " + outputDir + fileName);
            } else {
                System.out.println("  Warning: Class not found: " + className);
            }
        }
    }

    /**
     * Generate Controller classes for main entity classes
     */
    public void generateControllers() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        // Entity classes we want to generate controllers for
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);

            if (eClass != null) {
                System.out.println("  Generating Controller for: " + eClass.getName());

                // Prepare parameters for EGL template
                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);
                params.put("packageName", CONTROLLER_PACKAGE);

                // Execute EGL template (without loading model instance)
                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/backend/GenerateController.egl", params);

                // Write to file
                String outputDir = OUTPUT_BASE_DIR + CONTROLLER_PACKAGE.replace('.', '/') + "/";
                String fileName = eClass.getName() + "Controller.java";
                writeToFile(outputDir, fileName, generatedCode);

                System.out.println("    -> Generated: " + outputDir + fileName);
            } else {
                System.out.println("  Warning: Class not found: " + className);
            }
        }
    }

    /**
     * Generate Health Controller - Simple health check endpoint
     */
    public void generateHealthController() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        System.out.println("  Generating HealthController...");

        // Prepare parameters for EGL template
        Map<String, Object> params = new HashMap<>();
        params.put("packageName", CONTROLLER_PACKAGE);

        // Execute EGL template
        String generatedCode = manager.executeEglTemplateWithoutModel("transformation/backend/GenerateHealthController.egl", params);

        // Write to file
        String outputDir = OUTPUT_BASE_DIR + CONTROLLER_PACKAGE.replace('.', '/') + "/";
        String fileName = "HealthController.java";
        writeToFile(outputDir, fileName, generatedCode);

        System.out.println("    -> Generated: " + outputDir + fileName);
    }

    /**
     * Generate File Upload Controller - Handles multipart file uploads
     */
    public void generateFileUploadController() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        System.out.println("  Generating FileUploadController...");

        // Prepare parameters for EGL template
        Map<String, Object> params = new HashMap<>();
        params.put("packageName", CONTROLLER_PACKAGE);

        // Execute EGL template
        String generatedCode = manager.executeEglTemplateWithoutModel("transformation/backend/GenerateFileUploadController.egl", params);

        // Write to file
        String outputDir = OUTPUT_BASE_DIR + CONTROLLER_PACKAGE.replace('.', '/') + "/";
        String fileName = "FileUploadController.java";
        writeToFile(outputDir, fileName, generatedCode);

        System.out.println("    -> Generated: " + outputDir + fileName);
    }

    /**
     * Generate EOL Operation Scripts for entity classes
     */
    public void generateEOLOperations() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        // Entity classes we want to generate EOL operations for
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);

            if (eClass != null) {
                System.out.println("  Generating EOL operations for: " + eClass.getName());

                // Prepare parameters for EGL template
                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);

                // Execute EGL template
                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/eol/GenerateEOLOperations.egl", params);

                // Write to file
                String outputDir = EOL_SCRIPTS_OUTPUT_DIR + className.toLowerCase() + "/";
                String fileName = eClass.getName() + "Operations.eol";
                writeEOLFile(outputDir, fileName, generatedCode);

                System.out.println("    -> Generated: " + outputDir + fileName);
            } else {
                System.out.println("  Warning: Class not found: " + className);
            }
        }
    }

    /**
     * Generate Mongoose backend stack (models, services, controllers, routers)
     * for all concrete classes, plus models for abstract classes
     */
    public void generateMongooseBackend() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();
        EPackage metamodel = loadMetamodel();

        // Generate models for ALL classes (including abstract)
        System.out.println("  Generating Mongoose models...");
        StringBuilder modelsIndex = new StringBuilder();
        modelsIndex.append("// Auto-generated Mongoose model index\n\n");

        for (Object obj : metamodel.getEClassifiers()) {
            if (obj instanceof EClass) {
                EClass eClass = (EClass) obj;
                System.out.println("    Model: " + eClass.getName() + (eClass.isAbstract() ? " (abstract)" : ""));

                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);

                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseModel.egl", params);
                writeToFile(MONGOOSE_MODELS_DIR, eClass.getName() + ".js", generatedCode);

                if (eClass.isAbstract()) {
                    modelsIndex.append("const { ").append(eClass.getName()).append("Schema } = require('./").append(eClass.getName()).append("');\n");
                } else {
                    modelsIndex.append("const { ").append(eClass.getName()).append(", ").append(eClass.getName()).append("Schema } = require('./").append(eClass.getName()).append("');\n");
                }
            }
        }

        modelsIndex.append("\nmodule.exports = {\n");
        for (Object obj : metamodel.getEClassifiers()) {
            if (obj instanceof EClass) {
                EClass eClass = (EClass) obj;
                if (eClass.isAbstract()) {
                    modelsIndex.append("    ").append(eClass.getName()).append("Schema,\n");
                } else {
                    modelsIndex.append("    ").append(eClass.getName()).append(", ").append(eClass.getName()).append("Schema,\n");
                }
            }
        }
        modelsIndex.append("};\n");
        writeToFile(MONGOOSE_MODELS_DIR, "index.js", modelsIndex.toString());

        // Generate services, controllers, routers for CONCRETE classes only
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription",
            "Coordinates", "Parameter", "AssetReference", "DTPackage", "Temperature", "Humidity", "LightIntensity"};

        StringBuilder servicesIndex = new StringBuilder("// Auto-generated service index\n\nmodule.exports = {\n");
        StringBuilder controllersIndex = new StringBuilder("// Auto-generated controller index\n\nmodule.exports = {\n");
        StringBuilder routersIndex = new StringBuilder("// Auto-generated router index\n\nmodule.exports = {\n");

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass == null || eClass.isAbstract()) continue;

            // Service
            System.out.println("    Service: " + eClass.getName() + "Service");
            Map<String, Object> params = new HashMap<>();
            params.put("eClass", eClass);
            String code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseService.egl", params);
            writeToFile(MONGOOSE_SERVICES_DIR, eClass.getName() + "Service.js", code);
            servicesIndex.append("    ").append(eClass.getName()).append("Service: require('./").append(eClass.getName()).append("Service'),\n");

            // Controller
            System.out.println("    Controller: " + eClass.getName() + "Controller");
            params = new HashMap<>();
            params.put("eClass", eClass);
            code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseController.egl", params);
            writeToFile(MONGOOSE_CONTROLLERS_DIR, eClass.getName() + "Controller.js", code);
            controllersIndex.append("    ").append(eClass.getName()).append("Controller: require('./").append(eClass.getName()).append("Controller'),\n");

            // Router
            String routerName = eClass.getName().substring(0, 1).toLowerCase() + eClass.getName().substring(1) + "Router";
            System.out.println("    Router: " + routerName);
            params = new HashMap<>();
            params.put("eClass", eClass);
            code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseRouter.egl", params);
            writeToFile(MONGOOSE_ROUTERS_DIR, routerName + ".js", code);
            routersIndex.append("    ").append(routerName).append(": require('./").append(routerName).append("'),\n");
        }

        servicesIndex.append("};\n");
        controllersIndex.append("};\n");
        routersIndex.append("};\n");
        writeToFile(MONGOOSE_SERVICES_DIR, "index.js", servicesIndex.toString());
        writeToFile(MONGOOSE_CONTROLLERS_DIR, "index.js", controllersIndex.toString());
        writeToFile(MONGOOSE_ROUTERS_DIR, "index.js", routersIndex.toString());

        // Generate app.js
        System.out.println("    Generating app.js...");
        StringBuilder app = new StringBuilder();
        app.append("// Auto-generated Express app with Mongoose routes\n");
        app.append("// Generated from mogao_dt.ecore metamodel\n\n");
        app.append("const express = require('express');\n");
        app.append("const mongoose = require('mongoose');\n");
        app.append("const cors = require('cors');\n");
        app.append("const path = require('path');\n");
        app.append("const multer = require('multer');\n");
        app.append("const { v4: uuidv4 } = require('uuid');\n\n");
        app.append("const app = express();\n\n");
        app.append("// Middleware\n");
        app.append("app.use(cors());\n");
        app.append("app.use(express.json());\n\n");
        app.append("// Serve uploaded files\n");
        app.append("app.use('/exhibit_models', express.static(path.join(__dirname, 'exhibit_models')));\n\n");
        app.append("// Import routers\n");

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass == null || eClass.isAbstract()) continue;
            String routerName = eClass.getName().substring(0, 1).toLowerCase() + eClass.getName().substring(1) + "Router";
            app.append("const ").append(routerName).append(" = require('./routers/").append(routerName).append("');\n");
        }

        app.append("\n// Mount routes (no /api prefix to match existing frontend)\n");
        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass == null || eClass.isAbstract()) continue;
            String routerName = eClass.getName().substring(0, 1).toLowerCase() + eClass.getName().substring(1) + "Router";
            String routePath = pluralize(eClass.getName().substring(0, 1).toLowerCase() + eClass.getName().substring(1));
            app.append("app.use('/").append(routePath).append("', ").append(routerName).append(");\n");
        }

        app.append("\n// Health check endpoint\n");
        app.append("app.get('/health', (req, res) => {\n");
        app.append("    res.json({ status: 'UP', service: 'mogao-digital-twin' });\n");
        app.append("});\n\n");

        app.append("// File upload endpoint\n");
        app.append("const storage = multer.diskStorage({\n");
        app.append("    destination: (req, file, cb) => {\n");
        app.append("        const category = req.body.category || 'general';\n");
        app.append("        const uploadDir = path.join(__dirname, 'exhibit_models', category);\n");
        app.append("        const fs = require('fs');\n");
        app.append("        fs.mkdirSync(uploadDir, { recursive: true });\n");
        app.append("        cb(null, uploadDir);\n");
        app.append("    },\n");
        app.append("    filename: (req, file, cb) => {\n");
        app.append("        const ext = path.extname(file.originalname);\n");
        app.append("        cb(null, uuidv4() + ext);\n");
        app.append("    }\n");
        app.append("});\n");
        app.append("const upload = multer({ storage });\n\n");
        app.append("app.post('/api/upload', upload.single('file'), (req, res) => {\n");
        app.append("    if (!req.file) {\n");
        app.append("        return res.status(400).json({ error: 'No file uploaded' });\n");
        app.append("    }\n");
        app.append("    const category = req.body.category || 'general';\n");
        app.append("    const serverPath = '/exhibit_models/' + category + '/' + req.file.filename;\n");
        app.append("    res.json({ path: serverPath, originalName: req.file.originalname, size: req.file.size });\n");
        app.append("});\n\n");

        app.append("// MongoDB connection\n");
        app.append("const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mogao_dt';\n\n");
        app.append("mongoose.connect(MONGO_URI)\n");
        app.append("    .then(() => console.log('Connected to MongoDB'))\n");
        app.append("    .catch(err => console.error('MongoDB connection error:', err));\n\n");
        app.append("module.exports = app;\n");

        writeToFile(MONGOOSE_OUTPUT_DIR, "app.js", app.toString());

        // Generate server.js
        System.out.println("    Generating server.js...");
        StringBuilder server = new StringBuilder();
        server.append("const app = require('./app');\n\n");
        server.append("const PORT = process.env.PORT || 8008;\n\n");
        server.append("app.listen(PORT, () => {\n");
        server.append("    console.log('============================================');\n");
        server.append("    console.log('Mogao Digital Twin - Node.js Backend');\n");
        server.append("    console.log('============================================');\n");
        server.append("    console.log(`Server running on http://localhost:${PORT}`);\n");
        server.append("    console.log('============================================');\n");
        server.append("});\n");
        writeToFile(MONGOOSE_OUTPUT_DIR, "server.js", server.toString());

        // Generate package.json
        System.out.println("    Generating package.json...");
        StringBuilder pkg = new StringBuilder();
        pkg.append("{\n");
        pkg.append("    \"name\": \"mogao-digital-twin-backend\",\n");
        pkg.append("    \"version\": \"1.0.0\",\n");
        pkg.append("    \"description\": \"Mogao Digital Twin Node.js Backend - Auto-generated from mogao_dt.ecore\",\n");
        pkg.append("    \"main\": \"server.js\",\n");
        pkg.append("    \"scripts\": {\n");
        pkg.append("        \"start\": \"node server.js\",\n");
        pkg.append("        \"dev\": \"node --watch server.js\"\n");
        pkg.append("    },\n");
        pkg.append("    \"dependencies\": {\n");
        pkg.append("        \"cors\": \"^2.8.5\",\n");
        pkg.append("        \"express\": \"^4.18.2\",\n");
        pkg.append("        \"mongoose\": \"^8.0.0\",\n");
        pkg.append("        \"multer\": \"^1.4.5-lts.1\",\n");
        pkg.append("        \"uuid\": \"^9.0.0\"\n");
        pkg.append("    }\n");
        pkg.append("}\n");
        writeToFile(MONGOOSE_OUTPUT_DIR, "package.json", pkg.toString());
    }

    /**
     * Load the Ecore metamodel
     */
    private EPackage loadMetamodel() throws Exception {
        // Register XMI resource factory
        Resource.Factory.Registry.INSTANCE.getExtensionToFactoryMap()
            .put("ecore", new XMIResourceFactoryImpl());

        // Create resource set and load metamodel
        ResourceSet resourceSet = new ResourceSetImpl();

        URL metamodelUrl = getClass().getClassLoader().getResource(METAMODEL_PATH);
        if (metamodelUrl == null) {
            throw new RuntimeException("Metamodel not found: " + METAMODEL_PATH);
        }

        URI uri = URI.createURI(metamodelUrl.toString());
        Resource resource = resourceSet.getResource(uri, true);

        // Get the root package
        return (EPackage) resource.getContents().get(0);
    }

    /**
     * Pluralize a name following basic English rules
     */
    private String pluralize(String name) {
        // Irregular / uncountable nouns
        if (name.equalsIgnoreCase("coordinates")) return name;
        if (name.endsWith("s") || name.endsWith("x") || name.endsWith("z") || name.endsWith("sh") || name.endsWith("ch")) {
            return name + "es";
        } else if (name.endsWith("y") && !name.endsWith("ay") && !name.endsWith("ey") && !name.endsWith("oy") && !name.endsWith("uy")) {
            return name.substring(0, name.length() - 1) + "ies";
        } else {
            return name + "s";
        }
    }

    /**
     * Find an EClass by name in the package
     */
    private EClass findEClass(EPackage pkg, String name) {
        for (Object obj : pkg.getEClassifiers()) {
            if (obj instanceof EClass) {
                EClass eClass = (EClass) obj;
                if (eClass.getName().equals(name)) {
                    return eClass;
                }
            }
        }
        return null;
    }

    /**
     * Write generated code to file
     */
    private void writeToFile(String directory, String fileName, String content) throws Exception {
        File dir = new File(directory);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File file = new File(dir, fileName);
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }

    /**
     * Write generated EOL operation script to file
     */
    private void writeEOLFile(String directory, String fileName, String content) throws Exception {
        File dir = new File(directory);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File file = new File(dir, fileName);
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }
}
