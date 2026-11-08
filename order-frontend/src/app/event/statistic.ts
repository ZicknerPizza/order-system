import { Condiment, CondimentStatistic, hasId, Order } from '../api/models';

/**
 * Calculation of the shopping list on the party page.
 */
export class PartyCalculation {
  private readonly statistics: Map<number, CondimentStatistic>;

  constructor(
    statistics: CondimentStatistic[],
    private readonly orders: Order[],
  ) {
    this.statistics = new Map(statistics.map((statistic) => [statistic.id.value, statistic]));
  }

  /** Expected share of orders with this condiment in percent, from the statistic alone without orders. */
  percentage(condiment: Condiment, blendStatistics: number): number {
    const percentageOverall = this.statistics.get(condiment.id.value)?.percentageOfOrders ?? 0;
    // Without orders the party has no share of its own, blending would only halve the statistic
    if (this.orders.length === 0) {
      return percentageOverall;
    }
    const ordersWithCondiment = this.orders.filter((order) =>
      hasId(order.condiments, condiment.id),
    ).length;
    const percentageParty = (ordersWithCondiment / this.orders.length) * 100;
    return (blendStatistics * percentageOverall + (100 - blendStatistics) * percentageParty) / 100;
  }

  /** Amount set by admins, otherwise the one from the ratings of past parties. */
  amountPerPizza(condiment: Condiment): number {
    return condiment.amountPerPizza ?? this.statisticAmountPerPizza(condiment);
  }

  /** Average of the median amounts per pizza of all ratings. */
  statisticAmountPerPizza(condiment: Condiment): number {
    const statistic = this.statistics.get(condiment.id.value)?.statistic;
    if (!statistic) {
      return 0;
    }
    const medians = [statistic.less, statistic.match, statistic.greater]
      .filter((values) => values !== null)
      .map((values) => values[Math.floor(values.length / 2)]);
    return medians.length === 0 ? 0 : medians.reduce((a, b) => a + b, 0) / medians.length;
  }

  amountCalculated(condiment: Condiment, blendStatistics: number, numberOfPizzas: number): number {
    return (
      (this.percentage(condiment, blendStatistics) *
        this.amountPerPizza(condiment) *
        numberOfPizzas) /
      100
    );
  }
}
