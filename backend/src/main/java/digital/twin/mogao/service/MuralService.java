package digital.twin.mogao.service;

import digital.twin.mogao.dto.MuralDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mural Business Service
 * Handles operations on Mural model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class MuralService {

    private static final Logger LOG = LoggerFactory.getLogger(MuralService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/mural/MuralOperations.eol";

    public MuralService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Mural objects from the model
     */
    public List<MuralDTO> getAllMurals() {
        try {
            LOG.info("Getting all Mural objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllMurals");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Mural objects", e);
            throw new RuntimeException("Failed to get Mural objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Mural by GID
     */
    public MuralDTO getMuralByGid(String gid) {
        try {
            LOG.info("Getting Mural with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getMuralByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Mural with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Mural: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Mural
     */
    public MuralDTO createMural(MuralDTO dto) {
        try {
            LOG.info("Creating new Mural");

            // Create operation with DTO data
            // TODO: Implement creation logic

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to create Mural", e);
            throw new RuntimeException("Failed to create Mural: " + e.getMessage(), e);
        }
    }

    /**
     * Update Mural
     */
    public void updateMural(String gid, MuralDTO dto) {
        try {
            LOG.info("Updating Mural with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateMural",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateMuralReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Mural updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Mural", e);
            throw new RuntimeException("Failed to update Mural: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Mural
     */
    public void deleteMural(String gid) {
        try {
            LOG.info("Deleting Mural with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deleteMural", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Mural", e);
            throw new RuntimeException("Failed to delete Mural: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private MuralDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            MuralDTO dto = new MuralDTO();

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
            dto.setMaterial((String) eObject.eGet(eObject.eClass().getEStructuralFeature("material")));
            dto.setPeriod((String) eObject.eGet(eObject.eClass().getEStructuralFeature("period")));
            Object conservationStatusVal = eObject.eGet(eObject.eClass().getEStructuralFeature("conservationStatus"));
            if (conservationStatusVal != null) {
                dto.setConservationStatus(conservationStatusVal.toString());
            }
            Object widthVal = eObject.eGet(eObject.eClass().getEStructuralFeature("width"));
            if (widthVal != null) {
                dto.setWidth(((Number) widthVal).doubleValue());
            }
            Object heightVal = eObject.eGet(eObject.eClass().getEStructuralFeature("height"));
            if (heightVal != null) {
                dto.setHeight(((Number) heightVal).doubleValue());
            }
            dto.setTechnique((String) eObject.eGet(eObject.eClass().getEStructuralFeature("technique")));

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
