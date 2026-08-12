import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type LoginMode = 'all' | 'admin' | 'viewer';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mode: LoginMode = (this.route.snapshot.data['role'] as LoginMode) ?? 'all';

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  private readonly allDemoAccounts = [
    {
      role: 'admin' as const,
      label: 'Admin',
      description: 'Can create, edit, and delete notes',
      email: 'admin@example.com',
      password: 'admin123',
    },
    {
      role: 'viewer' as const,
      label: 'Viewer',
      description: 'Can only view notes',
      email: 'viewer@example.com',
      password: 'viewer123',
    },
  ];

  protected readonly demoAccounts = computed(() =>
    this.mode === 'all' ? this.allDemoAccounts : this.allDemoAccounts.filter((a) => a.role === this.mode),
  );

  protected readonly heading = computed(() => {
    if (this.mode === 'admin') return 'Admin login';
    if (this.mode === 'viewer') return 'Viewer login';
    return 'Welcome back';
  });

  protected readonly subtitle = computed(() => {
    if (this.mode === 'admin') return 'Log in with an administrator account to manage notes.';
    if (this.mode === 'viewer') return 'Log in with a viewer account to browse notes.';
    return 'Log in to your account to continue.';
  });

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  constructor() {
    const demo = this.demoAccounts()[0];
    if (demo && this.mode !== 'all') {
      this.fillDemoAccount(demo);
    }
  }

  protected fillDemoAccount(account: { email: string; password: string }) {
    this.loginForm.patchValue({
      email: account.email,
      password: account.password,
    });
  }

  protected submitLogin() {
    if (this.loginForm.invalid) {
      this.error.set('Please fill in all fields correctly.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.authService.login({
      email: this.loginForm.value.email ?? '',
      password: this.loginForm.value.password ?? ''
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Unable to log in.');
        this.submitting.set(false);
      },
    });
  }
}