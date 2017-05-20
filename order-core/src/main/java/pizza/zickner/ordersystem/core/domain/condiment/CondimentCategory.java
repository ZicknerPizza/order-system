package pizza.zickner.ordersystem.core.domain.condiment;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;

/**
 * @author Valentin Zickner
 */
@Entity
public class CondimentCategory {

    @EmbeddedId
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private CondimentCategoryId id;

    private String name;

    private int sorting;

    public CondimentCategoryId getId() {
        return id;
    }

    public void setId(CondimentCategoryId id) {
        this.id = id;
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
}
