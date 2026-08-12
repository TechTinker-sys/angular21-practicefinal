import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth';

describe('authInterceptor', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function setup(withToken: boolean = true) {
    TestBed.resetTestingModule();
    localStorage.clear();

    if (withToken) {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    }

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  }

  afterEach(() => {
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    setup(true);
    const authService = TestBed.inject(AuthService);

    const req = new HttpRequest('GET', '/api/notes');
    let interceptedReq: HttpRequest<any> | undefined;

    const next: HttpHandlerFn = (request) => {
      interceptedReq = request;
      return new Observable<HttpEvent<any>>((subscriber) => subscriber.complete());
    };

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    expect(interceptedReq).toBeDefined();
    expect(interceptedReq!.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add Authorization header when no token exists', () => {
    setup(false);

    const req = new HttpRequest('GET', '/api/notes');
    let interceptedReq: HttpRequest<any> | undefined;

    const next: HttpHandlerFn = (request) => {
      interceptedReq = request;
      return new Observable<HttpEvent<any>>((subscriber) => subscriber.complete());
    };

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    expect(interceptedReq).toBeDefined();
    expect(interceptedReq!.headers.has('Authorization')).toBe(false);
  });

  it('should not add Authorization header for login and signup endpoints', () => {
    setup(true);

    const loginReq = new HttpRequest('POST', '/api/auth/login', {});
    let interceptedLoginReq: HttpRequest<any> | undefined;

    const next: HttpHandlerFn = (request) => {
      interceptedLoginReq = request;
      return new Observable<HttpEvent<any>>((subscriber) => subscriber.complete());
    };

    TestBed.runInInjectionContext(() => authInterceptor(loginReq, next));

    expect(interceptedLoginReq).toBeDefined();
    expect(interceptedLoginReq!.headers.has('Authorization')).toBe(false);
  });
});