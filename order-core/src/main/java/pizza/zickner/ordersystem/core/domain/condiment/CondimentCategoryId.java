package pizza.zickner.ordersystem.core.domain.condiment;

import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/**
 * @author Valentin Zickner
 */
@Embeddable
@Access(AccessType.FIELD)
public class CondimentCategoryId implements Serializable {

    @Column(name = "condimentCategoryId")
    private int value;

    private CondimentCategoryId() {
    }

    public CondimentCategoryId(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CondimentCategoryId that = (CondimentCategoryId) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "CondimentCategoryId{" +
                "value=" + value +
                '}';
    }
}
