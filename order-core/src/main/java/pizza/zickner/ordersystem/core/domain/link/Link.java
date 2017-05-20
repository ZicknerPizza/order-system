package pizza.zickner.ordersystem.core.domain.link;

import pizza.zickner.ordersystem.core.domain.party.PartyId;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;

/**
 * @author Valentin Zickner
 */
@Entity
public class Link {

    @EmbeddedId
    @GeneratedValue
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private LinkId linkId;

    private String identifier;

    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "eventId"))
    private PartyId partyId;

    public LinkId getLinkId() {
        return linkId;
    }

    public void setLinkId(LinkId linkId) {
        this.linkId = linkId;
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
}
