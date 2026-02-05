package digital.twin.mogao.service;

import digital.twin.mogao.dto.CaveDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Cave Business Service
 * Handles operations on Cave model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class CaveService {

    private static final Logger LOG = LoggerFactory.getLogger(CaveService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/cave/CaveOperations.eol";

    public CaveService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Cave objects from the model
     */
    public List<CaveDTO> getAllCaves() {
        try {
            LOG.info("Getting all Cave objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllCaves");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Cave objects", e);
            throw new RuntimeException("Failed to get Cave objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Cave by GID
     */
    public CaveDTO getCaveByGid(String gid) {
        try {
            LOG.info("Getting Cave with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getCaveByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Cave with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Cave: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Cave
     */
    public CaveDTO createCave(CaveDTO dto) {
        try {
            LOG.info("Creating new Cave");

            // Create operation with DTO data
            // TODO: Implement creation logic

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to create Cave", e);
            throw new RuntimeException("Failed to create Cave: " + e.getMessage(), e);
        }
    }

    /**
     * Update Cave
     */
    public void updateCave(String gid, CaveDTO dto) {
        try {
            LOG.info("Updating Cave with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateCave",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateCaveReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Cave updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Cave", e);
            throw new RuntimeException("Failed to update Cave: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Cave
     */
    public void deleteCave(String gid) {
        try {
            LOG.info("Deleting Cave with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deleteCave", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Cave", e);
            throw new RuntimeException("Failed to delete Cave: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private CaveDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            CaveDTO dto = new CaveDTO();

            dto.setGid((String) eObject.eGet(eObject.eClass().getEStructuralFeature("gid")));
            dto.setName((String) eObject.eGet(eObject.eClass().getEStructuralFeature("name")));
            dto.setDescription((String) eObject.eGet(eObject.eClass().getEStructuralFeature("description")));
            dto.setLabel((String) eObject.eGet(eObject.eClass().getEStructuralFeature("label")));
            dto.setCreationPeriod((String) eObject.eGet(eObject.eClass().getEStructuralFeature("creationPeriod")));
            Object lastInspectionDateVal = eObject.eGet(eObject.eClass().getEStructuralFeature("lastInspectionDate"));
            if (lastInspectionDateVal != null) {
                dto.setLastInspectionDate(((Number) lastInspectionDateVal).longValue());
            }
            dto.setInspectionNotes((String) eObject.eGet(eObject.eClass().getEStructuralFeature("inspectionNotes")));

            // Handle composite reference: reference
            Object referenceObj = eObject.eGet(eObject.eClass().getEStructuralFeature("reference"));
            if (referenceObj != null) {
                org.eclipse.emf.ecore.EObject referenceEObj = (org.eclipse.emf.ecore.EObject) referenceObj;
                digital.twin.mogao.dto.AssetReferenceDTO referenceDTO = new digital.twin.mogao.dto.AssetReferenceDTO();

                referenceDTO.setGid((String) referenceEObj.eGet(referenceEObj.eClass().getEStructuralFeature("gid")));
                referenceDTO.setModelLocation((String) referenceEObj.eGet(referenceEObj.eClass().getEStructuralFeature("modelLocation")));
                referenceDTO.setMetadataLocation((String) referenceEObj.eGet(referenceEObj.eClass().getEStructuralFeature("metadataLocation")));
                referenceDTO.setTextureLocation((String) referenceEObj.eGet(referenceEObj.eClass().getEStructuralFeature("textureLocation")));

                dto.setReference(referenceDTO);
            }
            // Handle composite reference: coordinates
            Object coordinatesObj = eObject.eGet(eObject.eClass().getEStructuralFeature("coordinates"));
            if (coordinatesObj != null) {
                org.eclipse.emf.ecore.EObject coordinatesEObj = (org.eclipse.emf.ecore.EObject) coordinatesObj;
                digital.twin.mogao.dto.CoordinatesDTO coordinatesDTO = new digital.twin.mogao.dto.CoordinatesDTO();

                coordinatesDTO.setGid((String) coordinatesEObj.eGet(coordinatesEObj.eClass().getEStructuralFeature("gid")));

                dto.setCoordinates(coordinatesDTO);
            }

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to convert EObject to DTO", e);
            throw new RuntimeException("Conversion failed: " + e.getMessage(), e);
        }
    }
}
