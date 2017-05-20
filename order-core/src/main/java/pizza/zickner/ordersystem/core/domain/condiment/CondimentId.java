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
public class CondimentId implements Serializable {

    @Column(name = "condimentId")
    private int value;

    private CondimentId() {
    }

    public CondimentId(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CondimentId that = (CondimentId) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "CondimentId{" +
                "value=" + value +
                '}';
    }
}
