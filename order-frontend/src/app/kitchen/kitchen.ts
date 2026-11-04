import { Component, inject, input, OnInit } from '@angular/core';
import { Condiment, Party } from '../api/models';
import { OrderCreateForm } from '../shared/order-create';
import { Bakery } from './bakery';
import { KitchenStore } from './kitchen-store';
import { OrderList } from './order-list';
import { PizzaList } from './pizza-list';

@Component({
  imports: [OrderCreateForm, OrderList, PizzaList, Bakery],
  providers: [KitchenStore],
  template: `
    <div class="row">
      <div class="col-system-service col-lg-3 col-md-4 col-sm-5">
        <app-order-create
          [party]="party()"
          [condiments]="condiments()"
          title="Neuer Wunsch"
          (ordered)="store.refresh()"
        />
        <app-order-list [orders]="store.open()" title="Offene Bestellungen" />
        <app-pizza-list
          [orders]="store.topping()"
          [alwaysOpen]="true"
          title="Pizzen in der Küche"
          [condiments]="condiments()"
        />
        <app-pizza-list
          [orders]="store.baking()"
          [alwaysOpen]="true"
          title="Pizzen im Ofen"
          [condiments]="condiments()"
        />
        <app-pizza-list
          [orders]="store.eating()"
          title="Fertige Pizzen"
          [condiments]="condiments()"
        />
      </div>
      <div class="col-system-bake col-lg-9 col-md-8 col-sm-7 hidden-xs">
        <app-bakery [condiments]="condiments()" />
      </div>
    </div>
  `,
})
export class Kitchen implements OnInit {
  readonly party = input.required<Party>();
  readonly condiments = input.required<Condiment[]>();

  protected readonly store = inject(KitchenStore);

  ngOnInit(): void {
    this.store.init(this.party().id);
  }
}
