package digital.twin.mogao.service;

import digital.twin.mogao.dto.PaintingDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Painting Business Service
 * Handles operations on Painting model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class PaintingService {

    private static final Logger LOG = LoggerFactory.getLogger(PaintingService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/painting/PaintingOperations.eol";

    public PaintingService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Painting objects from the model
     */
    public List<PaintingDTO> getAllPaintings() {
        try {
            LOG.info("Getting all Painting objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllPaintings");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Painting objects", e);
            throw new RuntimeException("Failed to get Painting objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Painting by GID
     */
    public PaintingDTO getPaintingByGid(String gid) {
        try {
            LOG.info("Getting Painting with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getPaintingByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Painting with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Painting: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Painting
     */
    public PaintingDTO createPainting(PaintingDTO dto) {
        try {
            LOG.info("Creating new Painting");

            // Create operation with DTO data
            // TODO: Implement creation logic

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to create Painting", e);
            throw new RuntimeException("Failed to create Painting: " + e.getMessage(), e);
        }
    }

    /**
     * Update Painting
     */
    public void updatePainting(String gid, PaintingDTO dto) {
        try {
            LOG.info("Updating Painting with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updatePainting",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updatePaintingReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Painting updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Painting", e);
            throw new RuntimeException("Failed to update Painting: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Painting
     */
    public void deletePainting(String gid) {
        try {
            LOG.info("Deleting Painting with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deletePainting", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Painting", e);
            throw new RuntimeException("Failed to delete Painting: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private PaintingDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            PaintingDTO dto = new PaintingDTO();

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
            dto.setStyle((String) eObject.eGet(eObject.eClass().getEStructuralFeature("style")));

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
