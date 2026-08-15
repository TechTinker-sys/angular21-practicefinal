import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Notification } from '../../models/notification';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
})
export class NotificationBell {
  protected readonly notificationsService = inject(NotificationsService);
  protected readonly notifications = this.notificationsService.notifications;
  protected readonly unreadCount = this.notificationsService.unreadCount;
  protected readonly loading = this.notificationsService.loading;
  protected readonly panelOpen = this.notificationsService.panelOpen;

  protected togglePanel(): void {
    this.notificationsService.togglePanel();
  }

  protected closePanel(): void {
    this.notificationsService.closePanel();
  }

  protected markAsRead(id: string): void {
    this.notificationsService.markAsRead(id);
  }

  protected markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  protected rowClass(notification: Notification): string {
    if (notification.read) {
      return 'bg-white dark:bg-slate-900';
    }
    return 'bg-sky-50/60 dark:bg-sky-950/30';
  }

  protected dotClass(notification: Notification): string {
    if (notification.read) {
      return 'bg-transparent';
    }
    return 'bg-sky-500';
  }
}
