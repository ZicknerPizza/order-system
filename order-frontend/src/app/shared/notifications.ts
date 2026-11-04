import { Component, inject, Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  /** Bootstrap alert level */
  level: 'success' | 'warning' | 'danger';
}

const DISPLAY_TIME = 3000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);

  success(message: string): void {
    this.add({ message, level: 'success' });
  }

  warning(message: string): void {
    this.add({ message, level: 'warning' });
  }

  error(message: string): void {
    this.add({ message, level: 'danger' });
  }

  private add(notification: Notification): void {
    this.notifications.update((notifications) => [...notifications, notification]);
    setTimeout(() => {
      this.notifications.update((notifications) => notifications.filter((n) => n !== notification));
    }, DISPLAY_TIME);
  }
}

@Component({
  selector: 'app-notifications',
  template: `
    @for (notification of notifications(); track notification) {
      <div class="alert alert-{{ notification.level }}">{{ notification.message }}</div>
    }
  `,
})
export class Notifications {
  protected readonly notifications = inject(NotificationService).notifications;
}
