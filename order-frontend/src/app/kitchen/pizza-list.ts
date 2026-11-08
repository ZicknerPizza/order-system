import { Component, computed, input, signal } from '@angular/core';
import { Condiment, Order } from '../api/models';
import { toPizzas } from './kitchen-store';
import { PizzaDetail } from './pizza-detail';

@Component({
  selector: 'app-pizza-list',
  imports: [PizzaDetail],
  template: `
    <div class="card">
      <div
        (click)="show.set(!show())"
        [class.panel-heading-standalone]="!isOpen()"
        class="card-header panel-expand"
      >
        <h3 class="card-title mb-0">
          <span class="badge text-bg-secondary">{{ pizzas().length }}</span>
          {{ title() }}
        </h3>
      </div>
      <ul class="list-group list-group-flush" [hidden]="!isOpen()">
        @for (pizza of pizzas(); track pizza.order1.orderId.value) {
          <li class="list-group-item list-group-item-pizzas">
            <div class="row row-standalone">
              <app-pizza-detail [pizza]="pizza" [condiments]="condiments()" />
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class PizzaList {
  readonly title = input.required<string>();
  readonly orders = input.required<Order[]>();
  readonly condiments = input.required<Condiment[]>();
  readonly alwaysOpen = input(false);

  protected readonly show = signal(false);
  protected readonly isOpen = computed(() => this.show() || this.alwaysOpen());
  protected readonly pizzas = computed(() => toPizzas(this.orders()));
}
