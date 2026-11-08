import { Component, inject, input } from '@angular/core';
import { ResolveFn, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ImprintApi } from '../api/api';
import { Imprint as ImprintData } from '../api/models';
import { GeneralTabs } from './general-tabs';

/** Person and address come from the backend configuration. */
@Component({
  imports: [GeneralTabs, RouterLink],
  template: `
    <app-general-tabs active="imprint" />
    @if (imprint(); as imprint) {
      <h2>Angaben gemäß § 5 DDG und § 18 Abs. 1 MStV</h2>
      <p>
        {{ imprint.name }}<br />
        @for (line of imprint.address; track $index) {
          {{ line }}<br />
        }
      </p>

      @if (imprint.email || imprint.phone) {
        <h2>Kontakt</h2>
        <p>
          @if (imprint.email) {
            E-Mail: {{ imprint.email }}<br />
          }
          @if (imprint.phone) {
            Telefon: {{ imprint.phone }}
          }
        </p>
      }
    } @else {
      <div class="alert alert-warning">Die Angaben zum Anbieter sind noch nicht hinterlegt.</div>
    }

    <h2>Datenschutz</h2>
    <p>
      Welche Daten bei einer Bestellung gespeichert werden, steht in der
      <a routerLink="/general/privacy">Datenschutzerklärung</a>.
    </p>
  `,
})
export class Imprint {
  readonly imprint = input.required<ImprintData | null>();
}

export const imprintResolver: ResolveFn<ImprintData | null> = () =>
  inject(ImprintApi)
    .find()
    .pipe(catchError(() => of(null)));
