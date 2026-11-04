import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { CurrentUser, Role, Session } from '../api/models';

/**
 * Logins of the old frontend under this key held the password, they don't work any more and are
 * removed on start.
 */
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
  /** Random session token, the backend only stores its hash */
  token: string;
  role: Role;
  totp: boolean;
}

/** Thrown by login(), totpRequired asks for the code of the authenticator app */
export class LoginError {
  constructor(
    readonly message: string,
    readonly totpRequired = false,
  ) {}
}

/**
 * Session of the logged in user, sent as Bearer token with every request.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<StoredUser | null>(readStoredUser());

  readonly loggedIn = () => this.user() !== null;
  readonly username = () => this.user()?.username ?? '';
  readonly role = computed(() => this.user()?.role ?? null);
  readonly totpEnabled = computed(() => this.user()?.totp ?? false);

  /**
   * Role and session of a stored login are checked once when the app starts. Not inside the
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

  /** Throws a LoginError with the message of the backend. */
  async login(name: string, password: string, code?: string): Promise<void> {
    let session: Session;
    try {
      session = await firstValueFrom(
        this.http.post<Session>('api/session', { name, password, code }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.error?.message) {
        throw new LoginError(error.error.message, error.error.totpRequired === true);
      }
      throw new LoginError('Die Anmeldung ist fehlgeschlagen.');
    }
    this.store({
      username: session.name,
      token: session.token,
      role: session.role,
      totp: session.totp,
    });
  }

  /** Ends the session in the backend as well, so the token is worthless afterwards. */
  async logout(): Promise<void> {
    if (this.user() !== null) {
      await firstValueFrom(this.http.delete('api/session')).catch(() => undefined);
    }
    this.forget();
  }

  /** Session expired or ended elsewhere, nothing to tell the backend */
  forget(): void {
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
  }

  setTotpEnabled(totp: boolean): void {
    const user = this.user();
    if (user !== null) {
      this.store({ ...user, totp });
    }
  }

  private async refresh(): Promise<void> {
    const user = this.user();
    if (user === null) {
      return;
    }
    try {
      const current = await firstValueFrom(this.http.get<CurrentUser>('api/current-user'));
      this.store({ ...user, role: current.role, totp: current.totp });
    } catch {
      // A 401 already ended the login in the interceptor, without connection it stays
    }
  }

  private store(user: StoredUser | null): void {
    writeStoredUser(user);
    this.user.set(user);
  }
}

/** Message of a rejected request (400 or 429) from the backend, otherwise the fallback */
export function backendMessage(error: unknown, fallback: string): string {
  if (
    error instanceof HttpErrorResponse &&
    (error.status === 400 || error.status === HttpStatusCode.TooManyRequests) &&
    error.error?.message
  ) {
    return error.error.message;
  }
  return fallback;
}

/**
 * Adds the session token. When the backend no longer knows the session, the user has to log in
 * again and comes back to the page afterwards.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  if (token === null || (request.url === 'api/session' && request.method === 'POST')) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized) {
        auth.forget();
        // While the app starts, the route guard redirects with the page that was opened
        if (router.navigated) {
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      }
      return throwError(() => error);
    }),
  );
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
    // Logins of the old frontend have no role, their token is the password
    if (!user?.token || !user.role) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      username: user.username,
      token: user.token,
      role: user.role,
      totp: user.totp === true,
    };
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
