import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-event-tabs',
  imports: [RouterLink],
  template: `
    <div class="nav-head print_not">
      <ul class="nav nav-tabs">
        <li [class.active]="active() === 'list'"><a routerLink="/event/list">Übersicht</a></li>
        @if (auth.hasRole('KITCHEN')) {
          <li [class.active]="active() === 'edit'">
            <a routerLink="/event/edit">Event neu/bearbeiten</a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class EventTabs {
  readonly active = input.required<'list' | 'edit'>();

  protected readonly auth = inject(AuthService);
}
