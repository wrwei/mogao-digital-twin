package digital.twin.mogao.dto;

import java.util.List;

/**
 * Temperature Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class TemperatureDTO {

    private String gid;
    private String name;
    private String description;
    private Long timestamp;

    private AssetReferenceDTO reference;
    private CoordinatesDTO coordinates;
    private ParameterDTO reading;

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

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
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

    public ParameterDTO getReading() {
        return reading;
    }

    public void setReading(ParameterDTO reading) {
        this.reading = reading;
    }

}

