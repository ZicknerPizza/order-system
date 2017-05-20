package pizza.zickner.ordersystem.api.order;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.Status;

import java.util.List;

/**
 * @author Valentin Zickner
 */
public class OrderCreateDetails {
    private OrderId orderId;
    private String name;
    private String comment;
    private List<CondimentId> condiments;
    private Status status;

    public OrderId getOrderId() {
        return orderId;
    }

    public void setOrderId(OrderId orderId) {
        this.orderId = orderId;
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

    public List<CondimentId> getCondiments() {
        return condiments;
    }

    public void setCondiments(List<CondimentId> condiments) {
        this.condiments = condiments;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
