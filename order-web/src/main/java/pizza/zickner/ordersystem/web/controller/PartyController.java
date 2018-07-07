package pizza.zickner.ordersystem.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pizza.zickner.ordersystem.api.party.CreatePartyDetails;
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void create(@RequestBody CreatePartyDetails createPartyDetails) {
        this.partyApplicationService.create(createPartyDetails);
    }

    @PutMapping("/{partyId}")
    public void update(@PathVariable PartyId partyId, @RequestBody PartyDetails partyDetails) {
        // FIXME
        throw new UnsupportedOperationException("not implemented");
    }

}
