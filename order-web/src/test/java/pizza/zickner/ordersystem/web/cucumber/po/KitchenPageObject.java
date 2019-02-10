package pizza.zickner.ordersystem.web.cucumber.po;

import com.fasterxml.jackson.databind.type.TypeFactory;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import pizza.zickner.ordersystem.api.order.OrderCreateDetails;
import pizza.zickner.ordersystem.api.order.OrderDetails;
import pizza.zickner.ordersystem.core.domain.condiment.Condiment;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.order.OrderId;
import pizza.zickner.ordersystem.core.domain.order.Status;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.web.cucumber.AbstractCucumberMockMvcTest;
import pizza.zickner.ordersystem.web.cucumber.data.CondimentTestData;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class KitchenPageObject extends AbstractCucumberMockMvcTest {

    @Autowired
    private LoginPageObject.State userState;

    private PartyId partyId;
    private OrderId lastOrderId = null;
    private ResultActions orderSubmit;


    @When("^the kitchen for party ([a-zA-Z0-9]*) is open$")
    public void theOrderFormForPartyIsOpen(String party) {
        this.partyId = new PartyId(party);
    }

    // Order List
    private ResultActions orders;

    @When("^the orders are r?e?loaded")
    public void theOrdersLoadedForParty() throws Throwable {
        orders = this.mockMvc.perform(get("/api/orders/" + partyId.getValue())
                .with(userState.getUser()));
    }

    @Then("^there are (\\d+) orders?$")
    public void thereAreOrdersForTheParty(int numberOfOrders) throws Throwable {
        orders
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.size()").value(numberOfOrders));
    }

    // Create Order
    private ResultActions partyInformation;
    private List<CondimentId> selectedCondiments = null;

    @When("^the order create form is open$")
    public void theOrderCreateFormIsOpen() throws Throwable {
        partyInformation = this.mockMvc.perform(get("/api/partys/" + partyId.getValue())
                .with(userState.getUser()));
    }

    @Then("^there should be (\\d+) condiments$")
    public void thereShouldBeCondiments(int numberOfCondiments) throws Throwable {
        partyInformation
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$").isMap())
                .andExpect(jsonPath("$.condiments").isArray())
                .andExpect(jsonPath("$.condiments.size()").value(numberOfCondiments));
    }

    @When("^none of the condiments should be selected$")
    public void noneOfTheCondimentsShouldBeSelected() {
        this.selectedCondiments = new ArrayList<>();
    }

    @SuppressWarnings("unused")
    @Then("^the first condiment should be (\\d+)$")
    public void theFirstCondimentShouldBe(int condimentId) {
        // The frontend takes care about ordering
    }

    @And("^condiments for pizza ([a-z]+) are selected$")
    public void condimentsForPizzaAreSelected(AvailablePizza pizza) {
        List<Condiment> condiments;
        switch (pizza) {
            case diavolo:
                condiments = CondimentTestData.PIZZA_DIAVOLO;
                break;
            case hawaii:
                condiments = CondimentTestData.PIZZA_HAWAII;
                break;
            case margarita:
                condiments = CondimentTestData.PIZZA_MARGARITA;
                break;
            default:
                throw new IllegalArgumentException("Pizza is not in AvailablePizza");
        }

        this.selectedCondiments = condiments.stream()
                .map(Condiment::getCondimentId)
                .collect(Collectors.toList());

    }

    @When("^submit the pre-order for \"([^\"]*)\"$")
    public void submitThePreorderFor(String name) throws Exception {
        OrderCreateDetails orderCreateDetails = new OrderCreateDetails();
        lastOrderId = new OrderId();
        orderCreateDetails.setOrderId(lastOrderId);
        orderCreateDetails.setName(name);
        orderCreateDetails.setCondiments(this.selectedCondiments);
        orderCreateDetails.setStatus(Status.INACTIVE);

        orderSubmit = this.mockMvc.perform(post("/api/orders/" + partyId.getValue())
                .with(userState.getUser())
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .content(objectMapper.writeValueAsString(orderCreateDetails)));
    }

    @When("^submit the order for \"([^\"]*)\"$")
    public void submitTheOrderFor(String name) throws Exception {
        OrderCreateDetails orderCreateDetails = new OrderCreateDetails();
        lastOrderId = new OrderId();
        orderCreateDetails.setOrderId(lastOrderId);
        orderCreateDetails.setName(name);
        orderCreateDetails.setCondiments(this.selectedCondiments);
        orderCreateDetails.setStatus(Status.WAITING);

        orderSubmit = this.mockMvc.perform(post("/api/orders/" + partyId.getValue())
                .with(userState.getUser())
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .content(objectMapper.writeValueAsString(orderCreateDetails)));
    }

    @Then("^the order should be submitted$")
    public void theOrderShouldBeSubmitted() throws Throwable {
        orderSubmit
                .andExpect(status().isNoContent());
    }

    @Then("^the order should have status ([A-Z]+)$")
    public void theOrderShouldHaveState(Status status) throws Exception {
        OrderDetails order = getOrderDetailsFromLastOrder();
        assertThat(order).isNotNull();
        assertThat(order.getStatus()).isEqualTo(status);
    }

    @Then("^the order should be at the end of the queue$")
    public void theOrderShouldBeAtTheEndOfTheQueue() throws Exception {
        List<OrderDetails> orders = getAllOrders();
        OrderDetails lastOrder = getOrderDetailsFromLastOrder();

        assertThat(lastOrder.getOrderId()).isEqualTo(orders.get(0).getOrderId());
    }

    @Given("^(\\d+) orders with status ([A-Z]+) are created$")
    public void ordersWithStatusAreCreated(int expectedOrders, Status status) throws Exception {
        for (int i = 0; i < expectedOrders; i++) {
            OrderCreateDetails orderCreateDetails = new OrderCreateDetails();
            lastOrderId = new OrderId();
            orderCreateDetails.setOrderId(lastOrderId);
            orderCreateDetails.setName(UUID.randomUUID().toString());
            orderCreateDetails.setCondiments(Collections.emptyList());
            orderCreateDetails.setStatus(status);

            orderSubmit = this.mockMvc.perform(post("/api/orders/" + partyId.getValue())
                    .with(userState.getUser())
                    .contentType(MediaType.APPLICATION_JSON_UTF8)
                    .content(objectMapper.writeValueAsString(orderCreateDetails)));
        }
    }

    private List<OrderDetails> getAllOrders() throws Exception {
        String content = orders.andReturn().getResponse().getContentAsString();
        TypeFactory typeFactory = objectMapper.getTypeFactory();
        return objectMapper.readValue(content, typeFactory.constructCollectionLikeType(List.class, OrderDetails.class));
    }

    private OrderDetails getOrderDetailsFromLastOrder() throws Exception {
        List<OrderDetails> orderDetails = getAllOrders();

        return orderDetails
                .stream()
                .filter(orderDetail -> Objects.equals(orderDetail.getOrderId(), lastOrderId))
                .findFirst()
                .orElse(null);
    }

    @And("^wait for (\\d+) second$")
    public void waitForSecond(int seconds) throws Exception {
        Thread.sleep(seconds * 1000);
    }

    public enum AvailablePizza {
        diavolo,
        hawaii,
        margarita
    }
}
