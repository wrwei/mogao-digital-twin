package digital.twin.mogao.dto;

import java.util.List;

/**
 * Cave Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class CaveDTO {

    private String gid;
    private String name;
    private String description;
    private String label;
    private String creationPeriod;
    private Long lastInspectionDate;
    private String inspectionNotes;

    private AssetReferenceDTO reference;
    private CoordinatesDTO coordinates;
    private List<EnvironmentConditionDTO> environmentConditions;
    private List<DefectDTO> defects;
    private List<ExhibitDTO> exhibits;

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

    public List<ExhibitDTO> getExhibits() {
        return exhibits;
    }

    public void setExhibits(List<ExhibitDTO> exhibits) {
        this.exhibits = exhibits;
    }

}

