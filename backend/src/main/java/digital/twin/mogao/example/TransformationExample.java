package digital.twin.mogao.example;

import digital.twin.mogao.util.EpsilonModelManager;

/**
 * Example demonstrating how to use EGL transformations and EOL scripts
 */
public class TransformationExample {

    public static void main(String[] args) {
        try {
            EpsilonModelManager manager = new EpsilonModelManager();

            // Example 1: Execute EOL script to get all caves
            System.out.println("=== Example 1: Get All Caves ===");
            Object caves = manager.executeEolOperation(
                "eol-scripts/cave/CaveOperations.eol",
                "getAllCaves"
            );
            System.out.println("Caves: " + caves);

            // Example 2: Execute EOL script with parameters
            System.out.println("\n=== Example 2: Get Cave by GID ===");
            Object cave = manager.executeEolOperation(
                "eol-scripts/cave/CaveOperations.eol",
                "getCaveByGid",
                "cave-001"
            );
            System.out.println("Cave: " + cave);

            // Example 3: Get defect statistics
            System.out.println("\n=== Example 3: Get Defect Statistics ===");
            Object stats = manager.executeEolOperation(
                "eol-scripts/common/ModelHelpers.eol",
                "getDefectStatistics"
            );
            System.out.println("Defect Statistics: " + stats);

            // Example 4: Generate DTO using EGL template
            System.out.println("\n=== Example 4: Generate DTO ===");
            // Note: This would require loading the metamodel and passing an EClass
            // Map<String, Object> params = new HashMap<>();
            // params.put("eClass", someEClass);
            // params.put("packageName", "digital.twin.mogao.dto");
            // String dtoCode = manager.executeEglTemplate("transformation/GenerateDTO.egl", params);
            // System.out.println("Generated DTO:\n" + dtoCode);

            // Example 5: Validate model
            System.out.println("\n=== Example 5: Validate Model ===");
            Object validationIssues = manager.executeEolOperation(
                "eol-scripts/common/ModelHelpers.eol",
                "validateModel"
            );
            System.out.println("Validation Issues: " + validationIssues);

            // Example 6: Get exhibits requiring attention
            System.out.println("\n=== Example 6: Get Exhibits Requiring Attention ===");
            Object exhibits = manager.executeEolOperation(
                "eol-scripts/exhibit/ExhibitOperations.eol",
                "getExhibitsRequiringAttention"
            );
            System.out.println("Exhibits Requiring Attention: " + exhibits);

            // Example 7: Create a new defect
            System.out.println("\n=== Example 7: Create New Defect ===");
            Object newDefect = manager.executeEolOperation(
                "eol-scripts/defect/DefectOperations.eol",
                "createDefect",
                "defect-" + System.currentTimeMillis(),
                "cracking",
                "moderate",
                System.currentTimeMillis()
            );
            System.out.println("New Defect Created: " + newDefect);

        } catch (Exception e) {
            System.err.println("Error running transformation example: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
