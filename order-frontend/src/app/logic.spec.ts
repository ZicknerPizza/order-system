import { Condiment, CondimentStatistic, Order } from './api/models';
import { PartyCalculation, statisticMaximum, statisticMinimum } from './event/statistic';
import { remainingBakeTime, toPizzas } from './kitchen/kitchen-store';
import { halfMarker } from './kitchen/pizza-detail';
import { countCondiments } from './kitchen/remaining-condiments';
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
    stove: null,
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

describe('remainingBakeTime', () => {
  it('counts down the four minutes from the oven time', () => {
    const baking = { ...order('a', []), timeStove: '2026-11-04T20:00:00' };
    const start = new Date('2026-11-04T20:00:00').getTime();
    expect(remainingBakeTime(baking, start + 60_000)).toBe(3 * 60_000);
    expect(remainingBakeTime(baking, start + 5 * 60_000)).toBe(0);
  });
});

describe('halfMarker', () => {
  const catalog: Condiment[] = [
    { id: { value: 1 }, category: 'Käse', name: 'Mozzarella', unit: 'g' },
    { id: { value: 2 }, category: 'Gewürze', name: 'Chili', unit: 'g' },
    { id: { value: 3 }, category: 'Wurstwaren', name: 'Schinken', unit: 'g' },
    { id: { value: 4 }, category: 'Wurstwaren', name: 'Salami', unit: 'g' },
    { id: { value: 5 }, category: 'frische Kräuter', name: 'Basilikum', unit: 'g' },
    { id: { value: 6 }, category: 'frische Kräuter', name: 'Rucola', unit: 'g' },
    { id: { value: 7 }, category: 'Basis', name: 'Tomatensauce', unit: 'ml' },
  ];

  it('takes the lowest condiment that is only on this half, without base, cheese, herbs and spices', () => {
    const half1 = order('a', [1, 2, 3, 5]);
    const half2 = order('b', [1, 4, 6]);
    expect(halfMarker(half1, half2, catalog)).toEqual({
      condiment: 'Schinken',
      basil: true,
      rucola: false,
    });
    expect(halfMarker(half2, half1, catalog)).toEqual({
      condiment: 'Salami',
      basil: false,
      rucola: true,
    });
  });

  it('ignores base and cheese', () => {
    const withCheese = order('a', [1, 7]);
    expect(halfMarker(withCheese, order('b', []), catalog).condiment).toBeNull();
  });

  it('has no condiment when both halves are the same', () => {
    expect(halfMarker(order('a', [1, 3]), order('b', [1, 3]), catalog).condiment).toBeNull();
  });
});

describe('countCondiments', () => {
  it('counts the condiments of orders that are neither in the oven nor finished', () => {
    const counts = countCondiments([
      { ...order('a', [1, 2]), status: 'WAITING' },
      { ...order('b', [1]), status: 'TOPPING' },
      { ...order('c', [1]), status: 'INACTIVE' },
      { ...order('d', [1, 2]), status: 'BAKING' },
      { ...order('e', [2]), status: 'EATING' },
    ]);
    expect([...counts.entries()]).toEqual([
      [1, 3],
      [2, 1],
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
