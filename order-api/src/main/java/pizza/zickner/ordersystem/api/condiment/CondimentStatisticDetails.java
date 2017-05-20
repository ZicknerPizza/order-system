package pizza.zickner.ordersystem.api.condiment;

import pizza.zickner.ordersystem.core.domain.condiment.CondimentId;

import java.util.List;

/**
 * @author Valentin Zickner
 */
public class CondimentStatisticDetails {

    private CondimentId id;
    private Double percentageOfOrders;
    private Statistic statistic;

    public CondimentId getId() {
        return id;
    }

    public void setId(CondimentId id) {
        this.id = id;
    }

    public Double getPercentageOfOrders() {
        return percentageOfOrders;
    }

    public void setPercentageOfOrders(Double percentageOfOrders) {
        this.percentageOfOrders = percentageOfOrders;
    }

    public Statistic getStatistic() {
        return statistic;
    }

    public void setStatistic(Statistic statistic) {
        this.statistic = statistic;
    }

    static class Statistic {
        private List<Double> greater;
        private List<Double> match;
        private List<Double> less;

        public List<Double> getGreater() {
            return greater;
        }

        public void setGreater(List<Double> greater) {
            this.greater = greater;
        }

        public List<Double> getMatch() {
            return match;
        }

        public void setMatch(List<Double> match) {
            this.match = match;
        }

        public List<Double> getLess() {
            return less;
        }

        public void setLess(List<Double> less) {
            this.less = less;
        }
    }
}
