package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.time.LocalDate;
import java.util.List;

public class CreatePartyDetails {
    public PartyId id;
    public String name;
    public String key;
    public LocalDate date;

    @Deprecated
    public int countPizza;
    public int blendStatistics;
    public List<PartyCondimentDetails> condiments;

    public CreatePartyDetails() {
    }

    public CreatePartyDetails(PartyId id, String name, String key, LocalDate date, int countPizza, int blendStatistics, List<PartyCondimentDetails> condiments) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.date = date;
        this.countPizza = countPizza;
        this.blendStatistics = blendStatistics;
        this.condiments = condiments;
    }

    public PartyId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getKey() {
        return key;
    }

    public LocalDate getDate() {
        return date;
    }

    @Deprecated
    public int getCountPizza() {
        return countPizza;
    }

    public int getBlendStatistics() {
        return blendStatistics;
    }

    public List<PartyCondimentDetails> getCondiments() {
        return condiments;
    }

    public static class Builder {
        private PartyId id;
        private String name;
        private String key;
        private LocalDate date;
        private int countPizza;
        private int blendStatistics;
        private List<PartyCondimentDetails> condiments;

        public Builder setId(PartyId id) {
            this.id = id;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setKey(String key) {
            this.key = key;
            return this;
        }

        public Builder setDate(LocalDate date) {
            this.date = date;
            return this;
        }

        public Builder setCountPizza(int countPizza) {
            this.countPizza = countPizza;
            return this;
        }

        public Builder setBlendStatistics(int blendStatistics) {
            this.blendStatistics = blendStatistics;
            return this;
        }

        public Builder setCondiments(List<PartyCondimentDetails> condiments) {
            this.condiments = condiments;
            return this;
        }

        public CreatePartyDetails build() {
            return new CreatePartyDetails(id, name, key, date, countPizza, blendStatistics, condiments);
        }
    }
}
