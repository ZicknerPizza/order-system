package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.util.Date;

/**
 * @author Valentin Zickner
 */
public class PartyOverviewDetails {
    public PartyId id;
    public String name;
    public String key;
    public Date date;

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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }
}
