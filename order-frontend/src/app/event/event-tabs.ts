import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-event-tabs',
  imports: [RouterLink],
  template: `
    <div class="nav-head print_not">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a class="nav-link" [class.active]="active() === 'list'" routerLink="/event/list"
            >Übersicht</a
          >
        </li>
        @if (auth.hasRole('KITCHEN')) {
          <li class="nav-item">
            <a class="nav-link" [class.active]="active() === 'edit'" routerLink="/event/edit"
              >Event neu/bearbeiten</a
            >
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
