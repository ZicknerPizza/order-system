package pizza.zickner.ordersystem.api.link;

import pizza.zickner.ordersystem.core.domain.link.LinkId;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

/**
 * @author Valentin Zickner
 */
public class LinkDetails {
    public LinkId id;
    public String identifier;
    public PartyId partyId;
    public String partyKey;

    public LinkId getId() {
        return id;
    }

    public void setId(LinkId id) {
        this.id = id;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public PartyId getPartyId() {
        return partyId;
    }

    public void setPartyId(PartyId partyId) {
        this.partyId = partyId;
    }

    public String getPartyKey() {
        return partyKey;
    }

    public void setPartyKey(String partyKey) {
        this.partyKey = partyKey;
    }
}