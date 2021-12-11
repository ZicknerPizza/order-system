package pizza.zickner.ordersystem.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;

import java.util.Objects;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class AuthorizationService {


    private final PartyRepository partyRepository;

    @Autowired
    public AuthorizationService(PartyRepository partyRepository) {
        this.partyRepository = partyRepository;
    }

    public boolean isKeyAuthorizedForParty(PartyId partyId, String key) {
        return this.partyRepository.findById(partyId)
                .map(party -> Objects.equals(party.getKey(), key))
                .orElse(true); // 404 will be handled by the application
    }
    
}
