package pizza.zickner.ordersystem.api.order;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.AggregateNotFoundException;
import pizza.zickner.ordersystem.core.domain.order.Order;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.OrderRepository;
import pizza.zickner.ordersystem.core.domain.order.PizzaId;
import pizza.zickner.ordersystem.core.domain.order.Status;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;
import pizza.zickner.ordersystem.core.domain.user.Roles;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class OrderApplicationService {

    private final OrderRepository orderRepository;
    private final PartyRepository partyRepository;

    @Autowired
    public OrderApplicationService(OrderRepository orderRepository, PartyRepository partyRepository) {
        this.orderRepository = orderRepository;
        this.partyRepository = partyRepository;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public List<OrderDetails> findOrdersForParty(PartyId partyId) {
        List<OrderDetails> orderDetails = this.orderRepository.findByPartyId(partyId)
                .stream()
                .sorted((order1, order2) -> {
                    Status status1 = order1.getStatus();
                    Status status2 = order2.getStatus();
                    if (status1 != status2) {
                        return status1.ordinal() - status2.ordinal();
                    }

                    switch (status1) {
                        case INACTIVE:
                            return order1.getName().compareTo(order2.getName());
                        case WAITING:
                            return order2.getOrderDateTime().compareTo(order1.getOrderDateTime());
                        case TOPPING:
                            if (order1.getTimeTopping() == null || order2.getTimeTopping() == null) {
                                return 0;
                            }
                            return order2.getTimeTopping().compareTo(order1.getTimeTopping());
                        case BAKING:
                        case EATING:
                            return order2.getStoveDateTime().compareTo(order1.getStoveDateTime());
                        default:
                            return 0;
                    }
                })
                .map(this::toOrderDetails)
                .collect(Collectors.toList());

        PizzaId lastPizzaId = null;
        for (OrderDetails orderDetail : orderDetails) {
            if (orderDetail.getStatus().isAtLeast(Status.TOPPING)) {
                lastPizzaId = setPizzaId(lastPizzaId, orderDetail);
            }
        }
        return orderDetails;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public void createOrder(PartyId partyId, OrderCreateDetails orderCreateDetails) {
        Party party = getParty(partyId);
        buildAndSaveOrder(party.getPartyId(), orderCreateDetails);
    }

    @PreAuthorize("@authorizationService.isKeyAuthorizedForParty(#partyId, #key)")
    public void createOrder(PartyId partyId, String key, OrderCreateDetails orderCreateDetails) {
        Party party = getParty(partyId);
        buildAndSaveOrder(party.getPartyId(), orderCreateDetails);
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public void changeStatus(PartyId partyId, OrderStatusChangeDetails orderStatusChangeDetails) {
        List<Order> orders = this.orderRepository.findByOrderIdIn(orderStatusChangeDetails.getOrderIds());
        // TODO: Verify if it is related to party
        if (orders.size() != orderStatusChangeDetails.getOrderIds().size()
                || orders.stream().map(Order::getPartyId)
                .anyMatch(orderPartyId -> !Objects.equals(orderPartyId, partyId))) {
            throw new AggregateNotFoundException();
        }

        Status newStatus = orderStatusChangeDetails.getStatus();
        if (orders.stream().map(Order::getStatus).anyMatch(status -> !status.isValidTransaction(newStatus))) {
            throw new IllegalArgumentException();
        }
        switch (newStatus) {
            case INACTIVE:
                for (Order order : orders) {
                    order.deactivate();
                }
                break;
            case WAITING:
                for (Order order : orders) {
                    order.moveToQueue();
                }
                break;
            case TOPPING:
                for (Order order : orders) {
                    order.startTopping();
                }
                break;
            case BAKING:
                for (Order order : orders) {
                    order.startBaking();
                }
                break;
            case EATING:
                for (Order order : orders) {
                    order.stopBaking();
                }
                break;
            case DELETED:
                for (Order order : orders) {
                    order.delete();
                }
                break;
        }
    }

    public void delete(PartyId partyId, OrderId orderId) {
        Order order = this.orderRepository.findOne(orderId);
        // TODO: Verify if it is related to party
        if (order.getStatus().isValidTransaction(Status.DELETED)) {
            order.delete();
        }
    }

    @Scheduled(cron = "* * * * * *")
    public void stopBakingOfFinishedOrders() {
        this.orderRepository.findByStatus(Status.BAKING)
                .stream()
                .filter(Order::readyToServe)
                .forEach(Order::stopBaking);
    }

    private void buildAndSaveOrder(PartyId partyId, OrderCreateDetails orderCreateDetails) {
        Order order = new Order.Builder()
                .setPartyId(partyId)
                .setOrderId(orderCreateDetails.getOrderId())
                .setName(orderCreateDetails.getName())
                .setComment(orderCreateDetails.getComment())
                .setCondiments(orderCreateDetails.getCondiments())
                .setStatus(orderCreateDetails.getStatus())
                .build();
        this.orderRepository.save(order);
    }

    private OrderDetails toOrderDetails(Order order) {
        if (order == null) {
            return null;
        }
        OrderDetails orderDetails = new OrderDetails();
        orderDetails.setOrderId(order.getOrderId());
        orderDetails.setPartyId(order.getPartyId());
        orderDetails.setName(order.getName());
        orderDetails.setComment(order.getComment());
        orderDetails.setCondiments(order.getCondiments());
        orderDetails.setDate(order.getOrderDateTime());
        orderDetails.setTimeStove(order.getStoveDateTime());
        orderDetails.setStatus(order.getStatus());
        return orderDetails;
    }

    private Party getParty(PartyId partyId) {
        Party party = this.partyRepository.findOne(partyId);
        if (party == null) {
            throw new AggregateNotFoundException();
        }
        return party;
    }

    private static PizzaId setPizzaId(PizzaId lastPizzaId, OrderDetails orderDetail) {
        if (lastPizzaId == null) {
            lastPizzaId = new PizzaId();
            orderDetail.setPizzaId(lastPizzaId);
        } else {
            orderDetail.setPizzaId(lastPizzaId);
            lastPizzaId = null;
        }
        return lastPizzaId;
    }
}
