import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Signup } from './signup';
import { AuthResponse, User } from '../../models/auth';

describe('Signup', () => {
  let fixture: ComponentFixture<Signup>;
  let component: Signup;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: 'user-1',
    name: 'New User',
    email: 'new@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockResponse: AuthResponse = {
    user: mockUser,
    token: 'test-token',
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default viewer role', () => {
    expect(component['signupForm'].value).toEqual({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
    });
  });

  it('should set error when form is invalid', () => {
    component['signupForm'].setValue({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
    });
    (component as any).submitSignup();

    expect(component['error']()).toBe('Please fill in all fields correctly.');
    expect(component['submitting']()).toBe(false);
  });

  it('should signup and navigate to /home on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['signupForm'].setValue({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'viewer',
    });
    (component as any).submitSignup();

    const req = httpMock.expectOne('/api/auth/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'viewer',
    });
    req.flush(mockResponse);

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    expect(component['submitting']()).toBe(false);
  });

  it('should set error when signup fails', () => {
    component['signupForm'].setValue({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'viewer',
    });
    (component as any).submitSignup();

    const req = httpMock.expectOne('/api/auth/signup');
    req.flush({ error: 'An account with this email already exists' }, { status: 409, statusText: 'Conflict' });

    expect(component['error']()).toBe('An account with this email already exists');
    expect(component['submitting']()).toBe(false);
  });

  it('should allow selecting admin role', () => {
    component['signupForm'].setValue({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    expect(component['signupForm'].value.role).toBe('admin');
  });
});