import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationsService } from './notifications.service';
import { AuthService } from '../../auth/services/auth.service';
import { Notification, NotificationsResponse } from '../models/notification';
import { User } from '../../auth/models/auth';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockNotification: Notification = {
    id: 'notif-1',
    recipientId: 'user-1',
    type: 'note_approved',
    message: 'Your note titled "Test note" was approved.',
    noteId: 'note-1',
    read: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    authService = TestBed.inject(AuthService);
    service = TestBed.inject(NotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('refresh', () => {
    it('should fetch notifications for the authenticated user on login', () => {
      // The effect() in the constructor triggers an automatic refresh when a
      // stored session makes isAuthenticated() true. We flush that request.
      const mockResponse: NotificationsResponse = {
        notifications: [mockNotification],
        unreadCount: 1,
        total: 1,
      };

      // Simulate logged-in user via localStorage BEFORE creating the service.
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      authService = TestBed.inject(AuthService);
      service = TestBed.inject(NotificationsService);
      httpMock = TestBed.inject(HttpTestingController);

      // The constructor's effect() fires refresh() once.
      const req = httpMock.expectOne('/api/notifications');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(service.notifications()).toEqual([mockNotification]);
      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should PUT to mark a notification as read and update the unread count', () => {
      // Start with notifications loaded
      service['notificationsSignal'].set([mockNotification]);
      service['unreadCountSignal'].set(1);

      service.markAsRead('notif-1');

      const req = httpMock.expectOne('/api/notifications/notif-1/read');
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockNotification, read: true });

      expect(service.notifications()[0].read).toBe(true);
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should PUT to mark all notifications as read', () => {
      // Start with notifications loaded
      service['notificationsSignal'].set([mockNotification, { ...mockNotification, id: 'notif-2' }]);
      service['unreadCountSignal'].set(2);

      service.markAllAsRead();

      const req = httpMock.expectOne('/api/notifications/read-all');
      expect(req.request.method).toBe('PUT');
      req.flush(null);

      expect(service.notifications().every((n) => n.read)).toBe(true);
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('togglePanel/closePanel', () => {
    it('should toggle the panel open state', () => {
      expect(service.panelOpen()).toBe(false);
      service.togglePanel();
      expect(service.panelOpen()).toBe(true);
      service.togglePanel();
      expect(service.panelOpen()).toBe(false);
    });

    it('should close the panel', () => {
      service.togglePanel();
      expect(service.panelOpen()).toBe(true);
      service.closePanel();
      expect(service.panelOpen()).toBe(false);
    });
  });
});