import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Navigation } from './navigation';
import { Notifications } from './shared/notifications';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, Notifications],
  template: `
    <app-navigation [expanded]="expanded()" />
    <div class="container" [class.container-full]="expanded()">
      <app-notifications />
      <router-outlet />
    </div>
  `,
})
export class App {
  /** Full width layout in the kitchen, it needs the room for its columns */
  protected readonly expanded = toSignal(
    inject(Router).events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/kitchen')),
    ),
    { initialValue: false },
  );
}
