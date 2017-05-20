package pizza.zickner.ordersystem.api.condiment;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;

/**
 * @author Valentin Zickner
 */
public class CondimentDetails {
    public CondimentId id;
    public String category;
    public String name;
    public String unit;

    public CondimentId getId() {
        return id;
    }

    public void setId(CondimentId id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
