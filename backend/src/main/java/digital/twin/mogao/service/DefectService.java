package digital.twin.mogao.service;

import digital.twin.mogao.dto.DefectDTO;
import digital.twin.mogao.util.EpsilonModelManager;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Defect Business Service
 * Handles operations on Defect model objects
 * Auto-generated from mogao_dt.ecore model
 */
@Singleton
public class DefectService {

    private static final Logger LOG = LoggerFactory.getLogger(DefectService.class);

    private final EpsilonModelManager modelManager;

    // EOL script path
    private static final String SCRIPT_PATH = "eol-scripts/defect/DefectOperations.eol";

    public DefectService(EpsilonModelManager modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Get all Defect objects from the model
     */
    public List<DefectDTO> getAllDefects() {
        try {
            LOG.info("Getting all Defect objects");

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getAllDefects");

            // Convert model objects to DTOs
            if (result instanceof java.util.Collection) {
                java.util.Collection<?> collection = (java.util.Collection<?>) result;
                return collection.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }

            return java.util.Collections.emptyList();

        } catch (Exception e) {
            LOG.error("Failed to get Defect objects", e);
            throw new RuntimeException("Failed to get Defect objects: " + e.getMessage(), e);
        }
    }

    /**
     * Get Defect by GID
     */
    public DefectDTO getDefectByGid(String gid) {
        try {
            LOG.info("Getting Defect with GID: {}", gid);

            Object result = modelManager.executeEolOperation(SCRIPT_PATH, "getDefectByGid", gid);

            // Convert model object to DTO
            if (result != null) {
                return convertToDTO(result);
            }

            return null;

        } catch (Exception e) {
            LOG.error("Failed to get Defect with GID: {}", gid, e);
            throw new RuntimeException("Failed to get Defect: " + e.getMessage(), e);
        }
    }

    /**
     * Create new Defect
     */
    public DefectDTO createDefect(DefectDTO dto) {
        try {
            LOG.info("Creating new Defect");

            // Create operation with DTO data
            // TODO: Implement creation logic

            return dto;

        } catch (Exception e) {
            LOG.error("Failed to create Defect", e);
            throw new RuntimeException("Failed to create Defect: " + e.getMessage(), e);
        }
    }

    /**
     * Update Defect
     */
    public void updateDefect(String gid, DefectDTO dto) {
        try {
            LOG.info("Updating Defect with GID: {}", gid);

            // Update basic fields using EOL operation
            modelManager.executeEolOperation(SCRIPT_PATH, "updateDefect",
                gid, dto.getName(), dto.getDescription());

            // Update AssetReference if present
            if (dto.getReference() != null) {
                digital.twin.mogao.dto.AssetReferenceDTO refDTO = dto.getReference();
                modelManager.executeEolOperation(SCRIPT_PATH, "updateDefectReference",
                    gid,
                    refDTO.getModelLocation(),
                    refDTO.getMetadataLocation(),
                    refDTO.getTextureLocation());
            }

            // Model is automatically saved by executeEolOperation for update operations

            LOG.info("Defect updated successfully: {}", gid);

        } catch (Exception e) {
            LOG.error("Failed to update Defect", e);
            throw new RuntimeException("Failed to update Defect: " + e.getMessage(), e);
        }
    }

    /**
     * Delete Defect
     */
    public void deleteDefect(String gid) {
        try {
            LOG.info("Deleting Defect with GID: {}", gid);

            modelManager.executeEolOperation(SCRIPT_PATH, "deleteDefect", gid);

        } catch (Exception e) {
            LOG.error("Failed to delete Defect", e);
            throw new RuntimeException("Failed to delete Defect: " + e.getMessage(), e);
        }
    }

    /**
     * Convert EMF EObject to DTO
     */
    private DefectDTO convertToDTO(Object obj) {
        if (obj == null) return null;

        try {
            org.eclipse.emf.ecore.EObject eObject = (org.eclipse.emf.ecore.EObject) obj;
            DefectDTO dto = new DefectDTO();

            dto.setGid((String) eObject.eGet(eObject.eClass().getEStructuralFeature("gid")));
            dto.setName((String) eObject.eGet(eObject.eClass().getEStructuralFeature("name")));
            dto.setDescription((String) eObject.eGet(eObject.eClass().getEStructuralFeature("description")));
            Object defectTypeVal = eObject.eGet(eObject.eClass().getEStructuralFeature("defectType"));
            if (defectTypeVal != null) {
                dto.setDefectType(defectTypeVal.toString());
            }
            Object severityVal = eObject.eGet(eObject.eClass().getEStructuralFeature("severity"));
            if (severityVal != null) {
                dto.setSeverity(severityVal.toString());
            }
            Object detectionDateVal = eObject.eGet(eObject.eClass().getEStructuralFeature("detectionDate"));
            if (detectionDateVal != null) {
                dto.setDetectionDate(((Number) detectionDateVal).longValue());
            }
            Object affectedAreaVal = eObject.eGet(eObject.eClass().getEStructuralFeature("affectedArea"));
            if (affectedAreaVal != null) {
                dto.setAffectedArea(((Number) affectedAreaVal).doubleValue());
            }
            dto.setTreatmentHistory((String) eObject.eGet(eObject.eClass().getEStructuralFeature("treatmentHistory")));
            Object requiresImmediateActionVal = eObject.eGet(eObject.eClass().getEStructuralFeature("requiresImmediateAction"));
            if (requiresImmediateActionVal != null) {
                dto.setRequiresImmediateAction((Boolean) requiresImmediateActionVal);
            }

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
