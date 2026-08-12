import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard, guestGuard, adminGuard } from './auth.guard';
import { User } from '../models/auth';

describe('Auth Guards', () => {
  let router: Router;

  const mockAdmin: User = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockViewer: User = {
    id: 'user-2',
    name: 'Viewer',
    email: 'viewer@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function setup(user: User | null = null) {
    TestBed.resetTestingModule();
    localStorage.clear();

    if (user) {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('auth_user', JSON.stringify(user));
    }

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    router = TestBed.inject(Router);
  }

  afterEach(() => {
    localStorage.clear();
  });

  describe('authGuard', () => {
    it('should allow access when authenticated', () => {
      setup(mockViewer);
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /login when not authenticated', () => {
      setup(null);
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/login']));
    });
  });

  describe('guestGuard', () => {
    it('should allow access when not authenticated', () => {
      setup(null);
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /home when authenticated', () => {
      setup(mockViewer);
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/home']));
    });
  });

  describe('adminGuard', () => {
    it('should allow access for admin users', () => {
      setup(mockAdmin);
      const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect viewer to /notes', () => {
      setup(mockViewer);
      const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/notes']));
    });

    it('should redirect unauthenticated to /login', () => {
      setup(null);
      const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/login']));
    });
  });
});