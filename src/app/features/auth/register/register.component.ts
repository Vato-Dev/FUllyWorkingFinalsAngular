import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GROUP_LABELS, TEAM_GROUPS, TeamGroup } from '../../../core/enums/team-group.enum';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth">
      <form class="auth__card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Registration</h1>

        <label class="field">
          First name
          <input type="text" formControlName="firstName" />
          @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
            <span class="field__error">required field 2 symbols min</span>
          }
        </label>

        <label class="field">
          Last name
          <input type="text" formControlName="lastName" />
          @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
            <span class="field__error">Required field, minimum 2 characters</span>
          }
        </label>

        <label class="field">
          Email
          <input type="email" formControlName="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field__error">
              @if (form.controls.email.hasError('required')) {
                Required field
              } @else {
                Invalid email
              }
            </span>
          }
        </label>

        <label class="field">
          Log in
          <input type="text" formControlName="username" />
          @if (form.controls.username.touched && form.controls.username.invalid) {
            <span class="field__error">Required field, min 3 symbols</span>
          }
        </label>

        <label class="field">
          password
          <input type="password" formControlName="password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field__error">Required field, min 3 symbols</span>
          }
        </label>

        <label class="field">
          Team
          <select formControlName="group">
            @for (g of groups; track g) {
              <option [ngValue]="g">{{ labels[g] }}</option>
            }
          </select>
        </label>

        <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
          Register
        </button>
        <p class="muted">Have an account?? <a routerLink="/login">Log in</a></p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly groups = TEAM_GROUPS;
  readonly labels = GROUP_LABELS;
  readonly loading = signal(false);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    group: this.fb.control<TeamGroup>(TeamGroup.FRONTEND, Validators.required),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/board']);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        if (e instanceof Error) {
          this.toast.show(e.message, 'error');
        }
      },
    });
  }
}
