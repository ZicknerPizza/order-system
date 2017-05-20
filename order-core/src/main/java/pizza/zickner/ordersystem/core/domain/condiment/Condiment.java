package pizza.zickner.ordersystem.core.domain.condiment;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OrderBy;

/**
 * @author Valentin Zickner
 */
@Entity(name = "Condiment")
public class Condiment {

    @EmbeddedId
    @GeneratedValue
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private CondimentId condimentId;

    private String name;

    private int sorting;

    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @OrderBy("sorting ASC")
    private CondimentCategory category;

    public CondimentId getCondimentId() {
        return condimentId;
    }

    public void setCondimentId(CondimentId condimentId) {
        this.condimentId = condimentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getSorting() {
        return sorting;
    }

    public void setSorting(int sorting) {
        this.sorting = sorting;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public CondimentCategory getCategory() {
        return category;
    }

    public void setCategory(CondimentCategory category) {
        this.category = category;
    }
}
