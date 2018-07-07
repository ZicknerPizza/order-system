package pizza.zickner.ordersystem.api.party;

import com.google.common.base.Preconditions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.AggregateNotFoundException;
import pizza.zickner.ordersystem.core.domain.user.Roles;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class PartyApplicationService {

    private final PartyRepository partyRepository;

    @Autowired
    public PartyApplicationService(PartyRepository partyRepository) {
        this.partyRepository = partyRepository;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public List<PartyOverviewDetails> findAllOverviewDetails() {
        List<PartyOverviewDetails> partys = new ArrayList<>();
        for (Party party : this.partyRepository.findAllByOrderByAktivDesc()) {
            partys.add(PartyAssembler.toPartyOverviewDetails(party));
        }
        return partys;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public PartyDetails findById(PartyId partyId) {
        return PartyAssembler.toPartyDetails(getParty(partyId));
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public void create(CreatePartyDetails createPartyDetails) {
        Preconditions.checkNotNull(createPartyDetails);
        Party party = PartyAssembler.toParty(createPartyDetails);
        this.partyRepository.save(party);
    }

    public PartyDetails findByIdAndKey(PartyId partyId, String key) {
        Party party = getParty(partyId);
        if (!Objects.equals(party.getKey(), key)) {
            throw new AggregateNotFoundException();
        }
        return PartyAssembler.toPartyDetails(party);
    }

    private Party getParty(PartyId partyId) {
        Party party = this.partyRepository.findOne(partyId);
        if (party == null) {
            throw new AggregateNotFoundException();
        }
        return party;
    }

}
