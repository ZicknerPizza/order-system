package pizza.zickner.ordersystem.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.api.party.CreatePartyDetails;
import pizza.zickner.ordersystem.api.party.PartyCondimentDetails;
import pizza.zickner.ordersystem.api.party.UpdatePartyDetails;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyCondiment;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;
import pizza.zickner.ordersystem.core.domain.party.Rating;
import pizza.zickner.ordersystem.core.domain.user.Roles;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PartyControllerTest {

    public static final List<PartyCondimentDetails> CONDIMENTS = Arrays.asList(
            new PartyCondimentDetails(new CondimentId(1), 10.0, Rating.ENOUGH),
            new PartyCondimentDetails(new CondimentId(2), 20.0, Rating.TO_MUCH),
            new PartyCondimentDetails(new CondimentId(3), 30.0, null),
            new PartyCondimentDetails(new CondimentId(42), 10.0, Rating.ENOUGH)
    );
    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(authorities = Roles.ROLE_ORDER_ADMIN)
    public void list_withNewParty_ensureDateFormatIsCorrect() throws Exception {
        // Arrange
        this.partyRepository.save(new Party.Builder()
                .setPartyId(new PartyId("1"))
                .setName("Test Party")
                .setDate(LocalDate.of(2018, 7, 8))
                .build());

        // Act + Assert
        this.mockMvc.perform(get("/api/partys")
                .accept(MediaType.APPLICATION_JSON_UTF8))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id.value").value("1"))
                .andExpect(jsonPath("$[0].name").value("Test Party"))
                .andExpect(jsonPath("$[0].date").value("2018-07-08"));
    }

    @Test
    public void create_withoutAuth_ensureForbiddenIsReturned() throws Exception {
        // Arrange
        CreatePartyDetails createPartyDetails = generateCreatePartyDetails(new PartyId());

        // Act
        this.mockMvc.perform(post("/api/partys")
                .content(this.objectMapper.writeValueAsString(createPartyDetails))
                .contentType(MediaType.APPLICATION_JSON_UTF8))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = Roles.ROLE_ORDER_ADMIN)
    public void create_withNewParty_ensurePartyIsCreated() throws Exception {
        // Arrange
        PartyId partyId = new PartyId();
        CreatePartyDetails createPartyDetails = generateCreatePartyDetails(partyId);

        // Act
        this.mockMvc.perform(post("/api/partys")
                .content(this.objectMapper.writeValueAsString(createPartyDetails))
                .contentType(MediaType.APPLICATION_JSON_UTF8))
                .andExpect(status().isNoContent());

        // Assert
        Party party = this.partyRepository.findOne(partyId);
        assertThat(party).isNotNull();
        assertThat(party.getName()).isEqualTo("My next party!");
        assertThat(party.getEstimatedNumberOfPizzas()).isEqualTo(10);
        assertThat(party.getCondiments())
                .isNotNull()
                .hasSize(4);
        assertThat(
                party.getCondiments()
                        .stream()
                        .map(PartyCondiment::getCondimentId)
                        .collect(Collectors.toList())
        )
                .containsExactlyInAnyOrder(
                        new CondimentId(1),
                        new CondimentId(2),
                        new CondimentId(3),
                        new CondimentId(42)
                );
        PartyCondiment condiment2 = party.getCondiments()
                .stream()
                .filter(partyCondiment -> partyCondiment.getCondimentId().equals(new CondimentId(2)))
                .findFirst()
                .orElse(null);
        assertThat(condiment2).isNotNull();
        assertThat(condiment2.getAmount()).isEqualTo(20.0);
        assertThat(condiment2.getRating()).isEqualTo(Rating.TO_MUCH);
    }

    @Test
    @WithMockUser(authorities = Roles.ROLE_ORDER_ADMIN)
    public void update_withoutCondiments_ensureInformationIsSaved() throws Exception {
        // Arrange
        PartyId partyId = new PartyId();
        Party party = new Party.Builder()
                .setPartyId(partyId)
                .setName("Test Party")
                .setKey("12345678")
                .setDate(LocalDate.of(2019, 1, 18))
                .setEstimatedNumberOfPizzas(100)
                .setBlendStatistics(50)
                .build();

        this.partyRepository.save(party);

        LocalDate newPartyDate = LocalDate.of(2019, 2, 10);
        UpdatePartyDetails updatePartyDetails = new UpdatePartyDetails(
                "New test name",
                newPartyDate,
                45,
                100,
                Collections.emptyList()
        );

        // Act
        this.mockMvc.perform(
                put("/api/partys/" + partyId.getValue())
                        .content(this.objectMapper.writeValueAsString(updatePartyDetails))
                        .contentType(MediaType.APPLICATION_JSON_UTF8)
        )
                .andExpect(status().isNoContent());

        // Assert
        Party resultParty = this.partyRepository.findOne(partyId);
        assertThat(resultParty).isNotNull();
        assertThat(resultParty.getName()).isEqualTo("New test name");
        assertThat(resultParty.getDate()).isEqualTo(newPartyDate);
        assertThat(resultParty.getBlendStatistics()).isEqualTo(45);
        assertThat(resultParty.getEstimatedNumberOfPizzas()).isEqualTo(100);

    }

    @Test
    @WithMockUser(authorities = Roles.ROLE_ORDER_ADMIN)
    public void update_withCondiments_ensureInformationIsSaved() throws Exception {
        // Arrange
        PartyId partyId = new PartyId();
        Party party = new Party.Builder()
                .setPartyId(partyId)
                .setName("Test Party")
                .setKey("12345678")
                .setDate(LocalDate.of(2019, 1, 18))
                .setEstimatedNumberOfPizzas(100)
                .setBlendStatistics(50)
                .setCondiments(Arrays.asList(
                        new PartyCondiment(new CondimentId(1), 12.0, Rating.NOT_ENOUGH),
                        new PartyCondiment(new CondimentId(2), 12.2, Rating.ENOUGH),
                        new PartyCondiment(new CondimentId(4), 12.4, Rating.TO_MUCH)
                ))
                .build();

        this.partyRepository.save(party);

        LocalDate newPartyDate = LocalDate.of(2019, 2, 10);
        UpdatePartyDetails updatePartyDetails = new UpdatePartyDetails(
                "New test name",
                newPartyDate,
                45,
                100,
                CONDIMENTS
        );

        // Act
        this.mockMvc.perform(
                put("/api/partys/" + partyId.getValue())
                        .content(this.objectMapper.writeValueAsString(updatePartyDetails))
                        .contentType(MediaType.APPLICATION_JSON_UTF8)
        )
                .andExpect(status().isNoContent());

        // Assert
        Party resultParty = this.partyRepository.findOne(partyId);
        assertThat(resultParty).isNotNull();
        assertThat(resultParty.getName()).isEqualTo("New test name");
        List<PartyCondiment> condiments = resultParty.getCondiments();
        assertThat(condiments).hasSize(4);
        assertThat(condiments)
                .extracting(PartyCondiment::getCondimentId)
                .containsExactlyInAnyOrder(
                        new CondimentId(1),
                        new CondimentId(2),
                        new CondimentId(3),
                        new CondimentId(42)
                );

        PartyCondiment condimentById1 = getCondimentById(condiments, new CondimentId(1));
        assertThat(condimentById1).isNotNull();
        assertThat(condimentById1.getAmount()).isEqualTo(10.0);
        assertThat(condimentById1.getRating()).isEqualTo(Rating.ENOUGH);

        PartyCondiment condimentById42 = getCondimentById(condiments, new CondimentId(42));
        assertThat(condimentById42).isNotNull();
        assertThat(condimentById42.getAmount()).isEqualTo(10.0);
        assertThat(condimentById42.getRating()).isEqualTo(Rating.ENOUGH);
    }

    private static PartyCondiment getCondimentById(List<PartyCondiment> condiments, CondimentId condimentId) {
        return condiments.stream()
                .filter(c -> Objects.equals(c.getCondimentId(), condimentId))
                .findFirst()
                .orElse(null);
    }

    private CreatePartyDetails generateCreatePartyDetails(PartyId partyId) {
        return new CreatePartyDetails.Builder()
                .setId(partyId)
                .setName("My next party!")
                .setBlendStatistics(50)
                .setEstimatedNumberOfPizzas(10)
                .setDate(LocalDate.of(2018, 7, 8))
                .setCondiments(CONDIMENTS)
                .build();
    }
}