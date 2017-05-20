import {Notification} from "./Notification";
import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";

@Injectable()
export class NotificationService {
    public notifications: Notification[];
    private _notifications$: Subject<Notification[]>;

    constructor() {
        this.notifications = [];
        this._notifications$ = <Subject<Notification[]>>new Subject();
        this.triggerNewNotifications();
    }

    triggerNewNotifications() {
        this._notifications$.next(this.notifications.slice(0));
    }

    addNotification(message, level) {
        let notification: Notification = {
            message: message,
            level: level
        };
        this.notifications[this.notifications.length] = notification;
        this.triggerNewNotifications();

        setTimeout(() => {
            let index = this.notifications.indexOf(notification);
            this.notifications.splice(index, 1);
            this.triggerNewNotifications();
        }, 3000);
    }

    get notifications$(): Observable<Notification[]> {
        return this._notifications$.asObservable();
    }

    success(message: string): void {
        this.addNotification(message, 'success');
    }

    warning(message: string): void {
        this.addNotification(message, 'warning');
    }

    error(message: string): void {
        this.addNotification(message, 'danger');
    }
}