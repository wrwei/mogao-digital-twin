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
    private String reference;
    private String defectType;
    private String severity;
    private String detectionDate;
    private String affectedArea;
    private String treatmentHistory;
    private String requiresImmediateAction;

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

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
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

    public String getDetectionDate() {
        return detectionDate;
    }

    public void setDetectionDate(String detectionDate) {
        this.detectionDate = detectionDate;
    }

    public String getAffectedArea() {
        return affectedArea;
    }

    public void setAffectedArea(String affectedArea) {
        this.affectedArea = affectedArea;
    }

    public String getTreatmentHistory() {
        return treatmentHistory;
    }

    public void setTreatmentHistory(String treatmentHistory) {
        this.treatmentHistory = treatmentHistory;
    }

    public String getRequiresImmediateAction() {
        return requiresImmediateAction;
    }

    public void setRequiresImmediateAction(String requiresImmediateAction) {
        this.requiresImmediateAction = requiresImmediateAction;
    }

    public CoordinatesDTO getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(CoordinatesDTO coordinates) {
        this.coordinates = coordinates;
    }

}

