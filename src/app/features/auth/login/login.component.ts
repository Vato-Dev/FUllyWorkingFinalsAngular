import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth">
      <form class="auth__card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Log in</h1>

        <label class="field">
          Login
          <input type="text" formControlName="username" />
          @if (form.controls.username.touched && form.controls.username.invalid) {
            <span class="field__error">
              @if (form.controls.username.hasError('required')) {
                Required field
              } @else {
                min 3 symbols
              }
            </span>
          }
        </label>

        <label class="field">
          Password
          <input type="password" formControlName="password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field__error">
              @if (form.controls.password.hasError('required')) {
                Required field
              } @else {
                min 6 symbols
              }
            </span>
          }
        </label>

        <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
          Log in
        </button>
        <button type="button" class="btn btn--block" [disabled]="loading()" (click)="demo()">
          Fast demo enter
        </button>
        <p class="muted">Not Registered? <a routerLink="/register">Register</a></p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/board']);
      },
      error: () => this.loading.set(false),
    });
  }

  demo(): void {
    this.form.setValue({ username: 'emilys', password: 'emilyspass' });
    this.submit();
  }
}
