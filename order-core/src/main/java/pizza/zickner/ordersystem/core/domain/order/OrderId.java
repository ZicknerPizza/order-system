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
public class OrderId implements Serializable {

    private String value;

    public OrderId() {
        this(UUID.randomUUID().toString());
    }

    public OrderId(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderId orderId = (OrderId) o;
        return value == orderId.value;
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "OrderId{" +
                "value=" + value +
                '}';
    }

}
