package digital.twin.mogao.dto;

import java.util.List;

/**
 * Defect Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class DefectDTO {

    private String gid;
    private String name;
    private String description;
    private String defectType;
    private String severity;
    private Long detectionDate;
    private Double affectedArea;
    private String treatmentHistory;
    private Boolean requiresImmediateAction;

    private AssetReferenceDTO reference;
    private CoordinatesDTO coordinates;

    // Getters and Setters
    public String getGid() {
        return gid;
    }

    public void setGid(String gid) {
        this.gid = gid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDefectType() {
        return defectType;
    }

    public void setDefectType(String defectType) {
        this.defectType = defectType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Long getDetectionDate() {
        return detectionDate;
    }

    public void setDetectionDate(Long detectionDate) {
        this.detectionDate = detectionDate;
    }

    public Double getAffectedArea() {
        return affectedArea;
    }

    public void setAffectedArea(Double affectedArea) {
        this.affectedArea = affectedArea;
    }

    public String getTreatmentHistory() {
        return treatmentHistory;
    }

    public void setTreatmentHistory(String treatmentHistory) {
        this.treatmentHistory = treatmentHistory;
    }

    public Boolean getRequiresImmediateAction() {
        return requiresImmediateAction;
    }

    public void setRequiresImmediateAction(Boolean requiresImmediateAction) {
        this.requiresImmediateAction = requiresImmediateAction;
    }

    public AssetReferenceDTO getReference() {
        return reference;
    }

    public void setReference(AssetReferenceDTO reference) {
        this.reference = reference;
    }

    public CoordinatesDTO getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(CoordinatesDTO coordinates) {
        this.coordinates = coordinates;
    }

}

