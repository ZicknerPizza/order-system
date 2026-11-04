import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Condiment } from '../api/models';
import { KitchenStore, Pizza, pizzaOrders } from './kitchen-store';
import { PizzaDetail } from './pizza-detail';

/**
 * Bake mode: shows the next pizza to top in large font. The two oldest waiting orders become one pizza.
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
      } @else {
        <div class="alert alert-warning">Es sind nicht ausreichend Bestellungen da.</div>
      }
      <div class="row">
        <div class="col-sm-6 form-group">
          <button (click)="stop()" type="button" class="btn btn-default">
            Backmodus verlassen
          </button>
        </div>
        @if (current()) {
          <div class="col-sm-6 form-group td_right">
            <button type="button" class="btn btn-danger" (click)="toOven()">Ofen</button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    app-pizza-detail {
      display: block;
    }
  `,
})
export class Bakery {
  readonly condiments = input.required<Condiment[]>();

  private readonly store = inject(KitchenStore);
  protected readonly enabled = signal(false);
  protected readonly current = signal<Pizza | null>(null);
  protected fontSize = 14;
  private busy = false;

  constructor() {
    // Waits for new orders while there was nothing to bake
    effect(() => {
      if (this.enabled() && this.current() === null && this.store.waiting().length >= 2) {
        this.next();
      }
    });
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

  protected async toOven(): Promise<void> {
    const pizza = this.current();
    if (pizza !== null) {
      await this.store.changeStatus(pizzaOrders(pizza), 'BAKING');
      this.current.set(null);
      await this.next();
    }
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
