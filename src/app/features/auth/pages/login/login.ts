import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  protected readonly demoAccounts = [
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
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.error?.error || 'Unable to log in.');
        this.submitting.set(false);
      },
    });
  }
}