import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-general-tabs',
  imports: [RouterLink],
  template: `
    <div class="nav-head">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a class="nav-link" [class.active]="active() === 'aboutUs'" routerLink="/general/aboutUs"
            >Wir über uns</a
          >
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="active() === 'history'" routerLink="/general/history"
            >Geschichte</a
          >
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="active() === 'imprint'" routerLink="/general/imprint"
            >Impressum</a
          >
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="active() === 'privacy'" routerLink="/general/privacy"
            >Datenschutz</a
          >
        </li>
      </ul>
    </div>
  `,
})
export class GeneralTabs {
  readonly active = input.required<'aboutUs' | 'history' | 'imprint' | 'privacy'>();
}
