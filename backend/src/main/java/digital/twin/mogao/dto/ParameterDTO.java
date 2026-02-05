package digital.twin.mogao.dto;

import java.util.List;

/**
 * Parameter Data Transfer Object
 * Auto-generated from mogao_dt.ecore model
 */
public class ParameterDTO {

    private String gid;
    private String expression;
    private Double value;
    private String unit;


    // Getters and Setters
    public String getGid() {
        return gid;
    }

    public void setGid(String gid) {
        this.gid = gid;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

}

