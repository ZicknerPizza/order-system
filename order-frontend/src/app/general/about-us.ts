import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GeneralTabs } from './general-tabs';

@Component({
  imports: [GeneralTabs, RouterLink],
  template: `
    <app-general-tabs active="aboutUs" />
    <h2>Herzlich Willkommen bei zickner-pizza.de!</h2>
    <p>Bei uns gibt es Pizza bis der Pizzaservice kommt und den Rest abholt.</p>
    <p>
      Unser Ziel ist leckere und vor allem individuelle Pizza zu backen und zu essen. Dabei blicken
      wir auf eine lange <a routerLink="/general/history">Geschichte</a> des Pizzabackens und
      'Nicht-Backens' zurück. Aber wir backen nicht nur zu Hause, sondern sind auch ab und zu mit
      unserem Ofen und vielen Computern auf Tour.
    </p>
    <p>
      Viel Spass beim Stöbern.<br />
      Zickner-Pizza-Team
    </p>

    <br />

    <div class="card border-warning">
      <div class="card-header">
        <h3 class="card-title mb-0">
          <span class="bi bi-exclamation-triangle-fill margin-right" aria-hidden="true"></span
          >Wichtiger Hinweis:
        </h3>
      </div>
      <div class="card-body">
        Nein, wir sind kein Pizza Service. Falls du uns über einen Branchenbucheintrag gefunden
        hast, müssen wir dich leider enttäuschen. Ansonsten wünschen wir dir viel Spaß.
      </div>
    </div>
  `,
})
export class AboutUs {}
