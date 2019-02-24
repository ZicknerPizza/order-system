import {ModuleWithProviders, NgModule} from "@angular/core";
import {AuthenticationService} from "./AuthenticationService";
import {AuthenticationGuard} from "./AuthenticationGuard";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {AuthenticationHttpInterceptor} from "./AuthenticationHttpInterceptor";

@NgModule()
export class AuthenticationModule {

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: AuthenticationModule,
            providers: [
                AuthenticationService,
                AuthenticationGuard,
                {provide: HTTP_INTERCEPTORS, useClass: AuthenticationHttpInterceptor, multi: true}
            ]
        }
    }

}