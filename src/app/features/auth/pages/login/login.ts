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