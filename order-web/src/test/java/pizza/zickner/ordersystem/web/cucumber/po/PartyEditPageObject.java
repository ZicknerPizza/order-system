package pizza.zickner.ordersystem.web.cucumber.po;

import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import pizza.zickner.ordersystem.api.party.CreatePartyDetails;
import pizza.zickner.ordersystem.api.party.PartyCondimentDetails;
import pizza.zickner.ordersystem.core.domain.condiment.Condiment;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.web.cucumber.AbstractCucumberMockMvcTest;

import java.time.LocalDate;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static pizza.zickner.ordersystem.web.cucumber.data.CondimentTestData.PARTY_CONDIMENTS;

public class PartyEditPageObject extends AbstractCucumberMockMvcTest {

    @Autowired
    private LoginPageObject.State userState;

    private ResultActions partyRequest;

    @When("^party is created with id (\\d+) and name \"([^\"]*)\" in ([\\d+]) days?$")
    public void partyIsCreatedWithIdAndWithNameAndToday(int id, String partyName, int days) throws Throwable {
        assertThat(objectMapper).isNotNull();
        CreatePartyDetails createPartyDetails = new CreatePartyDetails.Builder()
                .setId(new PartyId(id))
                .setName(partyName)
                .setBlendStatistics(50)
                .setDate(LocalDate.now().plusDays(days))
                .setCondiments(
                        PARTY_CONDIMENTS.stream()
                                .map(Condiment::getCondimentId)
                                .map(PartyCondimentDetails::new)
                                .collect(Collectors.toList()))
                .build();

        partyRequest = this.mockMvc.perform(post("/api/partys")
                .with(userState.getUser())
                .content(this.objectMapper.writeValueAsString(createPartyDetails))
                .contentType(MediaType.APPLICATION_JSON_UTF8));
    }

    @Then("^the party request was successful$")
    public void theRequestIsSuccessful() throws Throwable {
        partyRequest.andExpect(status().is2xxSuccessful());
    }

}
