import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Condiment, CondimentId, hasId, Order, Stove } from '../api/models';
import { CondimentName, groupByCategory } from '../shared/condiments';
import { KitchenStore, Pizza, pizzaOrders, remainingBakeTime } from './kitchen-store';

/** Base, cheese, herbs and spices are hard to tell apart on a pizza, so they don't mark a half */
const INVISIBLE_CATEGORIES = /basis|käse|kräuter|gewürz/i;

export interface HalfMarker {
  /** Condiment only on this half, the lowest in the list is usually the most visible topping */
  condiment: string | null;
  basil: boolean;
  rucola: boolean;
}

export function halfMarker(
  order: Order,
  other: Order | undefined,
  condiments: Condiment[],
): HalfMarker {
  const own = condiments.filter((condiment) => hasId(order.condiments, condiment.id));
  const distinctive = own.filter(
    (condiment) =>
      !INVISIBLE_CATEGORIES.test(condiment.category) &&
      !(other && hasId(other.condiments, condiment.id)),
  );
  const has = (name: RegExp) => own.some((condiment) => name.test(condiment.name));
  return {
    condiment: distinctive.at(-1)?.name ?? null,
    basil: has(/basilikum/i),
    rucola: has(/rucola/i),
  };
}

/** One pizza with the two orders side by side, condiments on both orders are highlighted. */
@Component({
  selector: 'app-pizza-detail',
  imports: [DatePipe, CondimentName],
  template: `
    <table class="table table-pizza" [class.pizza-done]="done()">
      <thead>
        <tr>
          @for (order of orders(); track order.orderId.value; let i = $index) {
            <th
              class="table-pizza-head pizza-half pointer"
              (click)="showContent.set(!showContent())"
            >
              @let marker = showMarkers() ? markers()[i] : null;
              <p>
                {{ order.name }}
                @if (marker?.basil) {
                  <span class="herb" title="Basilikum" aria-label="Basilikum">🌿</span>
                }
                @if (marker?.rucola) {
                  <span class="herb" title="Rucola" aria-label="Rucola">🥬</span>
                }
              </p>
              <!-- The full condiment list replaces the marker when the pizza is opened -->
              @if (marker?.condiment && !contentIsVisible()) {
                <p class="marker text-muted">{{ marker?.condiment }}</p>
              }
              @if (contentIsVisible()) {
                <p class="p-pizza-comment">{{ order.comment }}</p>
              }
            </th>
          }
          @if (pizza().order1.status === 'TOPPING' && store.canBake()) {
            <th class="pizza-extra pointer bg-info" (click)="moveToQueue()">
              <p><span class="glyphicon glyphicon-arrow-up text-info" aria-hidden="true"></span></p>
            </th>
          }
          @if (pizza().order1.status === 'BAKING') {
            <th class="pizza-extra pizza-clock">
              <p>
                @if (pizza().order1.stove; as stove) {
                  <span
                    class="glyphicon"
                    [class.glyphicon-triangle-top]="stove === 'go'"
                    [class.glyphicon-triangle-bottom]="stove === 'gu'"
                    [title]="STOVE_TITLES[stove]"
                    [attr.aria-label]="STOVE_TITLES[stove]"
                  ></span>
                }
                {{ timeInStove() | date: 'm:ss' : 'UTC' }}
              </p>
            </th>
          }
        </tr>
      </thead>
      @if (contentIsVisible()) {
        <tbody>
          <tr>
            @for (categories of orderCategories(); track $index) {
              <td>
                <ul class="list-group">
                  <li class="list-group-item">
                    @for (category of categories; track category[0]) {
                      <div>
                        <p class="condimentCategory">{{ category[0] }}</p>
                        @for (condiment of category[1]; track condiment.id.value) {
                          <p class="condiment" [class.condimentTwin]="isOnBothOrders(condiment.id)">
                            <app-condiment [id]="condiment.id" />
                          </p>
                        }
                      </div>
                    }
                  </li>
                </ul>
              </td>
            }
            @if (pizza().order1.status === 'TOPPING' && store.canBake()) {
              <td class="bg-info" (click)="moveToQueue()"></td>
            }
            @if (pizza().order1.status === 'BAKING') {
              <td></td>
            }
          </tr>
          @if (pizza().order1.status === 'EATING') {
            <tr>
              @for (order of orders(); track order.orderId.value) {
                <td>
                  <div
                    class="bg-info order-copy pointer"
                    title="In neue Bestellung kopieren"
                    (click)="store.copyToForm(order)"
                  >
                    <span class="glyphicon glyphicon-copy text-info" aria-hidden="true"></span>
                  </div>
                </td>
              }
            </tr>
          }
        </tbody>
      }
    </table>
  `,
  styles: `
    .herb {
      margin-left: 2px;
    }

    .marker {
      margin-top: 2px;
      font-size: 90%;
    }

    /* Same column widths for every pizza of a list, independent of names and condiments */
    .table-pizza {
      table-layout: fixed;
    }

    .table-pizza .pizza-half {
      width: auto;
    }

    .table-pizza .pizza-extra {
      width: 70px;
    }

    /* Blinks 3 times, together DONE_BLINK_TIME */
    .pizza-done {
      animation: pizza-done 0.6s ease-in-out 3;
    }

    @keyframes pizza-done {
      50% {
        background-color: #5cb85c;
      }
    }
  `,
})
export class PizzaDetail {
  readonly pizza = input.required<Pizza>();
  readonly condiments = input.required<Condiment[]>();
  readonly alwaysOpen = input(false);

  protected readonly store = inject(KitchenStore);
  protected readonly showContent = signal(false);
  protected readonly contentIsVisible = computed(() => this.alwaysOpen() || this.showContent());

  protected readonly orders = computed(() => pizzaOrders(this.pizza()));

  protected readonly orderCategories = computed(() =>
    this.orders().map((order) =>
      groupByCategory(
        this.condiments().filter((condiment) => hasId(order.condiments, condiment.id)),
      ),
    ),
  );

  private readonly bothOrderCondiments = computed(() => {
    const { order1, order2 } = this.pizza();
    return order2 === null ? [] : order1.condiments.filter((id) => hasId(order2.condiments, id));
  });

  /** Milliseconds since the pizza went into the oven */
  protected readonly timeInStove = computed(() => {
    const timeStove = this.pizza().order1.timeStove;
    return timeStove === null ? 0 : Math.max(this.store.now() - new Date(timeStove).getTime(), 0);
  });

  protected readonly STOVE_TITLES: Record<Stove, string> = {
    go: 'oberes Fach',
    gu: 'unteres Fach',
  };

  /** Baking time is over, the row blinks until the pizza moves to the finished ones */
  protected readonly done = computed(() => {
    const order = this.pizza().order1;
    return order.status === 'BAKING' && remainingBakeTime(order, this.store.now()) === 0;
  });

  /** Pizzas in and out of the oven have to be told apart by their toppings */
  protected readonly showMarkers = computed(() =>
    ['BAKING', 'EATING'].includes(this.pizza().order1.status),
  );

  /** Tells the halves of a baked pizza apart when serving */
  protected readonly markers = computed(() => {
    const [order1, order2] = this.orders();
    return this.orders().map((order) =>
      halfMarker(order, order === order1 ? order2 : order1, this.condiments()),
    );
  });

  protected isOnBothOrders(condimentId: CondimentId): boolean {
    return hasId(this.bothOrderCondiments(), condimentId);
  }

  protected moveToQueue(): void {
    this.store.changeStatus(this.orders(), 'WAITING');
  }
}
