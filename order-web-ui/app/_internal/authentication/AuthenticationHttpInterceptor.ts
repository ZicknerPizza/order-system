import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from "@angular/common/http";

declare const localStorage;

@Injectable()
export class AuthenticationHttpInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        req = AuthenticationHttpInterceptor.appendAuthenticationToken(req);
        return next.handle(req);
    }

    private static appendAuthenticationToken<T>(req: HttpRequest<T>): HttpRequest<T> {
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            return req.clone({
                headers: req.headers.set('Authorization', 'Basic ' + currentUser.token)
            });
        }
        return req;
    }
}