import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginInput, SignupInput, User } from '../models/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly apiUrl = '/api/auth';

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<User | null>(this.getStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  signup(input: SignupInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, input).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  login(input: LoginInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, input).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  logout(): Observable<void> {
    const token = this.tokenSignal();
    if (!token) {
      this.clearSession();
      return new Observable<void>((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      tap(() => this.clearSession()),
    );
  }

  getCurrentUser(): Observable<{ user: User }> {
    const token = this.tokenSignal();
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  private setSession(response: AuthResponse): void {
    this.tokenSignal.set(response.token);
    this.userSignal.set(response.user);
    if (this.isBrowser) {
      try {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      } catch {
        /* localStorage unavailable — safe to ignore */
      }
    }
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    if (this.isBrowser) {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {
        /* localStorage unavailable — safe to ignore */
      }
    }
  }

  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}