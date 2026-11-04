import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { Condiment, CondimentId, hasId } from '../api/models';
import { CondimentName, groupByCategory } from '../shared/condiments';
import { KitchenStore, Pizza, pizzaOrders } from './kitchen-store';

/** One pizza with the two orders side by side, condiments on both orders are highlighted. */
@Component({
  selector: 'app-pizza-detail',
  imports: [DatePipe, CondimentName],
  template: `
    <table class="table table-pizza">
      <thead>
        <tr>
          @for (order of orders(); track order.orderId.value) {
            <th class="table-pizza-head pointer" (click)="showContent.set(!showContent())">
              <p>{{ order.name }}</p>
              @if (contentIsVisible()) {
                <p class="p-pizza-comment">{{ order.comment }}</p>
              }
            </th>
          }
          @if (pizza().order1.status === 'TOPPING') {
            <th class="pointer bg-info" (click)="moveToQueue()">
              <p><span class="glyphicon glyphicon-arrow-up text-info" aria-hidden="true"></span></p>
            </th>
          }
          @if (pizza().order1.status === 'BAKING') {
            <th class="pizza-clock">
              <p>{{ timeInStove() | date: 'm:ss' : 'UTC' }}</p>
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
            @if (pizza().order1.status === 'TOPPING') {
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
                    title="Chef, der tut noch nicht. Freiwilliger Entwickler gesucht."
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
})
export class PizzaDetail {
  readonly pizza = input.required<Pizza>();
  readonly condiments = input.required<Condiment[]>();
  readonly alwaysOpen = input(false);

  private readonly store = inject(KitchenStore);
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

  private readonly now = signal(Date.now());

  /** Milliseconds since the pizza went into the oven */
  protected readonly timeInStove = computed(() => {
    const timeStove = this.pizza().order1.timeStove;
    return timeStove === null ? 0 : Math.max(this.now() - new Date(timeStove).getTime(), 0);
  });

  constructor() {
    const clock = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
  }

  protected isOnBothOrders(condimentId: CondimentId): boolean {
    return hasId(this.bothOrderCondiments(), condimentId);
  }

  protected moveToQueue(): void {
    this.store.changeStatus(this.orders(), 'WAITING');
  }
}
