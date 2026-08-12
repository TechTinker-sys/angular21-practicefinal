import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './signup.html'
})
export class Signup {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly signupForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    role: new FormControl<UserRole>('viewer', [Validators.required])
  });

  protected submitSignup() {
    if (this.signupForm.invalid) {
      this.error.set('Please fill in all fields correctly.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.authService.signup({
      name: this.signupForm.value.name ?? '',
      email: this.signupForm.value.email ?? '',
      password: this.signupForm.value.password ?? '',
      role: this.signupForm.value.role ?? 'viewer'
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Unable to create account.');
        this.submitting.set(false);
      },
    });
  }
}