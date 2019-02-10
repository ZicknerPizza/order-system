package pizza.zickner.ordersystem.core.domain.party;

import com.google.common.base.Preconditions;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * @author Valentin Zickner
 */
@Entity
public class Party {

    private static final ZoneId ZONE_ID = ZoneId.systemDefault();

    @EmbeddedId
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private PartyId partyId;

    @Column(name = "party")
    private String name;

    @Column(name = "`key`")
    private String key;

    @Deprecated
    @Column(name = "aktiv")
    private int aktiv;

    private int blendStatistics;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "PartyCondiment_mm")
    private List<PartyCondiment> condiments;

    public Party() {
    }

    public Party(PartyId partyId, String name, String key, LocalDate date, int blendStatistics, List<PartyCondiment> condiments) {
        this.partyId = Preconditions.checkNotNull(partyId);
        this.name = Preconditions.checkNotNull(name);
        this.setDate(Preconditions.checkNotNull(date));
        this.key = key;
        this.blendStatistics = blendStatistics;
        this.condiments = condiments;
    }

    public PartyId getPartyId() {
        return partyId;
    }

    public String getName() {
        return name;
    }

    public String getKey() {
        return key;
    }

    @Deprecated
    public int getAktiv() {
        return aktiv;
    }

    public LocalDate getDate() {
        long unixTimestamp = new BigDecimal(this.aktiv).longValueExact() * 1000;
        return Instant.ofEpochMilli(unixTimestamp).atZone(ZONE_ID).toLocalDate();
    }

    private void setDate(LocalDate date) {
        this.aktiv = (int) (date
                .atTime(7, 0)
                .atZone(ZONE_ID)
                .toEpochSecond());
    }

    public int getBlendStatistics() {
        return blendStatistics;
    }

    public List<PartyCondiment> getCondiments() {
        return condiments;
    }

    public static class Builder {

        private PartyId partyId;
        private String name;
        private String key;
        private LocalDate date;
        private int blendStatistics;
        private List<PartyCondiment> condiments;

        public Builder setPartyId(PartyId partyId) {
            this.partyId = partyId;
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

        public Builder setBlendStatistics(int blendStatistics) {
            this.blendStatistics = blendStatistics;
            return this;
        }

        public Builder setCondiments(List<PartyCondiment> condiments) {
            this.condiments = condiments;
            return this;
        }

        public Party build() {
            return new Party(partyId, name, key, date, blendStatistics, condiments);
        }
    }
}
