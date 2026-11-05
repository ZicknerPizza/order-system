import { Component, computed, inject, input } from '@angular/core';
import { Condiment, CondimentId, hasId, Order, Status } from '../api/models';
import { groupByCategory } from '../shared/condiments';
import { KitchenStore } from './kitchen-store';

/** Orders that still need their condiments: neither in the oven nor finished */
const OPEN_STATUS: Status[] = ['INACTIVE', 'WAITING', 'TOPPING'];

/**
 * How many of the open orders need each condiment, so the kitchen sees what has to be prepared.
 * A condiment that ran out is marked here, it stays in the list until it is available again.
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
              <div class="entry">
                <span class="badge">{{ entry.count }}</span>
                <span [class.sold-out]="entry.soldOut">{{ entry.name }}</span>
                @if (entry.soldOut) {
                  <button
                    type="button"
                    class="btn btn-xs btn-success pull-right"
                    title="Die Zutat kann wieder bestellt werden"
                    (click)="setSoldOut(entry.id, false)"
                  >
                    Wieder da
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn btn-xs btn-default pull-right"
                    title="Die Zutat ist ausgegangen und kann nicht mehr bestellt werden"
                    (click)="setSoldOut(entry.id, true)"
                  >
                    Leer
                  </button>
                }
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

    .entry {
      overflow: hidden;
      margin-bottom: 3px;
    }

    .sold-out {
      color: #aaa;
      text-decoration: line-through;
    }
  `,
})
export class RemainingCondiments {
  readonly orders = input.required<Order[]>();
  readonly condiments = input.required<Condiment[]>();

  private readonly store = inject(KitchenStore);

  protected readonly categories = computed(() => {
    const counts = countCondiments(this.orders());
    const soldOut = this.store.soldOut();
    return groupByCategory(
      this.condiments()
        .map((condiment) => ({
          ...condiment,
          count: counts.get(condiment.id.value) ?? 0,
          soldOut: hasId(soldOut, condiment.id),
        }))
        .filter((condiment) => condiment.count > 0 || condiment.soldOut),
    );
  });

  protected setSoldOut(condimentId: CondimentId, soldOut: boolean): void {
    this.store.setSoldOut(condimentId, soldOut);
  }
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
