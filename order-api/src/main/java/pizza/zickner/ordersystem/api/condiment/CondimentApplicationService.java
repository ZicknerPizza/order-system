package pizza.zickner.ordersystem.api.condiment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pizza.zickner.ordersystem.core.domain.condiment.Condiment;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;
import pizza.zickner.ordersystem.core.domain.condiment.CondimentRepository;
import pizza.zickner.ordersystem.core.domain.order.Order;
import pizza.zickner.ordersystem.core.domain.order.OrderRepository;
import pizza.zickner.ordersystem.core.domain.party.PartyRepository;
import pizza.zickner.ordersystem.core.domain.user.Roles;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class CondimentApplicationService {

    private final CondimentRepository condimentRepository;

    private final OrderRepository orderRepository;

    private final PartyRepository partyRepository;

    @Autowired
    public CondimentApplicationService(CondimentRepository condimentRepository, OrderRepository orderRepository, PartyRepository partyRepository) {
        this.condimentRepository = condimentRepository;
        this.orderRepository = orderRepository;
        this.partyRepository = partyRepository;
    }

    public List<CondimentDetails> findAll() {
        List<CondimentDetails> condimentDetails = new ArrayList<>();
        for (Condiment condiment : condimentRepository.findAllByOrderByCategorySorting()) {
            condimentDetails.add(toCondimentDetails(condiment));
        }
        return condimentDetails;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public List<CondimentStatisticDetails> findAllCondimentStatistic() {
        double numOrders = this.orderRepository.count();
        Map<CondimentId, Long> condimentOrderCount = getOrderCountForEachCondiment();
        List<CondimentStatisticDetails> condimentStatisticDetails = new ArrayList<>();
        for (Condiment condiment : this.condimentRepository.findAll()) {
            CondimentId condimentId = condiment.getCondimentId();
            double percentageOfOrders = determinePercentageOfOrders(numOrders, condimentOrderCount, condimentId);
            condimentStatisticDetails.add(toCondimentStatisticDetails(condimentId, percentageOfOrders));
        }
        return condimentStatisticDetails;
    }

    private Map<CondimentId, Long> getOrderCountForEachCondiment() {
        return this.orderRepository.streamAll()
                .map(Order::getCondiments)
                .flatMap(Collection::stream)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
    }

    private double determinePercentageOfOrders(double numOrders, Map<CondimentId, Long> condimentOrderCount, CondimentId condimentId) {
        double percentageOfOrders = 0d;
        if (condimentOrderCount.containsKey(condimentId)) {
            percentageOfOrders = ((double) condimentOrderCount.get(condimentId)) / numOrders * 100;
        }
        return percentageOfOrders;
    }

    private static CondimentDetails toCondimentDetails(Condiment condiment) {
        CondimentDetails condimentDetails = new CondimentDetails();
        condimentDetails.setId(condiment.getCondimentId());
        condimentDetails.setName(condiment.getName());
        condimentDetails.setUnit(condiment.getUnit());
        condimentDetails.setCategory(condiment.getCategory().getName());
        return condimentDetails;
    }

    private static CondimentStatisticDetails toCondimentStatisticDetails(CondimentId condimentId, double percentageOfOrders) {
        CondimentStatisticDetails condimentStatisticDetails = new CondimentStatisticDetails();
        condimentStatisticDetails.setId(condimentId);
        condimentStatisticDetails.setPercentageOfOrders(percentageOfOrders);
        CondimentStatisticDetails.Statistic statistic = new CondimentStatisticDetails.Statistic();
        statistic.setGreater(Collections.emptyList());
        statistic.setMatch(Collections.emptyList());
        statistic.setLess(Collections.emptyList());
        condimentStatisticDetails.setStatistic(statistic);
        return condimentStatisticDetails;
    }
}
