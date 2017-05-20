package pizza.zickner.ordersystem.core.domain.party;

import javax.persistence.AttributeOverride;
import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * @author Valentin Zickner
 */
@Entity
public class Party {

    @EmbeddedId
    @GeneratedValue
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private PartyId partyId;

    @Column(name = "party")
    private String name;

    private String key;

    @Deprecated
    @Column(name = "aktiv")
    private int aktiv;

    private int blendStatistics;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "PartyCondiment_mm")
    private List<PartyCondiment> condiments;

    public PartyId getPartyId() {
        return partyId;
    }

    public void setPartyId(PartyId partyId) {
        this.partyId = partyId;
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

    @Deprecated
    public int getAktiv() {
        return aktiv;
    }

    @Deprecated
    public void setAktiv(int aktiv) {
        this.aktiv = aktiv;
    }

    public Date getDate() {
        return new Date(new BigDecimal(this.aktiv).longValueExact() * 1000);
    }

    public void setDate(Date date) {
        this.aktiv = new BigDecimal(date.getTime() / 1000).intValueExact();
    }

    public int getBlendStatistics() {
        return blendStatistics;
    }

    public void setBlendStatistics(int blendStatistics) {
        this.blendStatistics = blendStatistics;
    }

    public List<PartyCondiment> getCondiments() {
        return condiments;
    }

    public void setCondiments(List<PartyCondiment> condiments) {
        this.condiments = condiments;
    }
}
