import {Inject, Injectable} from "@angular/core";
import {Headers, Http, RequestOptions, Response} from "@angular/http";
import {Subject} from "rxjs";
import {Observable} from "rxjs/Observable";

@Injectable()
export class AuthenticationService {

    private _loginStatus$: Subject<LoginEvent>;

    constructor(@Inject(Http) private http: Http) {
        this._loginStatus$ = new Subject<LoginEvent>();
    }

    public login(username: string, password: string) {
        let base64user = btoa(`${username}:${password}`);
        return this.http
            .get('api/current-user', new RequestOptions({
                headers: new Headers({"Authorization": `Basic ${base64user}`})
            }))
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                //let user = response.json();
                let user = {
                    username: username,
                    password: password,
                    token: base64user
                };
                if (user && user.token) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this._loginStatus$.next(LoginEvent.LOGIN);
                }
            })
            .catch((e) => {
                if (e.status === 401) {
                    return Observable.throw('Unauthorized');
                }
                return Observable.throw(e);
            });
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