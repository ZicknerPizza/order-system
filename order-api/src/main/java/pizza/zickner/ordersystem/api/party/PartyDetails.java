package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.time.LocalDate;
import java.util.List;

/**
 * @author Valentin Zickner
 */
public class PartyDetails {
    private PartyId id;
    private String name;
    private String key;
    private LocalDate date;
    private int estimatedNumberOfPizzas;
    private int blendStatistics;
    private List<CondimentId> condiments;

    public PartyId getId() {
        return id;
    }

    public void setId(PartyId id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getEstimatedNumberOfPizzas() {
        return estimatedNumberOfPizzas;
    }

    public void setEstimatedNumberOfPizzas(int estimatedNumberOfPizzas) {
        this.estimatedNumberOfPizzas = estimatedNumberOfPizzas;
    }

    public int getBlendStatistics() {
        return blendStatistics;
    }

    public void setBlendStatistics(int blendStatistics) {
        this.blendStatistics = blendStatistics;
    }

    public List<CondimentId> getCondiments() {
        return condiments;
    }

    public void setCondiments(List<CondimentId> condiments) {
        this.condiments = condiments;
    }
}
