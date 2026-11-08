import { Component, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/auth';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink],
  template: `
    <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
      <div [class]="expanded() ? 'container-fluid' : 'container'">
        <a class="navbar-brand" routerLink="/">zickner-pizza.de</a>
        <button
          type="button"
          class="navbar-toggler"
          [class.collapsed]="!menuOpen()"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="navbar"
          aria-label="Navigation umschalten"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="navbar" class="collapse navbar-collapse" [class.show]="menuOpen()">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/general/aboutUs">Allgemein</a>
            </li>
            @if (auth.loggedIn()) {
              <li class="nav-item"><a class="nav-link" routerLink="/event/list">Events</a></li>
              @if (auth.hasRole('KITCHEN')) {
                <li class="nav-item"><a class="nav-link" routerLink="/links">Links</a></li>
              }
            }
          </ul>
          <ul class="navbar-nav">
            @if (auth.loggedIn()) {
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle pointer"
                  role="button"
                  [class.show]="userMenuOpen()"
                  [attr.aria-expanded]="userMenuOpen()"
                  (click)="toggleUserMenu($event)"
                >
                  <i class="bi bi-person-fill" aria-hidden="true"></i>
                  {{ auth.username() }}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="userMenuOpen()">
                  <li>
                    <a class="dropdown-item" routerLink="/account/password">
                      <i class="bi bi-lock-fill margin-right" aria-hidden="true"></i>
                      Passwort ändern
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" routerLink="/account/two-factor">
                      <i class="bi bi-phone margin-right" aria-hidden="true"></i>
                      Zwei-Faktor-Anmeldung
                    </a>
                  </li>
                  @if (auth.hasRole('ADMIN')) {
                    <li>
                      <a class="dropdown-item" routerLink="/users">
                        <i class="bi bi-people-fill margin-right" aria-hidden="true"></i>
                        Benutzerverwaltung
                      </a>
                    </li>
                  }
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <a class="dropdown-item pointer" (click)="logout()">
                      <i class="bi bi-box-arrow-right margin-right" aria-hidden="true"></i>
                      Abmelden
                    </a>
                  </li>
                </ul>
              </li>
            } @else {
              <li class="nav-item">
                <a class="nav-link" routerLink="/login"
                  ><i class="bi bi-person-fill" aria-hidden="true"></i> Anmeldung</a
                >
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
  host: { '(document:click)': 'userMenuOpen.set(false)' },
})
export class Navigation {
  readonly expanded = input(false);

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Collapsed menu on small screens, Bootstrap's own JavaScript did this before. */
  protected readonly menuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.menuOpen.set(false);
        this.userMenuOpen.set(false);
      }
    });
  }

  /** Clicks anywhere else close the menu, see host listener */
  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  protected async logout(): Promise<void> {
    this.userMenuOpen.set(false);
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
