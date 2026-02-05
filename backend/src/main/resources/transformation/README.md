# Model-to-Text Transformations

This directory contains EGL (Epsilon Generation Language) templates for generating Java code from the Mogao Digital Twin metamodel.

## Templates

### GenerateDTO.egl
Generates a Data Transfer Object (DTO) class from an EClass in the metamodel.

**Parameters:**
- `eClass`: The EClass to generate DTO for
- `packageName`: The package name for the DTO

**Usage:**
```java
Map<String, Object> params = new HashMap<>();
params.put("eClass", someEClass);
params.put("packageName", "digital.twin.mogao.dto");
String dtoCode = modelManager.executeEglTemplate("transformation/GenerateDTO.egl", params);
```

### GenerateService.egl
Generates a Service class from an EClass in the metamodel.

**Parameters:**
- `eClass`: The EClass to generate Service for
- `packageName`: The package name for the Service

### GenerateAllDTOs.egl
Main orchestration template that generates DTOs for all concrete classes in the metamodel.

## Running Transformations

Use the `EpsilonModelManager` to execute these templates:

```java
EpsilonModelManager manager = new EpsilonModelManager();
String result = manager.executeEglTemplate("transformation/GenerateAllDTOs.egl");
```

## Metamodel Reference

The transformations work with the `mogao_dt.ecore` metamodel located at:
`src/main/resources/metamodel/mogao_dt.ecore`

## Generated Code Location

Generated code will be placed in the `generated/` directory by default.
