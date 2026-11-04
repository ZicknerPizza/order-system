import { Component, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/auth';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink],
  template: `
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container" [class.container-full]="expanded()">
        <div class="navbar-header">
          <button
            type="button"
            class="navbar-toggle"
            [class.collapsed]="!menuOpen()"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="navbar"
          >
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" routerLink="/">zickner.pizza</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse" [class.in]="menuOpen()">
          <ul class="nav navbar-nav">
            <li><a routerLink="/general/aboutUs">Allgemein</a></li>
            @if (auth.loggedIn()) {
              <li><a routerLink="/event/list">Events</a></li>
              <li><a routerLink="/links">Links</a></li>
            }
          </ul>
          @if (auth.loggedIn()) {
            <ul class="nav navbar-nav navbar-right">
              <li>
                <a class="pointer" (click)="expandedChange.emit(!expanded())">
                  <span
                    class="glyphicon"
                    [class.glyphicon-resize-full]="!expanded()"
                    [class.glyphicon-resize-small]="expanded()"
                    aria-hidden="true"
                  ></span>
                </a>
              </li>
              <li><a class="pointer" (click)="logout()">Abmelden</a></li>
            </ul>
          } @else {
            <ul class="nav navbar-nav navbar-right">
              <li>
                <a routerLink="/login"
                  ><span class="glyphicon glyphicon-user" aria-hidden="true"></span> Anmeldung</a
                >
              </li>
            </ul>
          }
        </div>
      </div>
    </nav>
  `,
})
export class Navigation {
  readonly expanded = input(false);
  readonly expandedChange = output<boolean>();

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Collapsed menu on small screens, Bootstrap's own JavaScript did this before. */
  protected readonly menuOpen = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.menuOpen.set(false);
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
