import { Injectable, inject, PLATFORM_ID, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, interval, switchMap, EMPTY, Subscription } from 'rxjs';
import { Notification, NotificationsResponse } from '../models/notification';
import { AuthService } from '../../auth/services/auth.service';

const POLL_INTERVAL_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly apiUrl = '/api/notifications';

  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly unreadCountSignal = signal(0);
  private readonly loadingSignal = signal(false);
  private readonly openSignal = signal(false);

  private pollSubscription: Subscription | undefined;

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly panelOpen = this.openSignal.asReadonly();

  constructor() {
    // Refresh immediately when the user logs in.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.refresh();
      }
    });

    // Keep polling while the user is authenticated.
    this.startPolling();
  }

  startPolling(): void {
    if (!this.isBrowser || this.pollSubscription) {
      return;
    }

    this.refresh();
    this.pollSubscription = interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => (this.authService.isAuthenticated() ? this.fetchNotifications() : EMPTY)),
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  refresh(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    this.loadingSignal.set(true);
    this.fetchNotifications().subscribe({
      next: (result) => this.applyResult(result),
      error: () => this.loadingSignal.set(false),
    });
  }

  markAsRead(id: string): void {
    this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: () => {
        this.notificationsSignal.update((items) =>
          items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        this.recomputeUnread();
      },
    });
  }

  markAllAsRead(): void {
    this.http.put<void>(`${this.apiUrl}/read-all`, {}).subscribe({
      next: () => {
        this.notificationsSignal.update((items) => items.map((n) => ({ ...n, read: true })));
        this.unreadCountSignal.set(0);
      },
    });
  }

  togglePanel(): void {
    this.openSignal.update((open) => !open);
  }

  closePanel(): void {
    this.openSignal.set(false);
  }

  private fetchNotifications(): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(this.apiUrl);
  }

  private applyResult(result: NotificationsResponse): void {
    this.notificationsSignal.set(result.notifications);
    this.unreadCountSignal.set(result.unreadCount);
    this.loadingSignal.set(false);
  }

  private recomputeUnread(): void {
    this.unreadCountSignal.set(this.notificationsSignal().filter((n) => !n.read).length);
  }
}