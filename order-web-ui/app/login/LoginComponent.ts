import {Component, Inject} from "@angular/core";
import {AuthenticationService} from "../_internal/authentication/AuthenticationService";
import {NotificationService} from "../_internal/component/notification/NotificationService";
import {Router} from "@angular/router";

@Component({
    template: require('./Login.html'),
    providers: []
})
export class LoginComponent {

    private username: string = '';
    private password: string = '';

    constructor(@Inject(AuthenticationService) private authenticationService: AuthenticationService,
                @Inject(NotificationService) private notificationService: NotificationService,
                @Inject(Router) private router: Router) {
    }

    login() {
        this.authenticationService.login(this.username, this.password)
            .subscribe(
                data => {
                    this.router.navigate(["/event/list"]);
                },
                error => {
                    this.notificationService.error(error);
                });
    };
}