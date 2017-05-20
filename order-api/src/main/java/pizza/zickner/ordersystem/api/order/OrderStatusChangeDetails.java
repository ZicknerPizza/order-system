package pizza.zickner.ordersystem.api.order;

import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.Status;

import java.util.List;

/**
 * @author Valentin Zickner
 */
public class OrderStatusChangeDetails {
    private List<OrderId> orderIds;
    private Status status;

    public List<OrderId> getOrderIds() {
        return orderIds;
    }

    public void setOrderIds(List<OrderId> orderIds) {
        this.orderIds = orderIds;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
