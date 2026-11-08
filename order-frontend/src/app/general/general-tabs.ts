import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-general-tabs',
  imports: [RouterLink],
  template: `
    <div class="nav-head">
      <ul class="nav nav-tabs">
        <li [class.active]="active() === 'aboutUs'">
          <a routerLink="/general/aboutUs">Wir über uns</a>
        </li>
        <li [class.active]="active() === 'history'">
          <a routerLink="/general/history">Geschichte</a>
        </li>
        <li [class.active]="active() === 'imprint'">
          <a routerLink="/general/imprint">Impressum</a>
        </li>
        <li [class.active]="active() === 'privacy'">
          <a routerLink="/general/privacy">Datenschutz</a>
        </li>
      </ul>
    </div>
  `,
})
export class GeneralTabs {
  readonly active = input.required<'aboutUs' | 'history' | 'imprint' | 'privacy'>();
}
