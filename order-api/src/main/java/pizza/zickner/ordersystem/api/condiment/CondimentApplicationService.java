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
import pizza.zickner.ordersystem.core.domain.party.Rating;
import pizza.zickner.ordersystem.core.domain.user.Roles;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author Valentin Zickner
 */
@Service
@Transactional
public class CondimentApplicationService {

    private static final int ORDERS_PER_PIZZA = 2;
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
        for (Condiment condiment : condimentRepository.findAllSorted()) {
            condimentDetails.add(toCondimentDetails(condiment));
        }
        return condimentDetails;
    }

    @Secured(Roles.ROLE_ORDER_ADMIN)
    public List<CondimentStatisticDetails> findAllCondimentStatistic() {
        double numOrders = this.orderRepository.count();
        Map<CondimentId, Long> condimentOrderCount = getOrderCountForEachCondiment();
        Map<CondimentId, CondimentStatisticDetails.Statistic> statisticForCondiments = getStatisticForCondiment();
        List<CondimentStatisticDetails> condimentStatisticDetails = new ArrayList<>();
        for (Condiment condiment : this.condimentRepository.findAll()) {
            CondimentId condimentId = condiment.getCondimentId();
            double percentageOfOrders = determinePercentageOfOrders(numOrders, condimentOrderCount, condimentId);
            CondimentStatisticDetails.Statistic statistic = determineStatisticForCondiment(statisticForCondiments, condimentId);
            condimentStatisticDetails.add(toCondimentStatisticDetails(condimentId, percentageOfOrders, statistic));
        }
        return condimentStatisticDetails;
    }

    private CondimentStatisticDetails.Statistic determineStatisticForCondiment(
            Map<CondimentId, CondimentStatisticDetails.Statistic> statisticForCondiments,
            CondimentId condimentId
    ) {
        CondimentStatisticDetails.Statistic statistic = statisticForCondiments.get(condimentId);
        if (statistic == null) {
            statistic = new CondimentStatisticDetails.Statistic();
        }
        return statistic;
    }

    private Map<CondimentId, CondimentStatisticDetails.Statistic> getStatisticForCondiment() {
        return partyRepository.streamAll()
                .flatMap(party -> party.getCondiments()
                        .stream()
                        .filter(Objects::nonNull)
                        .filter(partyCondiment -> partyCondiment.getAmount() != null && partyCondiment.getRating() != null)
                        .map(partyCondiment -> {
                            double numberOfOrders = this.orderRepository.findByPartyId(party.getPartyId())
                                    .stream()
                                    .map(Order::getCondiments)
                                    .flatMap(Collection::stream)
                                    .filter(condimentId -> condimentId.equals(partyCondiment.getCondimentId()))
                                    .count();
                            double amountPerOrder = partyCondiment.getAmount() / numberOfOrders;
                            return new CondimentAmount(partyCondiment.getCondimentId(), partyCondiment.getRating(), amountPerOrder);
                        })
                )
                .collect(
                        Collectors.groupingBy(
                                CondimentAmount::getCondimentId,
                                Collectors.collectingAndThen(
                                        Collectors.groupingBy(
                                                CondimentAmount::getRating,
                                                Collectors.collectingAndThen(
                                                        Collectors.toList(),
                                                        condimentAmounts -> {
                                                            List<Double> amountPerOrders = condimentAmounts
                                                                    .stream()
                                                                    .map(CondimentAmount::getAmountPerOrder)
                                                                    .collect(Collectors.toList());
                                                            Double min = Collections.min(amountPerOrders);
                                                            Double avg = amountPerOrders.stream().collect(Collectors.averagingDouble(t -> t));
                                                            Double max = Collections.max(amountPerOrders);
                                                            return Arrays.asList(
                                                                    min * ORDERS_PER_PIZZA,
                                                                    avg * ORDERS_PER_PIZZA,
                                                                    max * ORDERS_PER_PIZZA
                                                            );
                                                        }
                                                )
                                        ),
                                        ratingListMap -> {
                                            CondimentStatisticDetails.Statistic statistic = new CondimentStatisticDetails.Statistic();
                                            statistic.setLess(ratingListMap.get(Rating.NOT_ENOUGH));
                                            statistic.setMatch(ratingListMap.get(Rating.ENOUGH));
                                            statistic.setGreater(ratingListMap.get(Rating.TO_MUCH));
                                            return statistic;
                                        }
                                )
                        )
                );
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

    private static CondimentStatisticDetails toCondimentStatisticDetails(CondimentId condimentId, double percentageOfOrders,
                                                                         CondimentStatisticDetails.Statistic statistic) {
        CondimentStatisticDetails condimentStatisticDetails = new CondimentStatisticDetails();
        condimentStatisticDetails.setId(condimentId);
        condimentStatisticDetails.setPercentageOfOrders(percentageOfOrders);
        condimentStatisticDetails.setStatistic(statistic);
        return condimentStatisticDetails;
    }

    private static class CondimentAmount {
        private final CondimentId condimentId;
        private final Rating rating;
        private final double amountPerOrder;

        public CondimentAmount(CondimentId condimentId, Rating rating, double amountPerOrder) {
            this.condimentId = condimentId;
            this.rating = rating;
            this.amountPerOrder = amountPerOrder;
        }

        public CondimentId getCondimentId() {
            return condimentId;
        }

        public Rating getRating() {
            return rating;
        }

        public double getAmountPerOrder() {
            return amountPerOrder;
        }
    }
}
