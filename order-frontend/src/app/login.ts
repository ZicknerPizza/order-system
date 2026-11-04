import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth';
import { NotificationService } from './shared/notifications';

@Component({
  imports: [FormsModule],
  template: `
    <form class="form-horizontal" (submit)="login()">
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <h2>Anmeldung</h2>
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <input
            class="form-control"
            id="username"
            name="username"
            [(ngModel)]="username"
            placeholder="Benutzername"
            autocomplete="username"
            autofocus
          />
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <input
            type="password"
            class="form-control"
            id="password"
            name="password"
            [(ngModel)]="password"
            placeholder="Passwort"
            autocomplete="current-password"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4 td_right">
          <button type="submit" class="btn btn-primary">Anmelden</button>
        </div>
      </div>
    </form>
  `,
})
export class Login {
  /** Set by the auth guard when a protected page was opened */
  readonly returnUrl = input<string>();

  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected username = '';
  protected password = '';

  protected async login(): Promise<void> {
    try {
      await this.auth.login(this.username, this.password);
      await this.router.navigateByUrl(this.returnUrl() ?? '/event/list');
    } catch (error) {
      this.notifications.error(typeof error === 'string' ? error : 'Anmeldung fehlgeschlagen');
    }
  }
}
