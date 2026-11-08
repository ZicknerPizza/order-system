import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  NavigationError,
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withNavigationErrorHandler,
} from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth';

/**
 * After a deployment the server no longer has the page chunks an open browser knows. Loading the
 * new version of the app fixes that, e.g. for a kitchen page that stays open during a party.
 */
function reloadAfterDeployment(error: NavigationError): void {
  const message = String(error.error?.message ?? error.error);
  if (!/dynamically imported module|Importing a module script failed/.test(message)) {
    return;
  }
  // At most once a minute, a chunk that is missing for another reason would reload forever
  const key = 'reloadedAfterDeployment';
  try {
    if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 60000) {
      return;
    }
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Without storage the reload still happens once per page load at most
  }
  location.hash = error.url;
  location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Hash URLs like #/l/ordernow are already handed out to guests and have to keep working
    provideRouter(
      routes,
      withHashLocation(),
      withComponentInputBinding(),
      withNavigationErrorHandler(reloadAfterDeployment),
    ),
  ],
};
