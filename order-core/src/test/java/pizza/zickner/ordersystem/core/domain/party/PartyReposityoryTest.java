package pizza.zickner.ordersystem.core.domain.party;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@Transactional
public class PartyReposityoryTest {

    @Autowired
    private PartyRepository partyRepository;

    @Test
    public void save_withNewParty_ensurePartyIsCreatedAndIdIsNotNull() {
        // Arrange
        Party party = new Party.Builder()
                .setPartyId(new PartyId(1))
                .setName("Test Party")
                .setDate(LocalDate.now())
                .build();

        // Act
        Party newParty = this.partyRepository.save(party);

        // Assert
        assertThat(newParty).isNotNull();
        assertThat(newParty.getName()).isEqualTo("Test Party");
        assertThat(newParty.getPartyId()).isEqualTo(new PartyId(1));
    }

    @SpringBootApplication
    @EnableJpaRepositories
    public static class TestConfiguration {
    }
}