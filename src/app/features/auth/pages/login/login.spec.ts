import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Login } from './login';
import { AuthResponse, User } from '../../models/auth';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockResponse: AuthResponse = {
    user: mockUser,
    token: 'test-token',
  };

  function setup(mode: string | null = null) {
    TestBed.resetTestingModule();
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: mode ? { role: mode } : {},
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock?.verify();
    localStorage.clear();
  });

  describe('mode = all', () => {
    beforeEach(() => setup('all'));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should show both demo accounts in all mode', () => {
      expect(component['demoAccounts']().length).toBe(2);
      expect(component['heading']()).toBe('Welcome back');
    });

    it('should set error when form is invalid', () => {
      component['loginForm'].setValue({ email: '', password: '' });
      (component as any).submitLogin();

      expect(component['error']()).toBe('Please fill in all fields correctly.');
      expect(component['submitting']()).toBe(false);
    });

    it('should login and navigate to /home on success', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component['loginForm'].setValue({
        email: 'admin@example.com',
        password: 'admin123',
      });
      (component as any).submitLogin();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'admin@example.com',
        password: 'admin123',
      });
      req.flush(mockResponse);

      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
      expect(component['submitting']()).toBe(false);
    });

    it('should set error when login fails', () => {
      component['loginForm'].setValue({
        email: 'admin@example.com',
        password: 'admin123',
      });
      (component as any).submitLogin();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ error: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });

      expect(component['error']()).toBe('Invalid email or password');
      expect(component['submitting']()).toBe(false);
    });
  });

  describe('mode = admin', () => {
    beforeEach(() => setup('admin'));

    it('should show only admin demo account', () => {
      expect(component['demoAccounts']().length).toBe(1);
      expect(component['demoAccounts']()[0].role).toBe('admin');
      expect(component['heading']()).toBe('Admin login');
    });

    it('should auto-fill the demo account', () => {
      expect(component['loginForm'].value).toEqual({
        email: 'admin@example.com',
        password: 'admin123',
      });
    });

    it('should fill demo account on button click', () => {
      component['fillDemoAccount']({ email: 'viewer@example.com', password: 'viewer123' });

      expect(component['loginForm'].value).toEqual({
        email: 'viewer@example.com',
        password: 'viewer123',
      });
    });
  });

  describe('mode = viewer', () => {
    beforeEach(() => setup('viewer'));

    it('should show only viewer demo account', () => {
      expect(component['demoAccounts']().length).toBe(1);
      expect(component['demoAccounts']()[0].role).toBe('viewer');
      expect(component['heading']()).toBe('Viewer login');
    });

    it('should auto-fill the demo account', () => {
      expect(component['loginForm'].value).toEqual({
        email: 'viewer@example.com',
        password: 'viewer123',
      });
    });
  });

  describe('mode = default', () => {
    beforeEach(() => setup());

    it('should default to all mode when no role data', () => {
      expect(component['demoAccounts']().length).toBe(2);
    });
  });
});