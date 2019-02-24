import {Inject, Injectable} from "@angular/core";
import {Subject, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {HttpClient, HttpHeaders} from "@angular/common/http";

declare const localStorage: any;
declare const btoa: any;

@Injectable()
export class AuthenticationService {

    private _loginStatus$: Subject<LoginEvent>;

    constructor(@Inject(HttpClient) private http: HttpClient) {
        this._loginStatus$ = new Subject<LoginEvent>();
    }

    public login(username: string, password: string) {
        let base64user = btoa(`${username}:${password}`);
        return this.http
            .get('api/current-user', {
                headers: new HttpHeaders({"Authorization": `Basic ${base64user}`})
            })
            .pipe(
                map(() => {
                    // login successful if there's a jwt token in the response
                    let user = {
                        username: username,
                        password: password,
                        token: base64user
                    };
                    if (user && user.token) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        this._loginStatus$.next(LoginEvent.LOGIN);
                    }
                }),
                catchError((e) => {
                    if (e.status === 401) {
                        return throwError('Unauthorized');
                    }
                    return throwError(e);
                })
            );
    }

    public getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    public isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }

    public logout() {
        this._loginStatus$.next(LoginEvent.LOGOUT);
        localStorage.removeItem('currentUser');
    }

    get loginStatus$() {
        return this._loginStatus$.asObservable();
    }

}

export enum LoginEvent {
    LOGIN,
    LOGOUT
}