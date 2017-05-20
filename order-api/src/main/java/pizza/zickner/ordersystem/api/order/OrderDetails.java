package pizza.zickner.ordersystem.api.order;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.PizzaId;
import pizza.zickner.ordersystem.core.domain.order.Status;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author Valentin Zickner
 */
public class OrderDetails {
    private OrderId orderId;
    private PizzaId pizzaId;
    private PartyId partyId;
    private String name;
    private String comment;
    private LocalDateTime date;

    @Deprecated
    private LocalDateTime timeStove;
    private Status status;
    private List<CondimentId> condiments;

    public OrderId getOrderId() {
        return orderId;
    }

    public void setOrderId(OrderId orderId) {
        this.orderId = orderId;
    }

    public PizzaId getPizzaId() {
        return pizzaId;
    }

    public void setPizzaId(PizzaId pizzaId) {
        this.pizzaId = pizzaId;
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

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    @Deprecated
    public LocalDateTime getTimeStove() {
        return timeStove;
    }

    @Deprecated
    public void setTimeStove(LocalDateTime timeStove) {
        this.timeStove = timeStove;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public List<CondimentId> getCondiments() {
        return condiments;
    }

    public void setCondiments(List<CondimentId> condiments) {
        this.condiments = condiments;
    }

}
