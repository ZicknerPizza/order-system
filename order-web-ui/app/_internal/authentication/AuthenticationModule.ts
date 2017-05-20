import {ModuleWithProviders, NgModule} from "@angular/core";
import {AuthenticationService} from "./AuthenticationService";
import {Http, RequestOptions, XHRBackend} from "@angular/http";
import {AuthenticatedHttp} from "./AuthenticatedHttp";
import {AuthenticationGuard} from "./AuthenticationGuard";

@NgModule()
export class AuthenticationModule {

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: AuthenticationModule,
            providers: [
                AuthenticationService,
                AuthenticationGuard,
                {
                    provide: Http,
                    useFactory: (backend: XHRBackend, defaultOptions: RequestOptions) => new AuthenticatedHttp(backend, defaultOptions),
                    deps: [XHRBackend, RequestOptions]
                }
            ]
        }
    }

}