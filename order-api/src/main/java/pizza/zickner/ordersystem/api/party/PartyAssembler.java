package pizza.zickner.ordersystem.api.party;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyCondiment;

import java.util.List;
import java.util.stream.Collectors;

class PartyAssembler {

    static Party toParty(CreatePartyDetails createPartyDetails) {
        return new Party.Builder()
                .setPartyId(createPartyDetails.getId())
                .setName(createPartyDetails.getName())
                .setDate(createPartyDetails.getDate())
                .setBlendStatistics(createPartyDetails.getBlendStatistics())
                .setKey(createPartyDetails.getKey())
                .setCondiments(createPartyDetails.getCondiments()
                        .stream()
                        .map(PartyAssembler::toPartyCondiment)
                        .collect(Collectors.toList()))
                .build();
    }

    private static PartyCondiment toPartyCondiment(PartyCondimentDetails partyCondimentDetails) {
        return new PartyCondiment(
                partyCondimentDetails.getCondimentId(),
                partyCondimentDetails.getAmount(),
                partyCondimentDetails.getRating()
        );
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
        partyDetails.setCountPizza(2);
        partyDetails.setDate(party.getDate());
        partyDetails.setCondiments(toPartyCondimentDetails(party.getCondiments()));
        return partyDetails;
    }

    private static List<CondimentId> toPartyCondimentDetails(List<PartyCondiment> condiments) {
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
