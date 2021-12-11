package pizza.zickner.ordersystem.core.domain.party;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@Transactional
public class PartyReposityoryTest {

    @Autowired
    private PartyRepository partyRepository;

    @Test
    public void save_withNewParty_ensurePartyIsCreatedAndIdIsNotNull() {
        // Arrange
        PartyId partyId = new PartyId();
        Party party = new Party.Builder()
                .setPartyId(partyId)
                .setName("Test Party")
                .setDate(LocalDate.now())
                .build();

        // Act
        Party newParty = this.partyRepository.save(party);

        // Assert
        assertThat(newParty).isNotNull();
        assertThat(newParty.getName()).isEqualTo("Test Party");
        assertThat(newParty.getPartyId()).isEqualTo(partyId);
    }

    @SpringBootApplication
    @EnableJpaRepositories
    public static class TestConfiguration {
    }
}