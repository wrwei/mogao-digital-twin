package digital.twin.mogao.util;

import jakarta.inject.Singleton;
import org.eclipse.epsilon.eol.EolModule;
import org.eclipse.epsilon.egl.EglTemplateFactory;
import org.eclipse.epsilon.emc.emf.EmfModel;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EPackage;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.xmi.impl.EcoreResourceFactoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Epsilon Model Manager for Mogao Digital Twin
 * Handles loading/saving EMF models and executing EOL/EGL scripts
 */
@Singleton
public class EpsilonModelManager {

    private static final Logger LOG = LoggerFactory.getLogger(EpsilonModelManager.class);

    // Model file paths
    private static final String MODEL_PATH = "models/instances/mogao.model";
    private static final String METAMODEL_PATH = "metamodel/mogao_dt.ecore";
    private static final String INIT_SCRIPT_PATH = "eol-scripts/common/InitializeModel.eol";

    // Read-write lock for thread safety
    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    /**
     * Load EMF model
     */
    public EmfModel loadModel() throws Exception {
        lock.readLock().lock();
        try {
            LOG.info("Loading EMF model: {}", MODEL_PATH);

            // Register Ecore resource factory for .ecore files
            Resource.Factory.Registry.INSTANCE.getExtensionToFactoryMap()
                .putIfAbsent("ecore", new EcoreResourceFactoryImpl());

            // Load and register the metamodel
            URL metamodelUrl = getClass().getClassLoader().getResource(METAMODEL_PATH);
            if (metamodelUrl == null) {
                throw new RuntimeException("Metamodel file not found: " + METAMODEL_PATH);
            }

            ResourceSet resourceSet = new ResourceSetImpl();
            Resource metamodelResource = resourceSet.getResource(
                URI.createURI(metamodelUrl.toString()), true);

            if (!metamodelResource.getContents().isEmpty()) {
                EPackage ePackage = (EPackage) metamodelResource.getContents().get(0);
                // Register the package in the global registry
                EPackage.Registry.INSTANCE.put(ePackage.getNsURI(), ePackage);
                LOG.info("Registered metamodel package: {} with URI: {}",
                    ePackage.getName(), ePackage.getNsURI());
            }

            // Create and configure EmfModel
            EmfModel model = new EmfModel();
            model.setName("M");
            model.setReadOnLoad(true);
            model.setStoredOnDisposal(false);

            // Set metamodel and model files
            File metamodelFile = new File(metamodelUrl.toURI());
            model.setMetamodelFile(metamodelFile.getAbsolutePath());

            URL modelUrl = getClass().getClassLoader().getResource(MODEL_PATH);
            if (modelUrl == null) {
                throw new RuntimeException("Model file not found: " + MODEL_PATH);
            }
            File modelFile = new File(modelUrl.toURI());
            model.setModelFile(modelFile.getAbsolutePath());

            // Load model
            model.load();

            LOG.info("Model loaded successfully with {} root elements",
                model.getResource() != null ? model.getResource().getContents().size() : 0);

            return model;

        } catch (Exception e) {
            LOG.error("Failed to load model", e);
            throw e;
        } finally {
            lock.readLock().unlock();
        }
    }

    /**
     * Initialize model with demo data if empty
     */
    private void initializeModelIfEmpty(EmfModel model) throws Exception {
        try {
            // Check if model has any Cave objects
            EolModule checkModule = new EolModule();
            checkModule.parse("return Cave.all.size();");
            checkModule.getContext().getModelRepository().addModel(model);
            Object result = checkModule.execute();
            checkModule.getContext().getModelRepository().dispose();

            int caveCount = result instanceof Integer ? (Integer) result : 0;

            if (caveCount == 0) {
                LOG.info("Model is empty, initializing with demo data...");

                // Execute initialization script
                EolModule initModule = new EolModule();
                URL scriptUrl = getClass().getClassLoader().getResource(INIT_SCRIPT_PATH);
                if (scriptUrl != null) {
                    File scriptFile = new File(scriptUrl.toURI());
                    initModule.parse(scriptFile);
                    initModule.getContext().getModelRepository().addModel(model);
                    initModule.execute();
                    initModule.getContext().getModelRepository().dispose();

                    // Save the initialized model
                    saveModel(model);
                    LOG.info("Model initialized successfully");
                } else {
                    LOG.warn("Initialization script not found: {}", INIT_SCRIPT_PATH);
                }
            }
        } catch (Exception e) {
            LOG.warn("Failed to initialize model: {}", e.getMessage());
            // Don't throw - allow empty model to be used
        }
    }

    /**
     * Save model (to source file, not target/classes)
     */
    public void saveModel(EmfModel model) throws Exception {
        lock.writeLock().lock();
        try {
            LOG.info("Saving EMF model");

            // Get model file classpath
            URL modelUrl = getClass().getClassLoader().getResource(MODEL_PATH);
            if (modelUrl == null) {
                throw new RuntimeException("Model file not found: " + MODEL_PATH);
            }

            // Get file path
            String path = modelUrl.getPath();
            if (path.startsWith("/") && System.getProperty("os.name").toLowerCase().contains("windows")) {
                path = path.substring(1);
            }

            // Replace target/classes with src/main/resources
            // This ensures changes are saved to source files and won't be lost on recompilation
            path = path.replace("target\\classes", "src\\main\\resources")
                       .replace("target/classes", "src/main/resources");

            File modelFile = new File(path);

            // Ensure parent directory exists
            if (!modelFile.getParentFile().exists()) {
                modelFile.getParentFile().mkdirs();
            }

            Resource resource = model.getResource();
            resource.setURI(URI.createFileURI(modelFile.getAbsolutePath()));

            // Use proper XMI save options
            Map<Object, Object> saveOptions = new HashMap<>();
            saveOptions.put(org.eclipse.emf.ecore.xmi.XMLResource.OPTION_SAVE_TYPE_INFORMATION, Boolean.TRUE);
            saveOptions.put(org.eclipse.emf.ecore.xmi.XMLResource.OPTION_SCHEMA_LOCATION, Boolean.TRUE);
            saveOptions.put(org.eclipse.emf.ecore.xmi.XMLResource.OPTION_EXTENDED_META_DATA, Boolean.TRUE);
            saveOptions.put(org.eclipse.emf.ecore.xmi.XMLResource.OPTION_ENCODING, "UTF-8");

            resource.save(saveOptions);

            LOG.info("Model saved successfully: {}", modelFile.getAbsolutePath());

        } catch (Exception e) {
            LOG.error("Failed to save model", e);
            throw e;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Execute EOL script
     * @param scriptPath EOL script path (relative to resources directory)
     * @param parameters Script parameters
     * @return Execution result
     */
    public Object executeEolScript(String scriptPath, Map<String, Object> parameters) throws Exception {
        EmfModel model = null;
        EolModule module = null;

        try {
            // Load model
            model = loadModel();

            // Create EOL module
            module = new EolModule();

            // Load EOL script
            URL scriptUrl = getClass().getClassLoader().getResource(scriptPath);
            if (scriptUrl == null) {
                throw new RuntimeException("EOL script not found: " + scriptPath);
            }

            module.parse(new java.net.URI(scriptUrl.toString()));

            // Add model to context
            module.getContext().getModelRepository().addModel(model);

            // Set parameters
            if (parameters != null) {
                for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                    module.getContext().getFrameStack().put(entry.getKey(), entry.getValue());
                }
            }

            // Execute script
            LOG.info("Executing EOL script: {}", scriptPath);
            Object result = module.execute();

            // Save model if modified
            if (isModifyingScript(scriptPath)) {
                saveModel(model);
            }

            return result;

        } catch (Exception e) {
            LOG.error("Failed to execute EOL script: {}", scriptPath, e);
            throw e;
        } finally {
            // Clean up resources
            if (module != null) {
                module.getContext().getModelRepository().dispose();
            }
            if (model != null) {
                model.dispose();
            }
        }
    }

    /**
     * Execute EOL script (no parameters)
     */
    public Object executeEolScript(String scriptPath) throws Exception {
        return executeEolScript(scriptPath, null);
    }

    /**
     * Execute EGL template for code generation
     * @param templatePath EGL template path (relative to resources directory)
     * @param parameters Template parameters
     * @return Generated text
     */
    public String executeEglTemplate(String templatePath, Map<String, Object> parameters) throws Exception {
        EmfModel model = null;
        EglTemplateFactory templateFactory = null;

        try {
            // Load model
            model = loadModel();

            // Create EGL template factory
            templateFactory = new EglTemplateFactory();
            templateFactory.getContext().getModelRepository().addModel(model);

            // Set parameters
            if (parameters != null) {
                for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                    templateFactory.getContext().getFrameStack().put(entry.getKey(), entry.getValue());
                }
            }

            // Load EGL template
            URL templateUrl = getClass().getClassLoader().getResource(templatePath);
            if (templateUrl == null) {
                throw new RuntimeException("EGL template not found: " + templatePath);
            }

            File templateFile = new File(templateUrl.toURI());

            // Execute template
            LOG.info("Executing EGL template: {}", templatePath);
            String result = templateFactory.load(templateFile.toURI()).process();

            return result != null ? result : "";

        } catch (Exception e) {
            LOG.error("Failed to execute EGL template: {}", templatePath, e);
            throw e;
        } finally {
            // Clean up resources
            if (templateFactory != null) {
                templateFactory.getContext().getModelRepository().dispose();
            }
            if (model != null) {
                model.dispose();
            }
        }
    }

    /**
     * Execute EGL template (no parameters)
     */
    public String executeEglTemplate(String templatePath) throws Exception {
        return executeEglTemplate(templatePath, null);
    }

    /**
     * Execute EGL template without loading a model instance (for code generation from metamodel)
     * @param templatePath EGL template path (relative to resources directory)
     * @param parameters Template parameters (should include metamodel elements like EClass)
     * @return Generated text
     */
    public String executeEglTemplateWithoutModel(String templatePath, Map<String, Object> parameters) throws Exception {
        EglTemplateFactory templateFactory = null;

        try {
            // Create EGL template factory (no model loading)
            templateFactory = new EglTemplateFactory();

            // Set parameters
            if (parameters != null) {
                for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                    templateFactory.getContext().getFrameStack().put(entry.getKey(), entry.getValue());
                }
            }

            // Load EGL template
            URL templateUrl = getClass().getClassLoader().getResource(templatePath);
            if (templateUrl == null) {
                throw new RuntimeException("EGL template not found: " + templatePath);
            }

            File templateFile = new File(templateUrl.toURI());

            // Execute template
            LOG.info("Executing EGL template (no model): {}", templatePath);
            String result = templateFactory.load(templateFile.toURI()).process();

            return result != null ? result : "";

        } catch (Exception e) {
            LOG.error("Failed to execute EGL template: {}", templatePath, e);
            throw e;
        } finally {
            // Clean up resources
            if (templateFactory != null) {
                templateFactory.getContext().dispose();
            }
        }
    }

    /**
     * Call an EOL operation directly
     * @param baseScriptPath Base script path (provides imports and operation definitions)
     * @param operationName Operation name to call (e.g., "getDefects")
     * @param parameters Operation parameters
     * @return Execution result
     */
    public Object executeEolOperation(String baseScriptPath, String operationName, Object... parameters) throws Exception {
        EmfModel model = null;
        EolModule module = null;

        try {
            model = loadModel();
            module = new EolModule();

            // Load base script file
            URL scriptUrl = getClass().getClassLoader().getResource(baseScriptPath);
            if (scriptUrl == null) {
                throw new RuntimeException("EOL script not found: " + baseScriptPath);
            }

            File scriptFile = new File(scriptUrl.toURI());

            LOG.info("Executing EOL operation: {}", operationName);

            // Parse script
            module.parse(scriptFile);

            // Add model to context
            module.getContext().getModelRepository().addModel(model);

            // Find operation
            org.eclipse.epsilon.eol.dom.Operation operation = null;
            for (org.eclipse.epsilon.eol.dom.Operation op : module.getOperations()) {
                if (op.getName().equals(operationName)) {
                    operation = op;
                    break;
                }
            }

            if (operation == null) {
                throw new RuntimeException("Operation not found: " + operationName);
            }

            // Execute operation (convert parameters array to List)
            Object result = operation.execute(null, java.util.Arrays.asList(parameters), module.getContext());

            // If it's a modifying operation (setter), save model
            if (operationName.toLowerCase().startsWith("set") ||
                operationName.toLowerCase().startsWith("create") ||
                operationName.toLowerCase().startsWith("update") ||
                operationName.toLowerCase().startsWith("delete")) {
                saveModel(model);
            }

            return result;

        } catch (Exception e) {
            LOG.error("Failed to execute EOL operation: {}", operationName, e);
            throw e;
        } finally {
            if (module != null) {
                module.getContext().getModelRepository().dispose();
            }
            if (model != null) {
                model.dispose();
            }
        }
    }

    /**
     * Batch execute multiple EOL operations (load model once, save once)
     * @param baseScriptPath EOL script path
     * @param operations List of operations to execute (name -> parameters)
     */
    public void executeBatchOperations(String baseScriptPath, java.util.List<OperationCall> operations) throws Exception {
        EmfModel model = null;
        EolModule module = null;

        try {
            model = loadModel();
            module = new EolModule();

            // Load base script file
            URL scriptUrl = getClass().getClassLoader().getResource(baseScriptPath);
            if (scriptUrl == null) {
                throw new RuntimeException("EOL script not found: " + baseScriptPath);
            }

            File scriptFile = new File(scriptUrl.toURI());

            LOG.info("Batch executing {} EOL operations", operations.size());

            // Parse script
            module.parse(scriptFile);

            // Add model to context
            module.getContext().getModelRepository().addModel(model);

            // Execute all operations sequentially
            for (OperationCall opCall : operations) {
                // Find operation
                org.eclipse.epsilon.eol.dom.Operation operation = null;
                for (org.eclipse.epsilon.eol.dom.Operation op : module.getOperations()) {
                    if (op.getName().equals(opCall.getName())) {
                        operation = op;
                        break;
                    }
                }

                if (operation == null) {
                    throw new RuntimeException("Operation not found: " + opCall.getName());
                }

                // Execute operation
                LOG.info("  - Executing: {}", opCall.getName());
                operation.execute(null, opCall.getParameters(), module.getContext());
            }

            // Batch save model (save only once)
            saveModel(model);
            LOG.info("Batch operations completed, model saved");

        } catch (Exception e) {
            LOG.error("Failed to batch execute EOL operations", e);
            throw e;
        } finally {
            if (module != null) {
                module.getContext().getModelRepository().dispose();
            }
            if (model != null) {
                model.dispose();
            }
        }
    }

    /**
     * Operation call wrapper
     */
    public static class OperationCall {
        private String name;
        private java.util.List<Object> parameters;

        public OperationCall(String name, Object... parameters) {
            this.name = name;
            this.parameters = java.util.Arrays.asList(parameters);
        }

        public String getName() {
            return name;
        }

        public java.util.List<Object> getParameters() {
            return parameters;
        }
    }

    /**
     * Check if script modifies the model
     */
    private boolean isModifyingScript(String scriptPath) {
        // Scripts containing set, create, delete, update keywords are considered modifying scripts
        String lowerPath = scriptPath.toLowerCase();
        return lowerPath.contains("set") ||
               lowerPath.contains("create") ||
               lowerPath.contains("delete") ||
               lowerPath.contains("update");
    }
}
