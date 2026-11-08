import { Component, computed, inject, input } from '@angular/core';
import { Condiment, Stove } from '../api/models';
import { KitchenStore, Pizza, toPizzas } from './kitchen-store';
import { PizzaDetail } from './pizza-detail';

/** Order of the compartments in the list, like in the oven */
const STOVES: Stove[] = ['go', 'gu'];

/**
 * Pizzas in the oven: always one row per compartment, upper on top, so the row shows where the
 * pizza is. Pizzas without a compartment, e.g. baked before they existed, come last.
 */
@Component({
  selector: 'app-oven-list',
  imports: [PizzaDetail],
  template: `
    <div class="card">
      <div class="card-header panel-expand">
        <h3 class="card-title mb-0">
          <span class="badge text-bg-secondary">{{ count() }}</span>
          Pizzen im Ofen
        </h3>
      </div>
      <ul class="list-group list-group-flush">
        @for (row of rows(); track $index) {
          <li class="list-group-item list-group-item-pizzas">
            @if (row; as pizza) {
              <div class="row row-standalone">
                <app-pizza-detail [pizza]="pizza" [condiments]="condiments()" />
              </div>
            } @else {
              <!-- Same markup as a pizza with two empty lines, so a free compartment has the same height -->
              <div class="row row-standalone">
                <table class="table table-pizza">
                  <thead>
                    <tr>
                      <th class="table-pizza-head free">
                        <p>&nbsp;</p>
                        <p class="marker">&nbsp;</p>
                        <span class="free-label">{{ compartmentNames[$index] }} frei</span>
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            }
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    /* Same as the condiment line in the pizza detail */
    .marker {
      margin-top: 2px;
      font-size: 90%;
    }

    .free {
      position: relative;
    }

    .free-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 24px;
      font-weight: normal;
    }
  `,
})
export class OvenList {
  readonly condiments = input.required<Condiment[]>();

  private readonly store = inject(KitchenStore);

  protected readonly rows = computed((): (Pizza | null)[] => {
    const compartments = this.store.compartments();
    const inCompartments = STOVES.map((stove) => compartments[stove]);
    const others = toPizzas(this.store.baking()).filter(
      (pizza) => !inCompartments.some((shown) => shown?.order1 === pizza.order1),
    );
    return [...inCompartments, ...others];
  });

  /** Free rows only come from the compartments, in the order of STOVES */
  protected readonly compartmentNames = ['oben', 'unten'];

  protected readonly count = computed(() => this.rows().filter((row) => row !== null).length);
}
