package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyCondiment;
import pizza.zickner.ordersystem.core.domain.party.UpdateParty;

import java.util.List;
import java.util.stream.Collectors;

class PartyAssembler {

    static Party toParty(CreatePartyDetails createPartyDetails) {
        return new Party.Builder()
                .setPartyId(createPartyDetails.getId())
                .setName(createPartyDetails.getName())
                .setDate(createPartyDetails.getDate())
                .setEstimatedNumberOfPizzas(createPartyDetails.getEstimatedNumberOfPizzas())
                .setBlendStatistics(createPartyDetails.getBlendStatistics())
                .setKey(createPartyDetails.getKey())
                .setCondiments(toPartyCondiments(createPartyDetails.getCondiments()))
                .build();
    }

    static PartyDetails toPartyDetails(Party party) {
        if (party == null) {
            return null;
        }
        PartyDetails partyDetails = new PartyDetails();
        partyDetails.setId(party.getPartyId());
        partyDetails.setName(party.getName());
        partyDetails.setKey(party.getKey());
        partyDetails.setBlendStatistics(party.getBlendStatistics());
        partyDetails.setEstimatedNumberOfPizzas(party.getEstimatedNumberOfPizzas());
        partyDetails.setDate(party.getDate());
        partyDetails.setCondiments(toCondimentIds(party.getCondiments()));
        return partyDetails;
    }

    static UpdateParty toUpdateParty(UpdatePartyDetails updatePartyDetails) {
        return new UpdateParty(
                updatePartyDetails.getName(),
                updatePartyDetails.getDate(),
                updatePartyDetails.getBlendStatistics(),
                updatePartyDetails.getEstimatedNumberOfPizzas(),
                toPartyCondiments(updatePartyDetails.getCondiments())
        );
    }

    private static List<PartyCondiment> toPartyCondiments(List<PartyCondimentDetails> condiments) {
        return condiments
                .stream()
                .map(PartyAssembler::toPartyCondiment)
                .collect(Collectors.toList());
    }

    private static PartyCondiment toPartyCondiment(PartyCondimentDetails partyCondimentDetails) {
        return new PartyCondiment(
                partyCondimentDetails.getCondimentId(),
                partyCondimentDetails.getAmount(),
                partyCondimentDetails.getRating()
        );
    }

    private static List<CondimentId> toCondimentIds(List<PartyCondiment> condiments) {
        return condiments
                .stream()
                .map(PartyCondiment::getCondimentId)
                .collect(Collectors.toList());
    }

    static PartyOverviewDetails toPartyOverviewDetails(Party party) {
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
