package pizza.zickner.ordersystem.api.party;

import java.time.LocalDate;
import java.util.List;

public class UpdatePartyDetails {

    private String name;
    private LocalDate date;
    private int blendStatistics;
    private int estimatedNumberOfPizzas;
    private List<PartyCondimentDetails> condiments;

    public UpdatePartyDetails() {
    }

    public UpdatePartyDetails(String name, LocalDate date, int blendStatistics, int estimatedNumberOfPizzas, List<PartyCondimentDetails> condiments) {
        this.name = name;
        this.date = date;
        this.blendStatistics = blendStatistics;
        this.estimatedNumberOfPizzas = estimatedNumberOfPizzas;
        this.condiments = condiments;
    }

    public String getName() {
        return name;
    }

    public LocalDate getDate() {
        return date;
    }

    public int getBlendStatistics() {
        return blendStatistics;
    }

    public int getEstimatedNumberOfPizzas() {
        return estimatedNumberOfPizzas;
    }

    public List<PartyCondimentDetails> getCondiments() {
        return condiments;
    }
}
