package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.time.LocalDate;

/**
 * @author Valentin Zickner
 */
public class PartyOverviewDetails {
    private PartyId id;
    private String name;
    private String key;
    private LocalDate date;

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
}
