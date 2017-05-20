import {Component, Inject} from "@angular/core";
import {Notification} from "./Notification";
import {Observable} from "rxjs";
import {NotificationService} from "./NotificationService";

@Component({
    selector: 'notification',
    template: require('./Notification.html')
})
export class NotificationComponent {
    private notifications: Observable<Notification[]>;

    constructor(@Inject(NotificationService) notificationService: NotificationService) {
        this.notifications = notificationService.notifications$;
    }

}