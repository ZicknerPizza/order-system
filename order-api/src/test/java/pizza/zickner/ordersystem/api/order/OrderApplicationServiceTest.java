package pizza.zickner.ordersystem.api.order;


import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.order.Order;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.Status;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Transactional
public class OrderApplicationServiceTest {

    private PartyId partyId = null;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private OrderApplicationService orderApplicationService;

    @Before
    public void setUp() {
        Party party = new Party.Builder()
                .setPartyId(new PartyId(1))
                .setName("Test Party")
                .setDate(LocalDate.now())
                .build();
        this.partyId = partyRepository.save(party).getPartyId();
    }

    @Test
    public void createOrder_withValidOrder_ensureOrderIsAddedToEndOfQueue() {
        // Arrange
        OrderCreateDetails orderCreateDetails = createNewOrderForQueue(
                new OrderId(),
                5, 10, 42);

        // Act
        orderApplicationService.createOrder(partyId, orderCreateDetails);

        // Assert
        List<OrderDetails> ordersForParty = orderApplicationService.findOrdersForParty(partyId);

        assertThat(ordersForParty)
                .isNotNull()
                .hasSize(1);

        OrderDetails order = ordersForParty.get(0);
        assertThat(order).isNotNull();
        assertThat(order.getOrderId()).isEqualTo(orderCreateDetails.getOrderId());
    }

    private void createDatabaseOrderObjectAndStoreIt(OrderId orderId, Status status, int... condimentIds) {
        Order order = new Order.Builder()
                .setPartyId(partyId)
                .setOrderId(orderId)
                .setName("Valentin")
                .setStatus(status)
                .setCondiments(getCondimentIds(condimentIds))
                .build();
    }

    private OrderCreateDetails createNewOrderForQueue(OrderId orderId, int... condimentIds) {
        OrderCreateDetails orderCreateDetails = new OrderCreateDetails();
        orderCreateDetails.setName("Valentin");
        orderCreateDetails.setOrderId(orderId);
        orderCreateDetails.setCondiments(getCondimentIds(condimentIds));
        orderCreateDetails.setStatus(Status.WAITING);
        return orderCreateDetails;
    }

    private List<CondimentId> getCondimentIds(int[] condimentIds) {
        return Arrays.stream(condimentIds)
                .mapToObj(CondimentId::new)
                .collect(Collectors.toList());
    }

}