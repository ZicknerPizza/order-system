import {Component, EventEmitter, Inject, Output} from "@angular/core";
import {Router} from "@angular/router";
import {AuthenticationService, LoginEvent} from "../authentication/AuthenticationService";

@Component({
    selector: 'navigation',
    templateUrl: './Navigation.html',
    providers: []
})
export class NavigationComponent {
    private loggedIn: boolean = false;

    private lastExpand: boolean = false;

    @Output()
    private expand: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(@Inject(AuthenticationService) private authenticationService: AuthenticationService,
                @Inject(Router) private router: Router) {
        this.loggedIn = this.authenticationService.isLoggedIn();
        this.authenticationService.loginStatus$.subscribe((event: LoginEvent) => {
            switch (event) {
                case LoginEvent.LOGIN:
                    this.loggedIn = true;
                    break;
                case LoginEvent.LOGOUT:
                    this.loggedIn = false;
                    break;
            }
        })
    }

    public logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login', {}]);
    };

    private toggleExpand() {
        this.lastExpand = !this.lastExpand;
        this.expand.next(this.lastExpand);
    }
}