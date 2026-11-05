import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UserApi } from './api/api';
import { Role, User } from './api/models';
import { AuthService, backendMessage, ROLE_LABELS } from './auth/auth';
import { NotificationService } from './shared/notifications';

/** Admins create and delete users and set their roles and passwords. */
@Component({
  imports: [FormsModule],
  template: `
    <h2>Benutzerverwaltung</h2>
    <div class="panel panel-default panel-table">
      <table class="table table-condensed">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rolle</th>
            <th>2FA</th>
            <th>Neues Passwort</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr>
              <td>{{ user.name }}</td>
              <td>
                @if (user.name === auth.username()) {
                  <!-- Admins can't lock themselves out -->
                  {{ user.role ? roleLabels[user.role] : 'deaktiviert' }}
                } @else {
                  <select
                    class="form-control input-sm"
                    [ngModel]="user.role"
                    (ngModelChange)="setRole(user, $event)"
                  >
                    @for (role of roles; track role) {
                      <option [ngValue]="role">{{ roleLabels[role] }}</option>
                    }
                    <option [ngValue]="null">deaktiviert</option>
                  </select>
                }
              </td>
              <td>
                @if (user.totp) {
                  <span
                    class="glyphicon glyphicon-phone text-success"
                    title="Zwei-Faktor-Anmeldung aktiv"
                    aria-hidden="true"
                  ></span>
                  <button
                    type="button"
                    class="btn btn-xs btn-link"
                    title="Bei verlorenem Handy: danach reicht das Passwort"
                    (click)="resetTotp(user)"
                  >
                    zurücksetzen
                  </button>
                }
              </td>
              <td>
                <div class="input-group input-group-sm">
                  <input
                    type="password"
                    class="form-control"
                    placeholder="Passwort setzen"
                    autocomplete="new-password"
                    [(ngModel)]="passwords[user.id]"
                  />
                  <span class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-default"
                      title="Passwort setzen"
                      (click)="setPassword(user)"
                    >
                      <span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span>
                    </button>
                  </span>
                </div>
              </td>
              <td class="td_right">
                @if (user.name !== auth.username()) {
                  <button
                    type="button"
                    class="btn btn-sm btn-default"
                    title="Löschen"
                    (click)="delete(user)"
                  >
                    <span class="glyphicon glyphicon-trash text-danger" aria-hidden="true"></span>
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <h2>Neuer Benutzer</h2>
    <form class="form-inline" (ngSubmit)="create()">
      <div class="form-group">
        <input
          class="form-control"
          name="name"
          placeholder="Name"
          autocomplete="off"
          [(ngModel)]="newUser.name"
        />
      </div>
      <div class="form-group">
        <select class="form-control" name="role" [(ngModel)]="newUser.role">
          @for (role of roles; track role) {
            <option [value]="role">{{ roleLabels[role] }}</option>
          }
        </select>
      </div>
      <div class="form-group">
        <input
          type="password"
          class="form-control"
          name="password"
          placeholder="Passwort"
          autocomplete="new-password"
          [(ngModel)]="newUser.password"
        />
      </div>
      <button type="submit" class="btn btn-primary">Anlegen</button>
    </form>
    <p class="help-block">
      Service nimmt in der Küche Bestellungen auf, backt aber nicht. Küche backt und verwaltet
      Events und Links. Admin verwaltet zusätzlich die Benutzer.
    </p>
  `,
  styles: `
    .table > tbody > tr > td {
      vertical-align: middle;
    }

    .form-inline .form-group {
      margin-right: 6px;
    }
  `,
})
export class UserAdmin implements OnInit {
  private readonly userApi = inject(UserApi);
  private readonly notifications = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roles: Role[] = ['SERVICE', 'KITCHEN', 'ADMIN'];
  protected readonly users = signal<User[]>([]);
  protected passwords: Record<number, string> = {};
  protected newUser = { name: '', role: 'KITCHEN' as Role, password: '' };

  ngOnInit(): void {
    this.load();
  }

  protected async create(): Promise<void> {
    try {
      await firstValueFrom(this.userApi.create(this.newUser));
      this.notifications.success(`${this.newUser.name} wurde angelegt.`);
      this.newUser = { name: '', role: 'KITCHEN', password: '' };
      await this.load();
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Der Benutzer konnte nicht angelegt werden.'));
    }
  }

  protected async setPassword(user: User): Promise<void> {
    try {
      await firstValueFrom(this.userApi.setPassword(user.id, this.passwords[user.id] ?? ''));
      delete this.passwords[user.id];
      this.notifications.success(`Das Passwort von ${user.name} wurde gesetzt.`);
      // Reloading refreshes the view, the emptied field would stay filled otherwise
      await this.load();
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Das Passwort konnte nicht gesetzt werden.'));
    }
  }

  protected async setRole(user: User, role: Role | null): Promise<void> {
    try {
      await firstValueFrom(this.userApi.setRole(user.id, role));
      this.notifications.success(
        role ? `${user.name} ist jetzt ${this.roleLabels[role]}.` : `${user.name} ist deaktiviert.`,
      );
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Die Rolle konnte nicht geändert werden.'));
    }
    // Also puts the selection back after an error
    await this.load();
  }

  protected async resetTotp(user: User): Promise<void> {
    if (!window.confirm(`Zwei-Faktor-Anmeldung von ${user.name} zurücksetzen?`)) {
      return;
    }
    try {
      await firstValueFrom(this.userApi.resetTotp(user.id));
      this.notifications.success(`${user.name} meldet sich jetzt nur mit dem Passwort an.`);
      await this.load();
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Das Zurücksetzen ist fehlgeschlagen.'));
    }
  }

  protected async delete(user: User): Promise<void> {
    if (!window.confirm(`Möchtest du ${user.name} wirklich löschen?`)) {
      return;
    }
    try {
      await firstValueFrom(this.userApi.delete(user.id));
      this.notifications.success(`${user.name} wurde gelöscht.`);
      await this.load();
    } catch (error) {
      this.notifications.error(backendMessage(error, 'Der Benutzer konnte nicht gelöscht werden.'));
    }
  }

  private async load(): Promise<void> {
    this.users.set(await firstValueFrom(this.userApi.findAll()));
  }
}
