import {Inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {AuthenticationService} from "./AuthenticationService";

@Injectable()
export class AuthenticationGuard implements CanActivate {

    constructor(@Inject(Router) private router: Router,
                @Inject(AuthenticationService) private authenticationService: AuthenticationService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let currentUser = this.authenticationService.getCurrentUser();
        if (currentUser) {
            return true;
        }

        this.router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
        return false;
    }
}