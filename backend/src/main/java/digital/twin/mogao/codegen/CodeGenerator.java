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
 * Code Generator using Epsilon EGL transformations.
 *
 * Build-time tool. Reads the Ecore metamodel at metamodel/mogao_dt.ecore
 * and dispatches to the EGL templates under transformation/.
 *
 * History: this generator originally emitted a Java/Micronaut backend
 * (DTOs, services, controllers) plus EOL operation scripts. The runtime
 * backend has since been re-implemented in Node.js + Express + Mongoose
 * (see backend/generated/mongoose/). The Java-backend EGL templates and
 * their dispatch methods have been removed (Phase 1).
 *
 * Status of the remaining generators:
 *   - Mongoose backend: scaffolding kept in generateMongooseBackend(),
 *     not invoked from main(). The shipped Mongoose code in
 *     backend/generated/mongoose/ has been hand-extended with telemetry,
 *     anomaly detection, maintenance queue, replay caching, and per-
 *     exhibit defect log endpoints; running the current generator would
 *     clobber those. Phase 2 will redesign the Mongoose pipeline with
 *     fenced extension regions before re-enabling auto-generation.
 *   - EOL operations: kept in generateEOLOperations(), not invoked.
 *   - Frontend (Vue 3): EGL templates exist at transformation/frontend/
 *     but are not yet wired into this Java entry point — see
 *     transformation/RUN_TRANSFORMATIONS.md for ad-hoc invocation.
 *
 * For now, running `mvn exec:java@codegen` is a no-op. The metamodel and
 * EGL templates remain in place as the source of truth for the upcoming
 * Phase 2 regeneration work.
 */
public class CodeGenerator {

    private static final String METAMODEL_PATH = "metamodel/mogao_dt.ecore";

    // Mongoose backend output (used only by the deferred generator below)
    private static final String MONGOOSE_OUTPUT_DIR     = "generated/mongoose/";
    private static final String MONGOOSE_MODELS_DIR     = MONGOOSE_OUTPUT_DIR + "models/";
    private static final String MONGOOSE_SERVICES_DIR   = MONGOOSE_OUTPUT_DIR + "services/";
    private static final String MONGOOSE_CONTROLLERS_DIR = MONGOOSE_OUTPUT_DIR + "controllers/";
    private static final String MONGOOSE_ROUTERS_DIR    = MONGOOSE_OUTPUT_DIR + "routers/";

    // EOL scripts output (used only by the deferred generator below)
    private static final String EOL_SCRIPTS_OUTPUT_DIR = "src/main/resources/eol-scripts/";

    public static void main(String[] args) {
        System.out.println("=== Mogao Digital Twin Code Generator ===");
        System.out.println();
        System.out.println("Phase 1: the Java/Micronaut backend has been retired.");
        System.out.println("Phase 2: Mongoose backend regeneration is being redesigned");
        System.out.println("        to preserve hand-extended business logic via fenced");
        System.out.println("        extension regions; auto-generation is disabled until");
        System.out.println("        that landing.");
        System.out.println();
        System.out.println("To regenerate manually, see backend/src/main/resources/");
        System.out.println("transformation/RUN_TRANSFORMATIONS.md.");
        System.out.println();
        System.out.println("=== No code generated. ===");
    }

    // ── Deferred (Phase 2) ──────────────────────────────────────────────
    //
    // The methods below are intentionally kept as scaffolding for the
    // upcoming Mongoose-and-frontend regeneration pipeline. They are not
    // called from main(); enabling them today would overwrite the
    // hand-extended runtime backend at backend/generated/mongoose/.

    /**
     * Generate the Mongoose backend stack (models, services, controllers,
     * routers, app.js, server.js, package.json) for every concrete class
     * in the metamodel. Currently disabled — see class-level Javadoc.
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

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass == null || eClass.isAbstract()) continue;

            Map<String, Object> params = new HashMap<>();
            params.put("eClass", eClass);

            String code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseService.egl", params);
            writeToFile(MONGOOSE_SERVICES_DIR, eClass.getName() + "Service.js", code);

            params = new HashMap<>();
            params.put("eClass", eClass);
            code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseController.egl", params);
            writeToFile(MONGOOSE_CONTROLLERS_DIR, eClass.getName() + "Controller.js", code);

            String routerName = eClass.getName().substring(0, 1).toLowerCase() + eClass.getName().substring(1) + "Router";
            params = new HashMap<>();
            params.put("eClass", eClass);
            code = manager.executeEglTemplateWithoutModel("transformation/mongodb/GenerateMongooseRouter.egl", params);
            writeToFile(MONGOOSE_ROUTERS_DIR, routerName + ".js", code);
        }
    }

    /**
     * Generate EOL operation scripts for entity classes. Currently
     * disabled — see class-level Javadoc.
     */
    public void generateEOLOperations() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();
        EPackage metamodel = loadMetamodel();

        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass == null) continue;

            Map<String, Object> params = new HashMap<>();
            params.put("eClass", eClass);

            String generatedCode = manager.executeEglTemplateWithoutModel("transformation/eol/GenerateEOLOperations.egl", params);
            writeEOLFile(EOL_SCRIPTS_OUTPUT_DIR + className.toLowerCase() + "/",
                         eClass.getName() + "Operations.eol", generatedCode);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private EPackage loadMetamodel() throws Exception {
        Resource.Factory.Registry.INSTANCE.getExtensionToFactoryMap()
            .put("ecore", new XMIResourceFactoryImpl());
        ResourceSet resourceSet = new ResourceSetImpl();

        URL metamodelUrl = getClass().getClassLoader().getResource(METAMODEL_PATH);
        if (metamodelUrl == null) {
            throw new RuntimeException("Metamodel not found: " + METAMODEL_PATH);
        }
        URI uri = URI.createURI(metamodelUrl.toString());
        Resource resource = resourceSet.getResource(uri, true);
        return (EPackage) resource.getContents().get(0);
    }

    private EClass findEClass(EPackage pkg, String name) {
        for (Object obj : pkg.getEClassifiers()) {
            if (obj instanceof EClass) {
                EClass eClass = (EClass) obj;
                if (eClass.getName().equals(name)) return eClass;
            }
        }
        return null;
    }

    private void writeToFile(String directory, String fileName, String content) throws Exception {
        File dir = new File(directory);
        if (!dir.exists()) dir.mkdirs();
        File file = new File(dir, fileName);
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }

    private void writeEOLFile(String directory, String fileName, String content) throws Exception {
        File dir = new File(directory);
        if (!dir.exists()) dir.mkdirs();
        File file = new File(dir, fileName);
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }
}
