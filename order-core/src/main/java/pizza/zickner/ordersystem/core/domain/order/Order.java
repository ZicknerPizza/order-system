package pizza.zickner.ordersystem.core.domain.order;

import com.google.common.base.Preconditions;
import com.google.common.base.Strings;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import javax.persistence.AttributeOverride;
import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

/**
 * @author Valentin Zickner
 */
@Entity(name = "PizzaOrder")
public class Order {

    private static final int MINUTES_TO_BAKE = 4;
    private static final ZoneOffset ZONE_OFFSET = ZoneId.systemDefault().getRules().getOffset(Instant.now());

    @EmbeddedId
    @AttributeOverride(name = "value", column = @Column(name = "id"))
    private OrderId orderId;

    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "party"))
    private PartyId partyId;

    private String name;

    private String comment;

    @Enumerated(EnumType.ORDINAL)
    private Status status;

    @Deprecated
    private int time;

    @Deprecated
    private Integer timeStove;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "PizzaOrderCondiment_mm", joinColumns = @JoinColumn(name = "orderId"))
    private List<CondimentId> condiments;

    private Order() {
    }

    private Order(PartyId partyId, OrderId orderId, String name, String comment, Status status, List<CondimentId> condiments) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(name));
        Preconditions.checkArgument(status == Status.INACTIVE || status == Status.WAITING, "Status for new orders must be INACTIVE or WAITING");
        this.partyId = Preconditions.checkNotNull(partyId);
        this.orderId = Preconditions.checkNotNull(orderId);
        this.name = name;
        this.comment = comment;
        this.status = Preconditions.checkNotNull(status);
        this.condiments = Preconditions.checkNotNull(condiments);
        this.time = (int) LocalDateTime.now().toEpochSecond(ZONE_OFFSET);
    }

    public OrderId getOrderId() {
        return orderId;
    }

    public void setOrderId(OrderId orderId) {
        this.orderId = orderId;
    }

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

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public int getTime() {
        return time;
    }

    public void setTime(int time) {
        this.time = time;
    }

    public LocalDateTime getOrderDateTime() {
        if (this.time == 0) {
            return null;
        }
        return LocalDateTime.ofEpochSecond(this.time, 0, ZONE_OFFSET);
    }

    public Integer getTimeStove() {
        return timeStove;
    }

    public void setTimeStove(Integer timeStove) {
        this.timeStove = timeStove;
    }

    public LocalDateTime getStoveDateTime() {
        if (this.timeStove == null || this.timeStove == 0) {
            return null;
        }
        return LocalDateTime.ofEpochSecond(this.timeStove, 0, ZONE_OFFSET);
    }

    public List<CondimentId> getCondiments() {
        return condiments;
    }

    public void setCondiments(List<CondimentId> condiments) {
        this.condiments = condiments;
    }

    public void deactivate() {
        this.setStatus(Status.INACTIVE);
    }

    public void moveToQueue() {
        this.setStatus(Status.WAITING);
    }

    public void startTopping() {
        this.setStatus(Status.TOPPING);
    }

    public void startBaking() {
        this.setTimeStove(new BigDecimal(new Date().getTime() / 1000).intValueExact());
        this.setStatus(Status.BAKING);
    }

    public boolean readyToServe() {
        LocalDateTime stoveDateTime = this.getStoveDateTime();
        if (stoveDateTime == null) {
            return true;
        }
        return stoveDateTime.plus(MINUTES_TO_BAKE, ChronoUnit.MINUTES).isBefore(LocalDateTime.now());
    }

    public void stopBaking() {
        this.setStatus(Status.EATING);
    }

    public void delete() {
        this.setStatus(Status.DELETED);
    }

    public static class Builder {
        private PartyId partyId;
        private OrderId orderId;
        private String name;
        private String comment;
        private Status status;
        private List<CondimentId> condiments;

        public Builder setPartyId(PartyId partyId) {
            this.partyId = partyId;
            return this;
        }

        public Builder setOrderId(OrderId orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setComment(String comment) {
            this.comment = comment;
            return this;
        }

        public Builder setStatus(Status status) {
            this.status = status;
            return this;
        }

        public Builder setCondiments(List<CondimentId> condiments) {
            this.condiments = condiments;
            return this;
        }

        public Order build() {
            return new Order(partyId, orderId, name, comment, status, condiments);
        }
    }
}
