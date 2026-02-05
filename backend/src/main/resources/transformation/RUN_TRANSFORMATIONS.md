# How to Run EGL Transformations

This guide explains how to generate Java code from the Mogao Digital Twin metamodel using EGL transformations.

## Prerequisites

1. Build the project to download dependencies:
   ```bash
   cd backend
   mvn clean install
   ```

2. Ensure the metamodel exists at:
   ```
   src/main/resources/metamodel/mogao_dt.ecore
   ```

## Running the Code Generator

### Method 1: Using the Convenience Scripts (Easiest)

**Windows:**
```bash
cd backend
generate-code.bat
```

**Linux/Mac:**
```bash
cd backend
./generate-code.sh
```

### Method 2: Using Maven Directly

```bash
cd backend
mvn clean compile
mvn exec:java
```

### Method 3: From Your IDE

1. Open `digital.twin.mogao.codegen.CodeGenerator`
2. Right-click → "Run as Java Application"

This will:
- Generate DTO classes for all concrete classes in the metamodel
- Generate Service classes for main entities (Cave, Defect, Exhibit types)
- Output files to `generated/dto/` and `generated/service/`

### Method 2: Using EpsilonModelManager Directly

```java
EpsilonModelManager manager = new EpsilonModelManager();

// Load the metamodel and get an EClass
EClass caveClass = ...; // get from metamodel

// Prepare parameters
Map<String, Object> params = new HashMap<>();
params.put("eClass", caveClass);
params.put("packageName", "digital.twin.mogao.dto");

// Execute EGL template
String dtoCode = manager.executeEglTemplate("transformation/GenerateDTO.egl", params);

// Write to file or use the generated code
```

### Method 3: Custom Generation Script

Create your own EOL/EGL script that orchestrates the generation:

```java
EpsilonModelManager manager = new EpsilonModelManager();
String result = manager.executeEolScript("transformation/CustomGenerator.eol");
```

## Generated Output

Generated files will be placed in:

```
backend/
  generated/
    dto/
      CaveDTO.java
      DefectDTO.java
      CoordinatesDTO.java
      StatueDTO.java
      MuralDTO.java
      ... etc
    service/
      CaveService.java
      DefectService.java
      ... etc
```

## Customizing Templates

Edit the EGL templates to customize code generation:

- **DTO Template**: `src/main/resources/transformation/GenerateDTO.egl`
- **Service Template**: `src/main/resources/transformation/GenerateService.egl`

## Template Parameters

### GenerateDTO.egl
- `eClass` (EClass): The metamodel class to generate DTO for
- `packageName` (String): Target package name

### GenerateService.egl
- `eClass` (EClass): The metamodel class to generate Service for
- `packageName` (String): Target package name

## Example: Generate Single DTO

```java
import digital.twin.mogao.util.EpsilonModelManager;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EPackage;
// ... other imports

public class GenerateSingleDTO {
    public static void main(String[] args) throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();

        // Load metamodel (simplified)
        EPackage pkg = loadMetamodel();
        EClass defectClass = (EClass) pkg.getEClassifier("Defect");

        // Generate DTO
        Map<String, Object> params = Map.of(
            "eClass", defectClass,
            "packageName", "digital.twin.mogao.dto"
        );

        String dtoCode = manager.executeEglTemplate(
            "transformation/GenerateDTO.egl",
            params
        );

        System.out.println(dtoCode);
    }
}
```

## Troubleshooting

### "Template not found" error
- Ensure templates are in `src/main/resources/transformation/`
- Check the template path is correct (relative to resources directory)

### "Metamodel not found" error
- Verify `src/main/resources/metamodel/mogao_dt.ecore` exists
- Check the file is valid Ecore format

### Classpath issues
- Run `mvn clean install` to ensure all dependencies are downloaded
- Check that Epsilon and EMF dependencies are in the POM
