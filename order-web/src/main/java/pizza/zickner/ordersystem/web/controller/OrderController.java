package pizza.zickner.ordersystem.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pizza.zickner.ordersystem.api.order.OrderApplicationService;
import pizza.zickner.ordersystem.api.order.OrderCreateDetails;
import pizza.zickner.ordersystem.api.order.OrderDetails;
import pizza.zickner.ordersystem.api.order.OrderStatusChangeDetails;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@RestController
@RequestMapping("/api/orders/{partyId}")
public class OrderController {

    private final OrderApplicationService orderApplicationService;

    @Autowired
    public OrderController(OrderApplicationService orderApplicationService) {
        this.orderApplicationService = orderApplicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void order(@PathVariable PartyId partyId, @RequestBody OrderCreateDetails orderCreateDetails) {
        this.orderApplicationService.createOrder(partyId, orderCreateDetails);
    }

    @PostMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void order(@PathVariable PartyId partyId, @PathVariable String key, @RequestBody OrderCreateDetails orderCreateDetails) {
        this.orderApplicationService.createOrder(partyId, key, orderCreateDetails);
    }

    @PutMapping("/status")
    public void updateStatus(@PathVariable PartyId partyId, @RequestBody OrderStatusChangeDetails orderStatusChangeDetails) {
        this.orderApplicationService.changeStatus(partyId, orderStatusChangeDetails);
    }

    @DeleteMapping("/{orderId}")
    public void delete(@PathVariable PartyId partyId, @PathVariable OrderId orderId) {
        this.orderApplicationService.delete(partyId, orderId);
    }

    @GetMapping
    public List<OrderDetails> findOrdersForParty(@PathVariable PartyId partyId) {
        return this.orderApplicationService.findOrdersForParty(partyId);
    }

}
