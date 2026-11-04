import { Component, computed, input } from '@angular/core';
import { Condiment, Order, Status } from '../api/models';
import { groupByCategory } from '../shared/condiments';

/** Orders that still need their condiments: neither in the oven nor finished */
const OPEN_STATUS: Status[] = ['INACTIVE', 'WAITING', 'TOPPING'];

/**
 * How many of the open orders need each condiment, so the kitchen sees what has to be prepared.
 */
@Component({
  selector: 'app-remaining-condiments',
  template: `
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Benötigte Zutaten</h3>
      </div>
      <ul class="list-group">
        @for (category of categories(); track category[0]) {
          <li class="list-group-item">
            <p class="condimentCategory">{{ category[0] }}</p>
            @for (entry of category[1]; track entry.id.value) {
              <div>
                <span class="badge">{{ entry.count }}</span>
                {{ entry.name }}
              </div>
            }
          </li>
        } @empty {
          <li class="list-group-item">Keine offenen Bestellungen.</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .condimentCategory {
      margin-bottom: 2px;
      color: #aaa;
    }
  `,
})
export class RemainingCondiments {
  readonly orders = input.required<Order[]>();
  readonly condiments = input.required<Condiment[]>();

  protected readonly categories = computed(() => {
    const counts = countCondiments(this.orders());
    return groupByCategory(
      this.condiments()
        .filter((condiment) => counts.has(condiment.id.value))
        .map((condiment) => ({ ...condiment, count: counts.get(condiment.id.value)! })),
    );
  });
}

/** Condiment id => number of open orders with this condiment */
export function countCondiments(orders: Order[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const order of orders) {
    if (!OPEN_STATUS.includes(order.status)) {
      continue;
    }
    for (const condiment of order.condiments) {
      counts.set(condiment.value, (counts.get(condiment.value) ?? 0) + 1);
    }
  }
  return counts;
}
