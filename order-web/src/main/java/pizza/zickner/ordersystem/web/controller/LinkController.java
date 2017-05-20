package pizza.zickner.ordersystem.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pizza.zickner.ordersystem.api.link.LinkApplicationService;
import pizza.zickner.ordersystem.api.link.LinkDetails;
import pizza.zickner.ordersystem.core.domain.link.LinkId;

import java.util.List;

/**
 * @author Valentin Zickner
 */
@RestController
@RequestMapping("/api/links")
public class LinkController {
    
    private final LinkApplicationService linkApplicationService;

    @Autowired
    public LinkController(LinkApplicationService linkApplicationService) {
        this.linkApplicationService = linkApplicationService;
    }

    @GetMapping()
    public List<LinkDetails> findAll() {
        return this.linkApplicationService.findAll();
    }

    @GetMapping("/search")
    public LinkDetails findByIdentifier(@RequestParam("identifier") String identifier) {
        return this.linkApplicationService.findOneByIdentifier(identifier);
    }

    @PutMapping("/{linkId}")
    public void update(@PathVariable LinkId linkId, LinkDetails linkDetails) {
        this.linkApplicationService.update(linkId, linkDetails);
    }
}