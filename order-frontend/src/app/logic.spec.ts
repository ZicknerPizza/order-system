import { Condiment, CondimentStatistic, Order } from './api/models';
import { PartyCalculation, statisticMaximum, statisticMinimum } from './event/statistic';
import { toPizzas } from './kitchen/kitchen-store';
import { groupByCategory } from './shared/condiments';
import { isToday } from './shared/order-create';

const cheese: Condiment = { id: { value: 1 }, category: 'Käse', name: 'Emmentaler', unit: 'g' };
const ham: Condiment = { id: { value: 2 }, category: 'Wurst', name: 'Schinken', unit: 'g' };
const gouda: Condiment = { id: { value: 3 }, category: 'Käse', name: 'Gouda', unit: 'g' };

function order(id: string, condiments: number[], pizzaId: string | null = null): Order {
  return {
    orderId: { value: id },
    pizzaId: pizzaId === null ? null : { value: pizzaId },
    partyId: { value: 'party' },
    name: id,
    comment: null,
    date: null,
    timeStove: null,
    status: 'TOPPING',
    condiments: condiments.map((value) => ({ value })),
  };
}

describe('PartyCalculation', () => {
  const statistics: CondimentStatistic[] = [
    {
      id: { value: 1 },
      percentageOfOrders: 40,
      statistic: { less: [100, 120, 140], match: [200, 210, 220], greater: null },
    },
  ];
  const orders = [order('a', [1]), order('b', [1, 2]), order('c', []), order('d', [2])];
  const calculation = new PartyCalculation(statistics, orders);

  it('blends the overall statistic with the orders of the party', () => {
    // 2 of 4 orders with cheese = 50 %, overall 40 %
    expect(calculation.percentage(cheese, 0)).toBe(50);
    expect(calculation.percentage(cheese, 100)).toBe(40);
    expect(calculation.percentage(cheese, 50)).toBe(45);
  });

  it('averages the medians of all ratings for the amount per pizza', () => {
    expect(calculation.amountPerPizza(cheese)).toBe((120 + 210) / 2);
    expect(calculation.amountPerPizza(ham)).toBe(0);
  });

  it('calculates the amount for the party', () => {
    expect(calculation.amountCalculated(cheese, 0, 10)).toBe((50 * 165 * 10) / 100);
  });

  it('finds the range over all ratings', () => {
    expect(statisticMinimum(statistics[0].statistic)).toBe(100);
    expect(statisticMaximum(statistics[0].statistic)).toBe(220);
  });
});

describe('toPizzas', () => {
  it('puts two orders with the same pizza id on one pizza', () => {
    const pizzas = toPizzas([order('a', [], 'p1'), order('b', [], 'p1'), order('c', [], 'p2')]);
    expect(pizzas.map((p) => [p.order1.name, p.order2?.name ?? null])).toEqual([
      ['a', 'b'],
      ['c', null],
    ]);
  });
});

describe('groupByCategory', () => {
  it('keeps the order of the condiments', () => {
    expect(
      groupByCategory([cheese, ham, gouda]).map(([category, c]) => [category, c.length]),
    ).toEqual([
      ['Käse', 2],
      ['Wurst', 1],
    ]);
  });
});

describe('isToday', () => {
  it('compares with the local date also shortly after midnight', () => {
    expect(isToday('2026-11-03', new Date(2026, 10, 3, 0, 30))).toBe(true);
    expect(isToday('2026-11-02', new Date(2026, 10, 3, 0, 30))).toBe(false);
  });
});
