package pizza.zickner.ordersystem.core.domain.order;

import org.springframework.data.annotation.AccessType;

import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * @author Valentin Zickner
 */
@Embeddable
@AccessType(AccessType.Type.FIELD)
public class PizzaId implements Serializable {

    private UUID value;

    public PizzaId() {
        this(UUID.randomUUID());
    }

    public PizzaId(UUID value) {
        this.value = value;
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PizzaId pizzaId = (PizzaId) o;
        return Objects.equals(value, pizzaId.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "PizzaId{" +
                "value=" + value +
                '}';
    }

}
