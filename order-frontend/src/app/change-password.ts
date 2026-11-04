import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth';
import { NotificationService } from './shared/notifications';

/** Same as the backend's UserController::MINIMUM_PASSWORD_LENGTH */
const MINIMUM_PASSWORD_LENGTH = 8;

@Component({
  imports: [FormsModule],
  template: `
    <form class="form-horizontal" (ngSubmit)="save()">
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <h2>Passwort ändern</h2>
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <input
            type="password"
            class="form-control"
            name="oldPassword"
            [(ngModel)]="oldPassword"
            placeholder="Bisheriges Passwort"
            autocomplete="current-password"
            autofocus
          />
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4">
          <input
            type="password"
            class="form-control"
            name="newPassword"
            [(ngModel)]="newPassword"
            placeholder="Neues Passwort"
            autocomplete="new-password"
          />
        </div>
      </div>
      <div class="form-group" [class.has-error]="error()">
        <div class="col-sm-offset-4 col-sm-4">
          <input
            type="password"
            class="form-control"
            name="repeatedPassword"
            [(ngModel)]="repeatedPassword"
            placeholder="Neues Passwort wiederholen"
            autocomplete="new-password"
          />
          @if (error(); as error) {
            <span class="help-block">{{ error }}</span>
          }
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-4 col-sm-4 td_right">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">Speichern</button>
        </div>
      </div>
    </form>
  `,
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected oldPassword = '';
  protected newPassword = '';
  protected repeatedPassword = '';
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected async save(): Promise<void> {
    if (this.newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      this.error.set(
        `Das neue Passwort muss mindestens ${MINIMUM_PASSWORD_LENGTH} Zeichen lang sein.`,
      );
      return;
    }
    if (this.newPassword !== this.repeatedPassword) {
      this.error.set('Die beiden neuen Passwörter stimmen nicht überein.');
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.auth.changePassword(this.oldPassword, this.newPassword);
      this.notifications.success('Das Passwort wurde geändert.');
      await this.router.navigate(['/event/list']);
    } catch (error) {
      this.error.set(
        typeof error === 'string' ? error : 'Das Passwort konnte nicht geändert werden.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
