package pizza.zickner.ordersystem.api.link;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.AggregateNotFoundException;
import pizza.zickner.ordersystem.core.domain.user.Roles;
import pizza.zickner.ordersystem.core.domain.link.Link;
import pizza.zickner.ordersystem.core.domain.link.LinkId;
import pizza.zickner.ordersystem.core.domain.link.LinkRepository;
import pizza.zickner.ordersystem.core.domain.party.Party;
import pizza.zickner.ordersystem.core.domain.party.PartyId;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class LinkApplicationService {

    private final LinkRepository linkRepository;
    private final PartyRepository partyRepository;

    @Autowired
    public LinkApplicationService(LinkRepository linkRepository, PartyRepository partyRepository) {
        this.linkRepository = linkRepository;
        this.partyRepository = partyRepository;
    }

    public LinkDetails findOneByIdentifier(String identifier) {
        Link link = this.linkRepository.findOneByIdentifier(identifier);
        if (link == null) {
            throw new AggregateNotFoundException();
        }
        return toLinkDetails(link, determinePartyKey(link.getPartyId()));
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public List<LinkDetails> findAll() {
        List<LinkDetails> linkDetails = new ArrayList<>();
        for (Link link : this.linkRepository.findAll()) {
            linkDetails.add(toLinkDetails(link, determinePartyKey(link.getPartyId())));
        }
        return linkDetails;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public void update(LinkId linkId, LinkDetails linkDetails) {
        Link link = this.linkRepository.findOne(linkId);
        if (link == null) {
            throw new AggregateNotFoundException();
        }
        link.setIdentifier(linkDetails.getIdentifier());
        link.setPartyId(linkDetails.getPartyId());
        // TODO: Set partyKey to avoid query for each partyKey
        // link.setPartyKey(linkDetails.getPartyKey());
    }

    private String determinePartyKey(PartyId partyId) {
        // TODO: Replace this method by key directly saved in the linkRepository
        Party party = this.partyRepository.findOne(partyId);
        if (party == null) {
            return null;
        }
        return party.getKey();
    }

    private static LinkDetails toLinkDetails(Link link, String partyKey) {
        if (link == null) {
            return null;
        }
        LinkDetails linkDetails = new LinkDetails();
        linkDetails.setId(link.getLinkId());
        linkDetails.setIdentifier(link.getIdentifier());
        linkDetails.setPartyId(link.getPartyId());
        linkDetails.setPartyKey(partyKey);
        return linkDetails;
    }
}
