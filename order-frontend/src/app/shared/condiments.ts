import { Component, computed, inject, Injectable, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ResolveFn } from '@angular/router';
import { Observable, shareReplay } from 'rxjs';
import { CondimentApi } from '../api/api';
import { Condiment, CondimentId, CondimentStatistic } from '../api/models';

/**
 * The condiments hardly ever change, so they are loaded once per page load.
 */
@Injectable({ providedIn: 'root' })
export class CondimentCatalog {
  readonly condiments$: Observable<Condiment[]> = inject(CondimentApi)
    .findAll()
    .pipe(shareReplay(1));

  private readonly condiments = toSignal(this.condiments$, { initialValue: [] });

  readonly byId = computed(
    () => new Map(this.condiments().map((condiment) => [condiment.id.value, condiment])),
  );

  /** Keeps the loaded list up to date after an admin changed the amount per pizza */
  setAmountPerPizza(condimentId: CondimentId, amountPerPizza: number | null): void {
    const condiment = this.byId().get(condimentId.value);
    if (condiment) {
      condiment.amountPerPizza = amountPerPizza;
    }
  }
}

export const condimentsResolver: ResolveFn<Condiment[]> = () =>
  inject(CondimentCatalog).condiments$;

export const condimentStatisticResolver: ResolveFn<CondimentStatistic[]> = () =>
  inject(CondimentApi).findStatistic();

/** Category of the sauce or cream the pizza is spread with, an order has one or none */
export const BASE_CATEGORY = 'Basis';

/** Keeps the order of the condiments, which the backend sorts by category. */
export function groupByCategory<T extends Condiment>(condiments: T[]): [string, T[]][] {
  const categories = new Map<string, T[]>();
  for (const condiment of condiments) {
    const category = categories.get(condiment.category);
    if (category) {
      category.push(condiment);
    } else {
      categories.set(condiment.category, [condiment]);
    }
  }
  return [...categories.entries()];
}

@Component({
  selector: 'app-condiment',
  template: '{{ name() }}',
})
export class CondimentName {
  readonly id = input.required<CondimentId>();

  private readonly catalog = inject(CondimentCatalog);
  protected readonly name = computed(() => this.catalog.byId().get(this.id().value)?.name ?? '');
}
