package digital.twin.mogao.dto;

import java.util.List;

/**
 * AssetReference Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class AssetReferenceDTO {

    private String gid;
    private String modelLocation;
    private String metadataLocation;
    private String textureLocation;


    // Getters and Setters
    public String getGid() {
        return gid;
    }

    public void setGid(String gid) {
        this.gid = gid;
    }

    public String getModelLocation() {
        return modelLocation;
    }

    public void setModelLocation(String modelLocation) {
        this.modelLocation = modelLocation;
    }

    public String getMetadataLocation() {
        return metadataLocation;
    }

    public void setMetadataLocation(String metadataLocation) {
        this.metadataLocation = metadataLocation;
    }

    public String getTextureLocation() {
        return textureLocation;
    }

    public void setTextureLocation(String textureLocation) {
        this.textureLocation = textureLocation;
    }

}

