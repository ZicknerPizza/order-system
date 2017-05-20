package pizza.zickner.ordersystem.api.party;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.AggregateNotFoundException;
import pizza.zickner.ordersystem.core.domain.user.Roles;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyCondiment;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

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
            partys.add(toPartyOverviewDetails(party));
        }
        return partys;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public PartyDetails findById(PartyId partyId) {
        return toPartyDetails(getParty(partyId));
    }

    public PartyDetails findByIdAndKey(PartyId partyId, String key) {
        Party party = getParty(partyId);
        if (!Objects.equals(party.getKey(), key)) {
            throw new AggregateNotFoundException();
        }
        return toPartyDetails(party);
    }

    private Party getParty(PartyId partyId) {
        Party party = this.partyRepository.findOne(partyId);
        if (party == null) {
            throw new AggregateNotFoundException();
        }
        return party;
    }

    private static PartyDetails toPartyDetails(Party party) {
        if (party == null) {
            return null;
        }
        PartyDetails partyDetails = new PartyDetails();
        partyDetails.setId(party.getPartyId());
        partyDetails.setName(party.getName());
        partyDetails.setKey(party.getKey());
        partyDetails.setBlendStatistics(party.getBlendStatistics());
        partyDetails.setCountPizza(2);
        partyDetails.setDate(party.getDate());
        partyDetails.setCondiments(toPartyCondimentDetails(party.getCondiments()));
        return partyDetails; // TODO
    }

    private static List<CondimentId> toPartyCondimentDetails(List<PartyCondiment> condiments) {
        return condiments
                .stream()
                .map(PartyCondiment::getCondimentId)
                .collect(Collectors.toList());
    }

    private static PartyOverviewDetails toPartyOverviewDetails(Party party) {
        if (party == null) {
            return null;
        }
        PartyOverviewDetails partyOverviewDetails = new PartyOverviewDetails();
        partyOverviewDetails.setId(party.getPartyId());
        partyOverviewDetails.setName(party.getName());
        partyOverviewDetails.setKey(party.getKey());
        partyOverviewDetails.setDate(party.getDate());
        return partyOverviewDetails;
    }
}
