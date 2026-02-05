package digital.twin.mogao.dto;

import java.util.List;

/**
 * Object Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class ObjectDTO {

    private String gid;
    private String name;
    private String description;

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

