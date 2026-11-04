import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Condiment, Order, Stove } from '../api/models';
import { KitchenStore, Pizza, pizzaOrders, STOVE_LABELS } from './kitchen-store';
import { PizzaDetail } from './pizza-detail';

/**
 * Bake mode: shows the next pizza to top in large font. The two oldest waiting orders become one pizza.
 * It starts by itself when a new order completes a pizza.
 */
@Component({
  selector: 'app-bakery',
  imports: [FormsModule, PizzaDetail],
  template: `
    @if (!enabled()) {
      <div class="panel panel-info">
        <div class="panel-heading">
          <h3 class="panel-title">Backsystem</h3>
        </div>
        <div class="panel-body">Anleitung</div>
      </div>
      <div class="form-group td_right">
        <button (click)="start()" type="button" class="btn btn-success">Jetzt backen!</button>
      </div>
    } @else {
      @if (current(); as pizza) {
        <div class="panel panel-default">
          <div class="panel-heading">
            <div class="row">
              <div class="col-sm-9">
                <h3 class="panel-title">Pizza</h3>
              </div>
              <div class="col-sm-3">
                <input
                  id="changeFontSize"
                  type="range"
                  min="14"
                  max="64"
                  step="2"
                  [(ngModel)]="fontSize"
                  class="slider"
                />
              </div>
            </div>
          </div>
          <app-pizza-detail
            [pizza]="pizza"
            [condiments]="condiments()"
            [style.font-size.px]="fontSize"
            [alwaysOpen]="true"
          />
        </div>
      } @else if (lastOrder(); as order) {
        <div class="alert alert-warning">
          Es ist nur noch die Bestellung von {{ order.name }} da. Mit „Auffüllen“ wird sie doppelt
          bestellt und als ganze Pizza gebacken.
        </div>
        <div class="form-group td_right">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="filling()"
            (click)="fill(order)"
          >
            Auffüllen
          </button>
        </div>
      } @else {
        <div class="alert alert-warning">Es sind nicht ausreichend Bestellungen da.</div>
      }
      <div class="row">
        <div class="col-sm-6 form-group">
          <button (click)="stop()" type="button" class="btn btn-default">
            Backmodus verlassen
          </button>
        </div>
        <!-- Green: compartment is free, red: a pizza is still baking there -->
        <div class="col-sm-6 form-group td_right">
          @for (compartment of compartments(); track compartment.stove) {
            <button
              type="button"
              class="btn oven-button"
              [class.btn-success]="!compartment.occupied"
              [class.btn-danger]="compartment.occupied"
              [disabled]="!current()"
              (click)="toOven(compartment.stove)"
            >
              Ofen {{ compartment.label }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    app-pizza-detail {
      display: block;
    }

    .oven-button {
      margin-left: 10px;
    }
  `,
})
export class Bakery {
  readonly condiments = input.required<Condiment[]>();

  private readonly store = inject(KitchenStore);
  protected readonly enabled = signal(false);
  protected readonly current = signal<Pizza | null>(null);
  protected readonly filling = signal(false);
  protected fontSize = 14;
  private busy = false;

  /** The single waiting order, which can be doubled to fill a pizza */
  protected readonly lastOrder = computed(() => {
    const waiting = this.store.waiting();
    return waiting.length === 1 ? waiting[0] : null;
  });

  constructor() {
    // In bake mode a new order that completes a pizza goes straight to baking
    effect(() => {
      if (this.enabled() && this.current() === null && this.store.waiting().length >= 2) {
        this.next();
      }
    });
  }

  protected async fill(order: Order): Promise<void> {
    this.filling.set(true);
    try {
      await this.store.copy(order);
    } finally {
      this.filling.set(false);
    }
  }

  protected start(): void {
    this.enabled.set(true);
    this.next();
  }

  protected async stop(): Promise<void> {
    this.enabled.set(false);
    const pizza = this.current();
    this.current.set(null);
    if (pizza !== null) {
      await this.store.changeStatus(pizzaOrders(pizza), 'WAITING');
    }
  }

  /** Both oven compartments and whether a pizza is still baking inside */
  protected readonly compartments = computed(() => {
    const pizzas = this.store.compartments();
    return (Object.keys(STOVE_LABELS) as Stove[]).map((stove) => ({
      stove,
      label: STOVE_LABELS[stove],
      occupied: pizzas[stove] !== null,
    }));
  });

  protected async toOven(stove: Stove): Promise<void> {
    const pizza = this.current();
    if (pizza === null) {
      return;
    }
    const occupied = this.store.compartments()[stove];
    if (occupied !== null) {
      const names = pizzaOrders(occupied)
        .map((order) => order.name)
        .join(' und ');
      if (
        !window.confirm(
          `Im Fach ${STOVE_LABELS[stove]} ist noch die Pizza von ${names}. Ist sie schon draußen?`,
        )
      ) {
        return;
      }
      await this.store.changeStatus(pizzaOrders(occupied), 'EATING');
    }
    await this.store.bake(pizza, stove);
    this.current.set(null);
    await this.next();
  }

  private async next(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      await this.store.refresh();
      // The backend sorts the newest first, so the oldest orders come last
      const waiting = this.store.waiting();
      if (this.enabled() && this.current() === null && waiting.length >= 2) {
        const [order1, order2] = waiting.slice(-2);
        await this.store.changeStatus([order1, order2], 'TOPPING');
        this.current.set({ order1, order2 });
      }
    } finally {
      this.busy = false;
    }
  }
}
