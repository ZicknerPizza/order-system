import { Component, inject, input } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { PartyApi } from './api/api';
import { Condiment, Party } from './api/models';
import { OrderCreateForm } from './shared/order-create';

/** Order page for guests, reachable with the party key. */
@Component({
  imports: [OrderCreateForm],
  template: `
    @if (party(); as party) {
      <app-order-create
        [party]="party"
        [alwaysOpen]="true"
        [condiments]="condiments()"
        [soldOut]="party.soldOut"
        title="Wünsche dir deine Pizza für die {{ party.name }}"
      />
    } @else {
      <div class="alert alert-danger">
        <span class="bi bi-exclamation-circle-fill" aria-hidden="true"></span>
        <span class="visually-hidden">Fehler:</span>
        Für dieses Event ist leider keine Bestellung möglich.
      </div>
    }
  `,
})
export class OrderPage {
  readonly party = input.required<Party | null>();
  readonly condiments = input.required<Condiment[]>();
}

export const partyByKeyResolver: ResolveFn<Party | null> = (route) =>
  inject(PartyApi)
    .findOne(route.paramMap.get('id')!, route.paramMap.get('key')!)
    .pipe(catchError(() => of(null)));
