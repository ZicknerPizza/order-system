import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

/** Same key as the old frontend, so existing logins survive the update. */
const STORAGE_KEY = 'currentUser';

interface StoredUser {
  username: string;
  /** base64 of "username:password" for HTTP Basic authentication */
  token: string;
}

/**
 * The backend is stateless, every request carries the credentials as HTTP Basic header.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<StoredUser | null>(readStoredUser());

  readonly loggedIn = () => this.user() !== null;

  get token(): string | null {
    return this.user()?.token ?? null;
  }

  /** Throws 'Unauthorized' for wrong credentials, like the old frontend reported it. */
  async login(username: string, password: string): Promise<void> {
    const token = btoa(String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)));
    try {
      await firstValueFrom(
        this.http.get('api/current-user', { headers: { Authorization: `Basic ${token}` } }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        throw 'Unauthorized';
      }
      throw error;
    }
    const user = { username, token };
    writeStoredUser(user);
    this.user.set(user);
  }

  logout(): void {
    writeStoredUser(null);
    this.user.set(null);
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token;
  if (token === null || request.headers.has('Authorization')) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Basic ${token}` } }));
};

export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).loggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

function readStoredUser(): StoredUser | null {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return user?.token ? { username: user.username, token: user.token } : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: StoredUser | null): void {
  try {
    if (user === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // Login then only lasts until the page is reloaded
  }
}
