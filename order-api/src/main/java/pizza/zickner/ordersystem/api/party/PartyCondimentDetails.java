package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.Rating;

public class PartyCondimentDetails {

    private CondimentId condimentId;

    private Double amount;

    private Rating rating;

    private PartyCondimentDetails() {
    }

    public PartyCondimentDetails(CondimentId condimentId, Double amount, Rating rating) {
        this.condimentId = condimentId;
        this.amount = amount;
        this.rating = rating;
    }

    public CondimentId getCondimentId() {
        return condimentId;
    }

    public Double getAmount() {
        return amount;
    }

    public Rating getRating() {
        return rating;
    }

}
