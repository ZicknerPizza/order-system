package pizza.zickner.ordersystem.core.domain.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import java.io.Serializable;

/**
 * @author Valentin Zickner
 */
@Embeddable
public class PartyCondiment implements Serializable {

    @AttributeOverride(name = "value", column = @Column(name = "condiment_id"))
    private CondimentId condimentId;

    private Double amount;

    @Enumerated(EnumType.ORDINAL)
    private Rating rating;

    public CondimentId getCondimentId() {
        return condimentId;
    }

    public void setCondimentId(CondimentId condimentId) {
        this.condimentId = condimentId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Rating getRating() {
        return rating;
    }

    public void setRating(Rating rating) {
        this.rating = rating;
    }
}
