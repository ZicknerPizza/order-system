package pizza.zickner.ordersystem.core.domain.link;

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
public class LinkId implements Serializable {

    @Column(name = "linkId")
    public int value;

    public LinkId() {
    }

    public LinkId(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LinkId linkId = (LinkId) o;
        return Objects.equals(value, linkId.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "LinkId{" +
                "value=" + value +
                '}';
    }
}
