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

    // Frontend generation constants
    private static final String FRONTEND_OUTPUT_DIR = "../frontend/";
    private static final String COMPONENTS_DIR = FRONTEND_OUTPUT_DIR + "components/";
    private static final String COMPOSABLES_DIR = FRONTEND_OUTPUT_DIR + "composables/";

    // EOL scripts generation constants
    private static final String EOL_SCRIPTS_OUTPUT_DIR = "src/main/resources/eol-scripts/";

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

            // Generate Frontend Components
            System.out.println("\nGenerating Frontend Components...");
            generator.generateFrontendComponents();

            // Generate Composables
            System.out.println("\nGenerating Composables...");
            generator.generateComposables();

            // Generate App.js
            System.out.println("\nGenerating App.js...");
            generator.generateApp();

            // Generate i18n
            System.out.println("\nGenerating i18n...");
            generator.generateI18n();

            // Generate index.html
            System.out.println("\nGenerating index.html...");
            generator.generateIndexHtml();

            // Generate EOL Operation Scripts
            System.out.println("\nGenerating EOL Operation Scripts...");
            generator.generateEOLOperations();

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
     * Generate Frontend Components (Card, Form, List) for main entity classes
     */
    public void generateFrontendComponents() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        // Entity classes we want to generate components for
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        // Component templates to generate
        String[] templates = {"GenerateVueCard.egl", "GenerateVueForm.egl", "GenerateVueList.egl", "GenerateVueDetailView.egl"};
        String[] suffixes = {"Card.js", "Form.js", "List.js", "DetailView.js"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);

            if (eClass != null) {
                // Generate each component type
                for (int i = 0; i < templates.length; i++) {
                    System.out.println("  Generating " + suffixes[i] + " for: " + eClass.getName());

                    // Prepare parameters for EGL template
                    Map<String, Object> params = new HashMap<>();
                    params.put("eClass", eClass);

                    // Execute EGL template
                    String generatedCode = manager.executeEglTemplateWithoutModel("transformation/frontend/" + templates[i], params);

                    // Write to file
                    String fileName = eClass.getName() + suffixes[i];
                    writeFrontendFile(COMPONENTS_DIR, fileName, generatedCode);

                    System.out.println("    -> Generated: " + COMPONENTS_DIR + fileName);
                }
            } else {
                System.out.println("  Warning: Class not found: " + className);
            }
        }
    }

    /**
     * Generate Composables for main entity classes
     */
    public void generateComposables() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        // Entity classes we want to generate composables for
        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);

            if (eClass != null) {
                System.out.println("  Generating Composable for: " + eClass.getName());

                // Prepare parameters for EGL template
                Map<String, Object> params = new HashMap<>();
                params.put("eClass", eClass);

                // Execute EGL template
                String generatedCode = manager.executeEglTemplateWithoutModel("transformation/frontend/GenerateComposable.egl", params);

                // Write to file
                String fileName = "use" + eClass.getName() + "s.js";
                writeFrontendFile(COMPOSABLES_DIR, fileName, generatedCode);

                System.out.println("    -> Generated: " + COMPOSABLES_DIR + fileName);
            } else {
                System.out.println("  Warning: Class not found: " + className);
            }
        }
    }

    /**
     * Generate App.js - Main Vue application
     */
    public void generateApp() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        System.out.println("  Generating App.js...");

        // Prepare parameters for EGL template
        Map<String, Object> params = new HashMap<>();
        params.put("ePackage", metamodel);

        // Execute EGL template
        String generatedCode = manager.executeEglTemplateWithoutModel("transformation/frontend/GenerateApp.egl", params);

        // Write to file
        String fileName = "app.js";
        writeFrontendFile(FRONTEND_OUTPUT_DIR, fileName, generatedCode);

        System.out.println("    -> Generated: " + FRONTEND_OUTPUT_DIR + fileName);
    }

    /**
     * Generate i18n - Internationalization language resources
     */
    public void generateI18n() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        System.out.println("  Generating i18n.js...");

        // Prepare parameters for EGL template
        Map<String, Object> params = new HashMap<>();
        params.put("ePackage", metamodel);

        // Execute EGL template
        String generatedCode = manager.executeEglTemplateWithoutModel("transformation/frontend/GenerateI18n.egl", params);

        // Write to file
        String fileName = "i18n.js";
        writeFrontendFile(FRONTEND_OUTPUT_DIR, fileName, generatedCode);

        System.out.println("    -> Generated: " + FRONTEND_OUTPUT_DIR + fileName);
    }

    /**
     * Generate index.html - Main HTML entry point
     */
    public void generateIndexHtml() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel
        EPackage metamodel = loadMetamodel();

        System.out.println("  Generating index.html...");

        // Prepare parameters for EGL template
        Map<String, Object> params = new HashMap<>();
        params.put("ePackage", metamodel);

        // Execute EGL template
        String generatedCode = manager.executeEglTemplateWithoutModel("transformation/frontend/GenerateIndexHtml.egl", params);

        // Write to file
        String fileName = "index.html";
        writeFrontendFile(FRONTEND_OUTPUT_DIR, fileName, generatedCode);

        System.out.println("    -> Generated: " + FRONTEND_OUTPUT_DIR + fileName);
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
     * Write generated frontend code to file
     */
    private void writeFrontendFile(String directory, String fileName, String content) throws Exception {
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
