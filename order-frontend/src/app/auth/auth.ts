import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, Role } from '../api/models';

/** Same key as the old frontend, so existing logins survive the update. */
const STORAGE_KEY = 'currentUser';

/** A higher role includes the rights of the lower ones, like SystemUser.degree in the backend. */
const ROLE_RANK: Record<Role, number> = { SERVICE: 2, KITCHEN: 3, ADMIN: 4 };

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  KITCHEN: 'Küche',
  SERVICE: 'Service',
};

interface StoredUser {
  username: string;
  /** base64 of "username:password" for HTTP Basic authentication */
  token: string;
  /** Missing for logins of the old frontend until the backend was asked */
  role?: Role;
}

/**
 * The backend is stateless, every request carries the credentials as HTTP Basic header.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<StoredUser | null>(readStoredUser());

  readonly loggedIn = () => this.user() !== null;
  readonly username = () => this.user()?.username ?? '';
  readonly role = computed(() => this.user()?.role ?? null);

  /**
   * Role and credentials of a stored login are checked once when the app starts. Not inside the
   * constructor, the HTTP interceptor needs this service itself.
   */
  readonly ready: Promise<void> = Promise.resolve().then(() => this.refresh());

  get token(): string | null {
    return this.user()?.token ?? null;
  }

  hasRole(role: Role): boolean {
    const own = this.role();
    return own !== null && ROLE_RANK[own] >= ROLE_RANK[role];
  }

  /** Throws 'Unauthorized' for wrong credentials, like the old frontend reported it. */
  async login(username: string, password: string): Promise<void> {
    const token = basicToken(username, password);
    let current: CurrentUser;
    try {
      current = await firstValueFrom(
        this.http.get<CurrentUser>('api/current-user', {
          headers: { Authorization: `Basic ${token}` },
        }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        throw 'Unauthorized';
      }
      throw error;
    }
    this.store({ username, token, role: current.role });
  }

  logout(): void {
    this.store(null);
  }

  /** Throws the message of the backend, e.g. for a wrong old password. */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put('api/current-user/password', { oldPassword, newPassword }),
      );
    } catch (error) {
      throw backendMessage(error, 'Das Passwort konnte nicht geändert werden.');
    }
    // Every request carries the credentials, so the new password has to be used from now on
    const user = this.user()!;
    this.store({ ...user, token: basicToken(user.username, newPassword) });
  }

  private async refresh(): Promise<void> {
    const user = this.user();
    if (user === null) {
      return;
    }
    try {
      const current = await firstValueFrom(this.http.get<CurrentUser>('api/current-user'));
      this.store({ ...user, role: current.role });
    } catch (error) {
      // Password changed or user deleted, without connection the stored login stays
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.logout();
      }
    }
  }

  private store(user: StoredUser | null): void {
    writeStoredUser(user);
    this.user.set(user);
  }
}

/** Message of a 400 response from the backend, otherwise the fallback */
export function backendMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.status === 400 && error.error?.message) {
    return error.error.message;
  }
  return fallback;
}

function basicToken(username: string, password: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)));
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token;
  if (token === null || request.headers.has('Authorization')) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Basic ${token}` } }));
};

/** Pages for logged in users with at least the given role */
export function roleGuard(role: Role): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ready;
    if (!auth.loggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return auth.hasRole(role) ? true : router.createUrlTree(['/']);
  };
}

/** Pages for every logged in user */
export const authGuard: CanActivateFn = roleGuard('SERVICE');

function readStoredUser(): StoredUser | null {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return user?.token ? { username: user.username, token: user.token, role: user.role } : null;
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
