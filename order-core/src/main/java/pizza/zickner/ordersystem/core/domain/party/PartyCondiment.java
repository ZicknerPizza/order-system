package pizza.zickner.ordersystem.core.domain.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;

/**
 * @author Valentin Zickner
 */
@Embeddable
public class PartyCondiment implements Serializable {

    @AttributeOverride(name = "value", column = @Column(name = "condiment_id"))
    private CondimentId condimentId;

    private Double amount;

    private Integer rating;

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
        if (rating == null) {
            return null;
        }
        return Rating.values()[rating + 1];
    }

    public void setRating(Rating rating) {
        if (rating == null) {
            this.rating = null;
        }
        this.rating = rating.ordinal() - 1;
    }
}
