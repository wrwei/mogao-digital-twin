package digital.twin.mogao.service;

import digital.twin.mogao.dto.InscriptionDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Inscription Business Service
 * Handles operations on Inscription model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class InscriptionService {

    private static final Logger LOG = LoggerFactory.getLogger(InscriptionService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/inscription/InscriptionOperations.eol";

    public InscriptionService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Inscription objects from the model
     */
    public List<InscriptionDTO> getAllInscriptions() {
        try {
            LOG.info("Getting all Inscription objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllInscriptions");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Inscription objects", e);
            throw new RuntimeException("Failed to get Inscription objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Inscription by GID
     */
    public InscriptionDTO getInscriptionByGid(String gid) {
        try {
            LOG.info("Getting Inscription with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getInscriptionByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Inscription with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Inscription: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Inscription
     */
    public InscriptionDTO createInscription(InscriptionDTO dto) {
        try {
            LOG.info("Creating new Inscription");

            // Create operation with DTO data
            // TODO: Implement creation logic

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to create Inscription", e);
            throw new RuntimeException("Failed to create Inscription: " + e.getMessage(), e);
        }
    }

    /**
     * Update Inscription
     */
    public void updateInscription(String gid, InscriptionDTO dto) {
        try {
            LOG.info("Updating Inscription with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateInscription",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateInscriptionReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Inscription updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Inscription", e);
            throw new RuntimeException("Failed to update Inscription: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Inscription
     */
    public void deleteInscription(String gid) {
        try {
            LOG.info("Deleting Inscription with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deleteInscription", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Inscription", e);
            throw new RuntimeException("Failed to delete Inscription: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private InscriptionDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            InscriptionDTO dto = new InscriptionDTO();

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
            dto.setLanguage((String) eObject.eGet(eObject.eClass().getEStructuralFeature("language")));
            dto.setContent((String) eObject.eGet(eObject.eClass().getEStructuralFeature("content")));

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
