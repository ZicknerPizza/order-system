import { Condiment, CondimentStatistic, hasId, Order, Statistic } from '../api/models';

/**
 * Calculation of the shopping list on the party page, unchanged from the old frontend.
 */
export class PartyCalculation {
  private readonly statistics: Map<number, CondimentStatistic>;

  constructor(
    statistics: CondimentStatistic[],
    private readonly orders: Order[],
  ) {
    this.statistics = new Map(statistics.map((statistic) => [statistic.id.value, statistic]));
  }

  statistic(condiment: Condiment): Statistic | null {
    return this.statistics.get(condiment.id.value)?.statistic ?? null;
  }

  /** Expected share of orders with this condiment in percent. */
  percentage(condiment: Condiment, blendStatistics: number): number {
    const percentageOverall = this.statistics.get(condiment.id.value)?.percentageOfOrders ?? 0;
    let percentageParty = 0;
    if (this.orders.length > 0) {
      const ordersWithCondiment = this.orders.filter((order) =>
        hasId(order.condiments, condiment.id),
      ).length;
      percentageParty = (ordersWithCondiment / this.orders.length) * 100;
    }
    return (blendStatistics * percentageOverall + (100 - blendStatistics) * percentageParty) / 100;
  }

  /** Average of the median amounts per pizza of all ratings. */
  amountPerPizza(condiment: Condiment): number {
    const statistic = this.statistic(condiment);
    if (statistic === null) {
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

export function statisticMinimum(statistic: Statistic): number {
  const minimums = [statistic.greater, statistic.match, statistic.less]
    .filter((values) => values !== null)
    .map((values) => values[0]);
  return Math.min(Number.MAX_SAFE_INTEGER, ...minimums);
}

export function statisticMaximum(statistic: Statistic): number {
  const maximums = [statistic.greater, statistic.match, statistic.less]
    .filter((values) => values !== null)
    .map((values) => values[values.length - 1]);
  return Math.max(0, ...maximums);
}
