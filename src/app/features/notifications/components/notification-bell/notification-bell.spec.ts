import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationBell } from './notification-bell';
import { NotificationsService } from '../../services/notifications.service';
import { Notification } from '../../models/notification';

describe('NotificationBell', () => {
  let component: NotificationBell;
  let fixture: ComponentFixture<NotificationBell>;
  let service: NotificationsService;
  let httpMock: HttpTestingController;

  const mockNotification: Notification = {
    id: 'notif-1',
    recipientId: 'admin-1',
    type: 'note_created',
    message: 'Viewer User submitted a new note titled "New note" for approval.',
    noteId: 'note-1',
    read: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    service = TestBed.inject(NotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NotificationBell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the bell button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[aria-label="Notifications"]');
    expect(button).toBeTruthy();
  });

  it('should not show unread badge when there are no unread notifications', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bg-rose-600')).toBeFalsy();
  });

  it('should show unread badge when there are unread notifications', () => {
    service['unreadCountSignal'].set(2);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.bg-rose-600');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('should open the panel when the bell is clicked', () => {
    service['notificationsSignal'].set([mockNotification]);
    service['unreadCountSignal'].set(1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(service.panelOpen()).toBe(true);
    expect(compiled.textContent).toContain('Viewer User submitted a new note');
  });

  it('should show empty state when there are no notifications', () => {
    service.togglePanel();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No notifications yet.');
  });
});