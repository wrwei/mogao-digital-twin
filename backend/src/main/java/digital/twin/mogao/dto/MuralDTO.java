package digital.twin.mogao.dto;

import java.util.List;

/**
 * Mural Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class MuralDTO {

    private String gid;
    private String name;
    private String description;
    private String label;
    private String creationPeriod;
    private Long lastInspectionDate;
    private String inspectionNotes;
    private String material;
    private String period;
    private String conservationStatus;
    private Double width;
    private Double height;
    private String technique;

    private AssetReferenceDTO reference;
    private CoordinatesDTO coordinates;
    private List<EnvironmentConditionDTO> environmentConditions;
    private List<DefectDTO> defects;

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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getCreationPeriod() {
        return creationPeriod;
    }

    public void setCreationPeriod(String creationPeriod) {
        this.creationPeriod = creationPeriod;
    }

    public Long getLastInspectionDate() {
        return lastInspectionDate;
    }

    public void setLastInspectionDate(Long lastInspectionDate) {
        this.lastInspectionDate = lastInspectionDate;
    }

    public String getInspectionNotes() {
        return inspectionNotes;
    }

    public void setInspectionNotes(String inspectionNotes) {
        this.inspectionNotes = inspectionNotes;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getConservationStatus() {
        return conservationStatus;
    }

    public void setConservationStatus(String conservationStatus) {
        this.conservationStatus = conservationStatus;
    }

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public String getTechnique() {
        return technique;
    }

    public void setTechnique(String technique) {
        this.technique = technique;
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

    public List<EnvironmentConditionDTO> getEnvironmentConditions() {
        return environmentConditions;
    }

    public void setEnvironmentConditions(List<EnvironmentConditionDTO> environmentConditions) {
        this.environmentConditions = environmentConditions;
    }

    public List<DefectDTO> getDefects() {
        return defects;
    }

    public void setDefects(List<DefectDTO> defects) {
        this.defects = defects;
    }

}

