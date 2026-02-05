# Mogao Digital Twin - Backend

Model-based backend using Eclipse Modeling Framework (EMF) and Epsilon for code generation.

## Quick Start

### 1. Build the Project

```bash
mvn clean install
```

This downloads all EMF and Epsilon dependencies.

### 2. Generate Code from Metamodel

**Windows:**
```bash
generate-code.bat
```

**Linux/Mac:**
```bash
./generate-code.sh
```

**Or using Maven directly:**
```bash
mvn clean compile
mvn exec:java
```

This generates:
- DTOs in `src/main/java/digital/twin/mogao/dto/`
- Service classes in `src/main/java/digital/twin/mogao/service/`

## Project Structure

```
backend/
├── src/main/
│   ├── java/
│   │   └── digital/twin/mogao/
│   │       ├── codegen/         # Code generation programs
│   │       ├── example/         # Usage examples
│   │       └── util/            # EpsilonModelManager
│   └── resources/
│       ├── metamodel/           # mogao_dt.ecore
│       ├── models/              # Model instances
│       │   └── instances/       # example.flexmi
│       ├── transformation/      # EGL templates
│       │   ├── GenerateDTO.egl
│       │   └── GenerateService.egl
│       └── eol-scripts/         # EOL helper operations
│           ├── cave/            # Cave operations
│           ├── defect/          # Defect operations
│           ├── exhibit/         # Exhibit operations
│           └── common/          # Model helpers
├── pom.xml
├── generate-code.bat           # Windows script
└── generate-code.sh            # Linux/Mac script
```

## Key Components

### Metamodel
- Location: [src/main/resources/metamodel/mogao_dt.ecore](src/main/resources/metamodel/mogao_dt.ecore)
- Defines the structure of the Mogao Digital Twin domain model
- Contains classes: Cave, Exhibit, Defect, etc.

### EGL Templates
Model-to-text transformations for code generation:
- [GenerateDTO.egl](src/main/resources/transformation/GenerateDTO.egl) - Generates Data Transfer Objects
- [GenerateService.egl](src/main/resources/transformation/GenerateService.egl) - Generates Service classes

### EOL Scripts
Helper operations for model manipulation:
- **Cave**: CRUD operations, get exhibits/defects, environment readings
- **Defect**: Filter by type/severity, mark urgent, update treatment
- **Exhibit**: Operations for all exhibit types (Statue, Mural, Painting, Inscription)
- **Common**: Statistics, validation, utilities

### Code Generator
- Main class: [CodeGenerator.java](src/main/java/digital/twin/mogao/codegen/CodeGenerator.java)
- Loads metamodel and generates DTOs and Services
- Configured in POM with exec-maven-plugin

## Usage Examples

### Generate Code
```bash
./generate-code.sh
```

### Run Example Program
```java
// See: src/main/java/digital/twin/mogao/example/TransformationExample.java
EpsilonModelManager manager = new EpsilonModelManager();

// Execute EOL operation
Object caves = manager.executeEolOperation(
    "eol-scripts/cave/CaveOperations.eol",
    "getAllCaves"
);

// Generate DTO using EGL template
Map<String, Object> params = Map.of(
    "eClass", caveClass,
    "packageName", "digital.twin.mogao.dto"
);
String dtoCode = manager.executeEglTemplate(
    "transformation/GenerateDTO.egl",
    params
);
```

## Documentation

- [RUN_TRANSFORMATIONS.md](src/main/resources/transformation/RUN_TRANSFORMATIONS.md) - Detailed transformation guide
- [Models README](src/main/resources/models/README.md) - Model instance creation guide

## Dependencies

- Eclipse EMF 2.23.0
- Epsilon 2.8.0 (EOL, EGL, ETL, EVL engines)
- SLF4J / Logback for logging
- Java 17

## Maven Goals

```bash
mvn clean compile      # Compile the project
mvn exec:java          # Run code generator
mvn test               # Run tests
mvn clean install      # Full build
```
