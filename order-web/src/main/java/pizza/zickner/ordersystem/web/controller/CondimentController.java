package pizza.zickner.ordersystem.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pizza.zickner.ordersystem.api.condiment.CondimentApplicationService;
import pizza.zickner.ordersystem.api.condiment.CondimentDetails;
import pizza.zickner.ordersystem.api.condiment.CondimentStatisticDetails;

import java.util.Collections;
import java.util.List;

/**
 * @author Valentin Zickner
 */
@RestController
@RequestMapping("/api/condiments")
public class CondimentController {

    private final CondimentApplicationService condimentApplicationService;

    @Autowired
    public CondimentController(CondimentApplicationService condimentApplicationService) {
        this.condimentApplicationService = condimentApplicationService;
    }

    @GetMapping("/statistic")
    public List<CondimentStatisticDetails> findCondimentStatistic() {
        return this.condimentApplicationService.findAllCondimentStatistic();
    }

    @GetMapping
    public List<CondimentDetails> findAll() {
        return this.condimentApplicationService.findAll();
    }

}