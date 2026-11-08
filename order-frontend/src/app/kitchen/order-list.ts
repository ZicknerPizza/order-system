import { Component, inject, input, signal } from '@angular/core';
import { Order } from '../api/models';
import { CondimentCatalog } from '../shared/condiments';
import { KitchenStore } from './kitchen-store';

/** Open orders, which can be activated, deactivated and deleted. */
@Component({
  selector: 'app-order-list',
  template: `
    <div class="panel panel-default">
      <div
        (click)="show.set(!show())"
        [class.panel-heading-standalone]="!show()"
        class="panel-heading panel-expand"
      >
        <h3 class="panel-title">
          <span class="badge">{{ orders().length }}</span>
          {{ title() }}
        </h3>
      </div>
      <ul class="list-group" [hidden]="!show()">
        @for (order of orders(); track order.orderId.value) {
          <li class="list-group-item" [class.list-group-item-disabled]="!isActive(order)">
            <div class="row row-standalone row-flex">
              <div class="list-group-item-content pointer" (click)="toggleDetails(order)">
                {{ order.name }}
                @if (details().has(order.orderId.value)) {
                  <div>
                    @if (order.comment) {
                      <p class="order-comment">{{ order.comment }}<br /></p>
                    }
                    {{ condimentNames(order) }}
                  </div>
                }
              </div>
              @if (isActive(order)) {
                <div
                  (click)="store.changeStatus([order], 'INACTIVE')"
                  class="list-group-item-action pointer bg-info"
                >
                  <span
                    title="deaktivieren"
                    class="glyphicon glyphicon-ban-circle text-info"
                    aria-hidden="true"
                  ></span>
                </div>
              } @else {
                <div
                  (click)="store.changeStatus([order], 'WAITING')"
                  class="list-group-item-action pointer bg-success"
                >
                  <span
                    title="aktivieren"
                    class="glyphicon glyphicon-ok-circle text-success"
                    aria-hidden="true"
                  ></span>
                </div>
              }
              <div (click)="delete(order)" class="list-group-item-action pointer bg-danger">
                <span
                  title="löschen"
                  class="glyphicon glyphicon-remove-circle text-danger"
                  aria-hidden="true"
                ></span>
              </div>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class OrderList {
  readonly title = input.required<string>();
  readonly orders = input.required<Order[]>();

  protected readonly store = inject(KitchenStore);
  private readonly catalog = inject(CondimentCatalog);
  protected readonly show = signal(false);
  protected readonly details = signal(new Set<string>());

  protected condimentNames(order: Order): string {
    return order.condiments
      .map((condiment) => this.catalog.byId().get(condiment.value)?.name ?? '')
      .join(', ');
  }

  protected isActive(order: Order): boolean {
    return order.status !== 'INACTIVE';
  }

  protected toggleDetails(order: Order): void {
    this.details.update((details) => {
      const next = new Set(details);
      if (!next.delete(order.orderId.value)) {
        next.add(order.orderId.value);
      }
      return next;
    });
  }

  protected delete(order: Order): void {
    if (window.confirm('Möchtest du diese Bestellung wirklich löschen?')) {
      this.store.delete(order);
    }
  }
}
