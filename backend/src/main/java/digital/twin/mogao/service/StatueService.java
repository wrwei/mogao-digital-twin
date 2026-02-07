package digital.twin.mogao.service;

import digital.twin.mogao.dto.StatueDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Statue Business Service
 * Handles operations on Statue model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class StatueService {

    private static final Logger LOG = LoggerFactory.getLogger(StatueService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/statue/StatueOperations.eol";

    public StatueService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Statue objects from the model
     */
    public List<StatueDTO> getAllStatues() {
        try {
            LOG.info("Getting all Statue objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllStatues");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Statue objects", e);
            throw new RuntimeException("Failed to get Statue objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Statue by GID
     */
    public StatueDTO getStatueByGid(String gid) {
        try {
            LOG.info("Getting Statue with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getStatueByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Statue with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Statue: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Statue
     */
    public StatueDTO createStatue(StatueDTO dto) {
        try {
            LOG.info("Creating new Statue");

            // Generate GID if not provided
            String gid = dto.getGid();
            if (gid == null || gid.isEmpty()) {
                gid = "statue-" + java.util.UUID.randomUUID().toString().substring(0, 8);
            }

            // Create statue with basic fields
            Object createdObj = modelManager.executeEolOperation(SCRIPT_PATH, "createStatue",
                gid, dto.getName(), dto.getLabel());

            // Update additional fields using update operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateStatue",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateStatueReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for create operations

            // Fetch and return the created statue
            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getStatueByGid", gid);
            return convertToDTO(result);

        } catch (Exception e) {
            LOG.error("Failed to create Statue", e);
            throw new RuntimeException("Failed to create Statue: " + e.getMessage(), e);
        }
    }

    /**
     * Update Statue
     */
    public void updateStatue(String gid, StatueDTO dto) {
        try {
            LOG.info("Updating Statue with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateStatue",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateStatueReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Statue updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Statue", e);
            throw new RuntimeException("Failed to update Statue: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Statue
     */
    public void deleteStatue(String gid) {
        try {
            LOG.info("Deleting Statue with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deleteStatue", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Statue", e);
            throw new RuntimeException("Failed to delete Statue: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private StatueDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            StatueDTO dto = new StatueDTO();

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
            Object depthVal = eObject.eGet(eObject.eClass().getEStructuralFeature("depth"));
            if (depthVal != null) {
                dto.setDepth(((Number) depthVal).doubleValue());
            }
            Object heightVal = eObject.eGet(eObject.eClass().getEStructuralFeature("height"));
            if (heightVal != null) {
                dto.setHeight(((Number) heightVal).doubleValue());
            }
            dto.setSubject((String) eObject.eGet(eObject.eClass().getEStructuralFeature("subject")));

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
