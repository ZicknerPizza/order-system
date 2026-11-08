import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Condiment, hasId, Order, Stove } from '../api/models';
import { BASE_CATEGORY } from '../shared/condiments';
import { KitchenStore, Pizza, pizzaOrders, STOVE_LABELS } from './kitchen-store';
import { PizzaDetail } from './pizza-detail';

/**
 * Bake mode: shows the next pizza to top in large font. The oldest waiting order gets a partner with the
 * same base, see choosePizza().
 * It starts by itself when a new order completes a pizza.
 */
@Component({
  selector: 'app-bakery',
  imports: [FormsModule, PizzaDetail],
  template: `
    @if (!enabled()) {
      <div class="card border-info">
        <div class="card-header">
          <h3 class="card-title mb-0">Backsystem</h3>
        </div>
        <div class="card-body">Anleitung</div>
      </div>
      <div class="mb-3 td_right">
        <button (click)="start()" type="button" class="btn btn-success">Jetzt backen!</button>
      </div>
    } @else {
      @if (current(); as pizza) {
        <div class="card">
          <div class="card-header">
            <div class="row">
              <div class="col-md-9">
                <h3 class="card-title mb-0">Pizza</h3>
              </div>
              <div class="col-md-3">
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
        <div class="mb-3 td_right">
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
        <div class="col-md-6 mb-3">
          <button (click)="stop()" type="button" class="btn btn-outline-secondary">
            Backmodus verlassen
          </button>
        </div>
        <!-- Green: compartment is free, red: a pizza is still baking there -->
        <div class="col-md-6 mb-3 td_right">
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

    /* Both buttons wrap in narrow columns */
    .oven-button {
      margin-left: 10px;
      margin-bottom: 6px;
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
        const bases = this.condiments()
          .filter((condiment) => condiment.category === BASE_CATEGORY)
          .map((condiment) => condiment.id.value);
        const [order1, order2] = choosePizza([...waiting].reverse(), bases);
        await this.store.changeStatus([order1, order2], 'TOPPING');
        this.current.set({ order1, order2 });
      }
    } finally {
      this.busy = false;
    }
  }
}

/**
 * The two orders of the next pizza, from the waiting orders oldest first (at least two):
 * the oldest order and a partner with the same base, both halves get the same sauce.
 * - The second order has another base: the next order with the same base further back.
 * - The first three have the same base, or no order has it: the second or third, whichever
 *   shares more condiments with the first, on a tie the older one.
 */
export function choosePizza(queue: Order[], baseIds: number[]): [Order, Order] {
  const [first, second, third] = queue;
  const base = (order: Order) =>
    order.condiments.find((condiment) => baseIds.includes(condiment.value))?.value ?? null;
  const sameBase = (order: Order) => base(order) === base(first);

  if (!sameBase(second)) {
    const partner = queue.slice(2).find(sameBase);
    if (partner) {
      return [first, partner];
    }
  } else if (third === undefined || !sameBase(third)) {
    return [first, second];
  }
  if (third === undefined) {
    return [first, second];
  }
  const shared = (order: Order) =>
    order.condiments.filter((condiment) => hasId(first.condiments, condiment)).length;
  return [first, shared(third) > shared(second) ? third : second];
}
