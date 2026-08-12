import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockResponse: AuthResponse = {
    user: mockUser,
    token: 'test-token-123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    expect(service.isViewer()).toBe(false);
  });

  describe('signup', () => {
    it('should POST signup and set session', () => {
      service.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer',
      }).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/signup');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer',
      });
      req.flush(mockResponse);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.token()).toBe('test-token-123');
      expect(service.user()).toEqual(mockUser);
      expect(service.isViewer()).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('test-token-123');
    });
  });

  describe('login', () => {
    it('should POST login and set session', () => {
      service.login({
        email: 'test@example.com',
        password: 'password123',
      }).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
      req.flush(mockResponse);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.token()).toBe('test-token-123');
      expect(service.user()).toEqual(mockUser);
    });

    it('should set isAdmin when user is admin', () => {
      const adminResponse: AuthResponse = {
        user: { ...mockUser, role: 'admin' },
        token: 'admin-token',
      };

      service.login({ email: 'admin@example.com', password: 'admin123' }).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(adminResponse);

      expect(service.isAdmin()).toBe(true);
      expect(service.isViewer()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should POST logout and clear session', () => {
      // Login first
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const loginReq = httpMock.expectOne('/api/auth/login');
      loginReq.flush(mockResponse);

      service.logout().subscribe();

      const logoutReq = httpMock.expectOne('/api/auth/logout');
      expect(logoutReq.request.method).toBe('POST');
      expect(logoutReq.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      logoutReq.flush(null);

      expect(service.isAuthenticated()).toBe(false);
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should clear session locally without HTTP call when no token', () => {
      service.logout().subscribe();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.token()).toBeNull();
      httpMock.expectNone('/api/auth/logout');
    });
  });

  describe('getCurrentUser', () => {
    it('should GET current user with auth header', () => {
      // Login first
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const loginReq = httpMock.expectOne('/api/auth/login');
      loginReq.flush(mockResponse);

      service.getCurrentUser().subscribe((response) => {
        expect(response.user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({ user: mockUser });
    });
  });

  describe('session persistence from localStorage', () => {
    it('should restore session from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      // Create new service instance to re-read from localStorage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.token()).toBe('stored-token');
      expect(newService.user()).toEqual(mockUser);
    });
  });
});