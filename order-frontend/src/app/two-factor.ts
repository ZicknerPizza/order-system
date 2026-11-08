import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toDataURL } from 'qrcode';
import { firstValueFrom } from 'rxjs';
import { TotpApi } from './api/api';
import { TotpSetup } from './api/models';
import { AuthService, backendMessage } from './auth/auth';
import { NotificationService } from './shared/notifications';

/**
 * Sets up the authenticator app as second factor for the own login, or switches it off again.
 */
@Component({
  imports: [FormsModule],
  template: `
    <div class="row">
      <div class="col-sm-offset-3 col-sm-6">
        <h2>Zwei-Faktor-Anmeldung</h2>
        @if (auth.totpEnabled()) {
          <p>
            <span class="glyphicon glyphicon-ok text-success" aria-hidden="true"></span>
            Die Anmeldung fragt nach dem Passwort einen Code aus deiner Authenticator-App ab.
          </p>
          <form class="form-inline" (ngSubmit)="disable()">
            <div class="form-group">
              <input
                type="password"
                class="form-control"
                name="password"
                placeholder="Passwort"
                autocomplete="current-password"
                [(ngModel)]="password"
              />
            </div>
            <button type="submit" class="btn btn-default">Ausschalten</button>
          </form>
        } @else if (setup(); as setup) {
          <ol>
            <li>
              Scanne den QR-Code mit einer Authenticator-App, z. B. Google Authenticator, Microsoft
              Authenticator oder 2FAS.
            </li>
            <li>Gib den sechsstelligen Code ein, den die App anzeigt.</li>
          </ol>
          <img [src]="qrCode()" alt="QR-Code für die Authenticator-App" width="200" height="200" />
          <p class="help-block">
            Ohne Kamera: Schlüssel <code>{{ setup.secret }}</code> in der App von Hand eingeben.
          </p>
          <form class="form-inline" (ngSubmit)="confirm()">
            <div class="form-group">
              <input
                class="form-control"
                name="code"
                placeholder="Code"
                autocomplete="one-time-code"
                inputmode="numeric"
                maxlength="6"
                [(ngModel)]="code"
              />
            </div>
            <button type="submit" class="btn btn-primary">Bestätigen</button>
          </form>
        } @else {
          <p>
            Mit der Zwei-Faktor-Anmeldung reicht ein bekannt gewordenes Passwort allein nicht mehr:
            Bei der Anmeldung fragt das System zusätzlich einen Code aus einer Authenticator-App auf
            deinem Handy ab.
          </p>
          <button type="button" class="btn btn-primary" (click)="start()">Einrichten</button>
        }
      </div>
    </div>
  `,
  styles: `
    .form-inline .form-group {
      margin-right: 6px;
    }

    img {
      display: block;
      margin-bottom: 10px;
    }
  `,
})
export class TwoFactor {
  private readonly totpApi = inject(TotpApi);
  private readonly notifications = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly setup = signal<TotpSetup | null>(null);
  protected readonly qrCode = signal('');
  protected code = '';
  protected password = '';

  protected async start(): Promise<void> {
    try {
      const setup = await firstValueFrom(this.totpApi.start());
      // Generated in the browser, the secret is not sent to any other service
      this.qrCode.set(await toDataURL(setup.uri, { width: 200, margin: 1 }));
      this.setup.set(setup);
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Die Einrichtung ist fehlgeschlagen.'));
    }
  }

  protected async confirm(): Promise<void> {
    try {
      await firstValueFrom(this.totpApi.confirm(this.code));
      this.auth.setTotpEnabled(true);
      this.setup.set(null);
      this.notifications.success('Die Zwei-Faktor-Anmeldung ist eingerichtet.');
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Die Bestätigung ist fehlgeschlagen.'));
    } finally {
      this.code = '';
    }
  }

  protected async disable(): Promise<void> {
    try {
      await firstValueFrom(this.totpApi.disable(this.password));
      this.auth.setTotpEnabled(false);
      this.notifications.success('Die Zwei-Faktor-Anmeldung ist ausgeschaltet.');
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Das Ausschalten ist fehlgeschlagen.'));
    } finally {
      this.password = '';
    }
  }
}
