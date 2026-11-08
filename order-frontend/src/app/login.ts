import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginError } from './auth/auth';
import { NotificationService } from './shared/notifications';

@Component({
  imports: [FormsModule],
  template: `
    <form class="form-horizontal" (submit)="login()">
      <div class="row mb-3">
        <div class="offset-md-4 col-md-4">
          <h2>Anmeldung</h2>
        </div>
      </div>
      <div class="row mb-3">
        <div class="offset-md-4 col-md-4">
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
      <div class="row mb-3">
        <div class="offset-md-4 col-md-4">
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
      @if (totpRequired()) {
        <div class="row mb-3">
          <div class="offset-md-4 col-md-4">
            <input
              #codeInput
              class="form-control"
              id="code"
              name="code"
              [(ngModel)]="code"
              placeholder="Code aus der Authenticator-App"
              autocomplete="one-time-code"
              inputmode="numeric"
              maxlength="6"
            />
          </div>
        </div>
      }
      <div class="row mb-3">
        <div class="offset-md-4 col-md-4 td_right">
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
  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  protected username = '';
  protected password = '';
  protected code = '';
  protected readonly totpRequired = signal(false);

  protected async login(): Promise<void> {
    try {
      await this.auth.login(
        this.username,
        this.password,
        this.totpRequired() ? this.code : undefined,
      );
      await this.router.navigateByUrl(this.returnUrl() ?? '/event/list');
    } catch (error) {
      if (!(error instanceof LoginError)) {
        this.notifications.error('Die Anmeldung ist fehlgeschlagen.');
        return;
      }
      // The first request only checks the password, then the backend asks for the code
      const askForCode = error.totpRequired && !this.totpRequired();
      this.totpRequired.set(error.totpRequired);
      this.code = '';
      if (askForCode) {
        setTimeout(() => this.codeInput()?.nativeElement.focus());
      } else {
        this.notifications.error(error.message);
      }
    }
  }
}
