import {Injectable} from "@angular/core";
import {ConnectionBackend, Headers, Http, Request, RequestOptions, RequestOptionsArgs, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()
export class AuthenticatedHttp extends Http {
    constructor(backend: ConnectionBackend,
                defaultOptions: RequestOptions) {
        super(backend, defaultOptions);
    }

    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
        if (url instanceof Request) {
            url.headers = AuthenticatedHttp.appendAuthenticationToken(url.headers);
        }
        return super.request(url, options);
    }

    private static appendAuthenticationToken(headers: Headers): Headers {
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            headers.append('Authorization', 'Basic ' + currentUser.token);
        }
        return headers;
    }
}