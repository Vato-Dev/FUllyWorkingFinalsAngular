import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TASK_STATUSES, TaskStatus } from '../../../core/enums/task-status.enum';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, RouterLink, StatusLabelPipe],
  template: `
    <div class="auth">
      <form class="auth__card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>{{ taskId === null ? 'New task' : 'Edit task' }}</h1>

        <label class="field">
          Title
          <input type="text" formControlName="title" />
          @if (form.controls.title.touched && form.controls.title.invalid) {
            <span class="field__error">
              @if (form.controls.title.hasError('required')) {
                Required field
              } @else {
                Minimum 4 characters
              }
            </span>
          }
        </label>

        <label class="field">
          Description
          <textarea rows="4" formControlName="description"></textarea>
          @if (form.controls.description.touched && form.controls.description.invalid) {
            <span class="field__error">Maximum 200 characters</span>
          }
        </label>

        <label class="field">
          Stage
          <select formControlName="status">
            @for (s of statuses; track s) {
              <option [ngValue]="s">{{ s | statusLabel }}</option>
            }
          </select>
        </label>

        <label class="field">
          Assignee
          <select formControlName="assigneeId">
            @for (m of tasks.groupMembers(); track m.id) {
              <option [ngValue]="m.id">{{ m.firstName }} {{ m.lastName }}</option>
            }
          </select>
          @if (form.controls.assigneeId.touched && form.controls.assigneeId.invalid) {
            <span class="field__error">Select an assignee</span>
          }
        </label>

        <button type="submit" class="btn btn--primary btn--block">Save</button>
        <a class="btn btn--block" routerLink="/board">Cancel</a>
      </form>
    </div>
  `,
})
export class TaskFormComponent implements OnInit {
  readonly tasks = inject(TaskService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly statuses = TASK_STATUSES;
  private readonly rawId = this.route.snapshot.paramMap.get('id');
  readonly taskId: number | null = this.rawId === null ? null : Number(this.rawId);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    description: ['', [Validators.maxLength(200)]],
    status: this.fb.control<TaskStatus>(TaskStatus.TODO),
    assigneeId: this.fb.control<number>(this.auth.currentUser()?.id ?? 0, Validators.required),
  });

  private readonly existing = computed(() =>
    this.taskId === null ? undefined : this.tasks.getTask(this.taskId),
  );
  private patched = false;

  constructor() {
    effect(() => {
      const task = this.existing();
      if (task && !this.patched) {
        this.patched = true;
        this.form.patchValue({
          title: task.title,
          description: task.description,
          status: task.status,
          assigneeId: task.assigneeId,
        });
      }
    });
  }

  ngOnInit(): void {
    this.tasks.load();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request$ =
      this.taskId === null
        ? this.tasks.createTask(value)
        : this.tasks.updateTask(this.taskId, value);
    request$.subscribe({
      next: () => {
        this.toast.show('Task saved', 'success');
        void this.router.navigate(['/board']);
      },
    });
  }
}
