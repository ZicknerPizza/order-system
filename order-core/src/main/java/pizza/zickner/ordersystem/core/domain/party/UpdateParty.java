package pizza.zickner.ordersystem.core.domain.party;

import java.time.LocalDate;
import java.util.List;

public class UpdateParty {

    private String name;
    private LocalDate date;
    private int blendStatistics;
    private int estimatedNumberOfPizzas;
    private List<PartyCondiment> condiments;

    public UpdateParty() {
    }

    public UpdateParty(String name, LocalDate date, int blendStatistics, int estimatedNumberOfPizzas, List<PartyCondiment> condiments) {
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

    public List<PartyCondiment> getCondiments() {
        return condiments;
    }
}
