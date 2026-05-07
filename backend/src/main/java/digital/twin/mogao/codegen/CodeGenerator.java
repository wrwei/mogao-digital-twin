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
 * (see backend/generated/mongoose/).
 *
 * What this generator emits today:
 *   - One Mongoose model per EClass in the metamodel (concrete and
 *     abstract), and a models/index.js that re-exports the schemas.
 *   - Per-entity Service, Controller, and Router for the 13 concrete
 *     EClasses listed in the entityClasses array below.
 *
 * What this generator deliberately does NOT emit (treated as
 * hand-written infrastructure outside the metamodel's remit):
 *   - app.js, server.js, package.json — auth, telemetry, sensor admin,
 *     maintenance, deterioration, file-upload, MongoDB connect.
 *   - services/index.js, controllers/index.js, routers/index.js —
 *     the live versions are correct and the generator does not
 *     overwrite them; new entities must be added to those indexes
 *     by hand.
 *   - Hand-written services for entities not in the metamodel
 *     (User, Sensor, EnvironmentSample) and the cross-cutting domain
 *     services (Anomaly, Maintenance, Telemetry, DeteriorationReplay,
 *     Exhibit, Validation, Deterioration). These live alongside the
 *     generated CRUD layer and consume it.
 *
 * generateEOLOperations() remains as scaffolding but is not invoked
 * from main(). The frontend EGL templates at transformation/frontend/
 * are also not yet wired to this Java entry point — see
 * transformation/RUN_TRANSFORMATIONS.md for ad-hoc invocation.
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
        try {
            System.out.println("=== Mogao Digital Twin Code Generator ===");
            System.out.println();

            CodeGenerator generator = new CodeGenerator();

            System.out.println("Generating Mongoose backend (data layer)...");
            generator.generateMongooseBackend();

            System.out.println();
            System.out.println("=== Code generation complete. ===");
            System.out.println();
            System.out.println("Note: app.js, server.js, package.json, and the");
            System.out.println("services/controllers/routers index.js files are NOT");
            System.out.println("regenerated — they are hand-written infrastructure");
            System.out.println("outside the metamodel's remit (see Javadoc).");
        } catch (Exception e) {
            System.err.println("Code generation failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Generate the Mongoose data layer for every EClass in the metamodel:
     *   - one models/X.js per EClass (concrete + abstract) plus models/index.js
     *   - one services/XService.js, controllers/XController.js, and
     *     routers/xRouter.js per concrete EClass listed in entityClasses
     *
     * Does NOT emit app.js, server.js, package.json, or the
     * services/controllers/routers index.js files — those are hand-written
     * infrastructure. See class-level Javadoc.
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
