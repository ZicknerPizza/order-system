package pizza.zickner.ordersystem.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pizza.zickner.ordersystem.api.party.PartyApplicationService;
import pizza.zickner.ordersystem.api.party.PartyDetails;
import pizza.zickner.ordersystem.api.party.PartyOverviewDetails;
import pizza.zickner.ordersystem.core.domain.party.PartyId;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@RestController
@RequestMapping("/api/partys")
public class PartyController {

    private final PartyApplicationService partyApplicationService;

    @Autowired
    public PartyController(PartyApplicationService partyApplicationService) {
        this.partyApplicationService = partyApplicationService;
    }

    @GetMapping
    public List<PartyOverviewDetails> findAll() {
        return this.partyApplicationService.findAllOverviewDetails();
    }

    @GetMapping("/{partyId}")
    public PartyDetails findById(@PathVariable PartyId partyId) { // TODO SwaggerUI?
        return this.partyApplicationService.findById(partyId);
    }

    @GetMapping("/{partyId}/{partyKey}")
    public PartyDetails findById(@PathVariable PartyId partyId, @PathVariable String partyKey) {
        return this.partyApplicationService.findByIdAndKey(partyId, partyKey);
    }

    @PostMapping
    public void save(PartyDetails partyDetails) {
        // FIXME
        throw new UnsupportedOperationException("not implemented");
    }

    @PutMapping("/{partyId}")
    public void update(@PathVariable PartyId partyId, PartyDetails partyDetails) {
        // FIXME
        throw new UnsupportedOperationException("not implemented");
    }

}
