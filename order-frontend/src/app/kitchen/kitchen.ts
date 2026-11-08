import { Component, inject, input, OnInit } from '@angular/core';
import { Condiment, Party } from '../api/models';
import { OrderCreateForm } from '../shared/order-create';
import { Bakery } from './bakery';
import { KitchenStore } from './kitchen-store';
import { OrderList } from './order-list';
import { OvenList } from './oven-list';
import { PizzaList } from './pizza-list';
import { RemainingCondiments } from './remaining-condiments';

@Component({
  imports: [OrderCreateForm, OrderList, PizzaList, OvenList, Bakery, RemainingCondiments],
  providers: [KitchenStore],
  template: `
    <div class="row">
      <div class="col-system-service col-xl-3 col-lg-4 col-md-5">
        <app-order-create
          [party]="party()"
          [condiments]="condiments()"
          title="Neuer Wunsch"
          [template]="store.orderToCopy()"
          [soldOut]="store.soldOut()"
          (ordered)="store.refresh()"
        />
        <app-order-list [orders]="store.open()" title="Offene Bestellungen" />
        <app-pizza-list
          [orders]="store.topping()"
          [alwaysOpen]="true"
          title="Pizzen in der Küche"
          [condiments]="condiments()"
        />
        <app-oven-list [condiments]="condiments()" />
        <app-pizza-list
          [orders]="store.eating()"
          title="Fertige Pizzen"
          [condiments]="condiments()"
        />
      </div>
      <div class="col-system-bake col-xl-7 col-lg-5 col-md-7 d-none d-md-block">
        @if (store.canBake()) {
          <app-bakery [condiments]="condiments()" />
        } @else {
          <!-- Service does not bake, the condiments take the place of the bakery -->
          <app-remaining-condiments [orders]="store.orders()" [condiments]="condiments()" />
        }
      </div>
      @if (store.canBake()) {
        <div class="col-xl-2 col-lg-3 d-none d-lg-block">
          <app-remaining-condiments [orders]="store.orders()" [condiments]="condiments()" />
        </div>
      }
    </div>
  `,
})
export class Kitchen implements OnInit {
  readonly party = input.required<Party>();
  readonly condiments = input.required<Condiment[]>();

  protected readonly store = inject(KitchenStore);

  ngOnInit(): void {
    this.store.init(this.party());
  }
}
