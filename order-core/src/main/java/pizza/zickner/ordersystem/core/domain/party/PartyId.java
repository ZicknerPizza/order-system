package pizza.zickner.ordersystem.core.domain.party;

import org.springframework.data.annotation.AccessType;

import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/**
 * @author Valentin Zickner
 */
@Embeddable
@AccessType(AccessType.Type.FIELD)
public class PartyId implements Serializable{

    private int value;

    public PartyId() {
    }

    public PartyId(String value) {
        this(Integer.parseInt(value));
    }

    public PartyId(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PartyId partyId = (PartyId) o;
        return value == partyId.value;
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "PartyId{" +
                "value=" + value +
                '}';
    }
}
