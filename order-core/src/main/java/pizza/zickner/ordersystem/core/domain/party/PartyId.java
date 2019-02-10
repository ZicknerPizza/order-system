package pizza.zickner.ordersystem.core.domain.party;

import org.springframework.data.annotation.AccessType;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * @author Valentin Zickner
 */
@Embeddable
@AccessType(AccessType.Type.FIELD)
public class PartyId implements Serializable {

    @Column(name = "party_id")
    private String value;

    public PartyId() {
        this(UUID.randomUUID().toString());
    }

    public PartyId(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PartyId partyId = (PartyId) o;
        return Objects.equals(value, partyId.value);
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
