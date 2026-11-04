import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './navigation';
import { Notifications } from './shared/notifications';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, Notifications],
  template: `
    <app-navigation [(expanded)]="expanded" />
    <div class="container" [class.container-full]="expanded()">
      <app-notifications />
      <router-outlet />
    </div>
  `,
})
export class App {
  /** Full width layout, used in the kitchen */
  protected readonly expanded = signal(false);
}
