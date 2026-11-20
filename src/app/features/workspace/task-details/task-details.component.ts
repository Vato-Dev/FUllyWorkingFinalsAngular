import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TASK_STATUSES } from '../../../core/enums/task-status.enum';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBorderDirective } from '../../../shared/directives/status-border.directive';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-task-details',
  imports: [RouterLink, DatePipe, StatusBorderDirective, StatusLabelPipe],
  template: `
    @if (task(); as t) {
      <section class="details task" [appStatusBorder]="t.status">
        <a routerLink="/board">← Back to board</a>
        <h1>{{ t.title }}</h1>
        <span class="badge" [attr.data-status]="t.status">{{ t.status | statusLabel }}</span>
        <p>{{ t.description || 'No description provided' }}</p>

        @let assignee = tasks.userMap().get(t.assigneeId);
        @if (assignee) {
          <div class="task__assignee">
            <img class="avatar" [src]="assignee.image" alt="" />
            <span>{{ assignee.firstName }} {{ assignee.lastName }}</span>
          </div>
        }

        <div class="task__actions">
          <select #st (change)="onStatus(st.value)">
            @for (s of statuses; track s) {
              <option [value]="s" [selected]="s === t.status">{{ s | statusLabel }}</option>
            }
          </select>
          <a class="btn btn--small" [routerLink]="['/tasks', t.id, 'edit']">Edit</a>
          <button type="button" class="btn btn--small btn--danger" (click)="onDelete()">
            Delete
          </button>
        </div>

        <h2>Progress log</h2>
        <ul class="log">
          @for (entry of t.log; track $index) {
            <li>
              <span class="muted">{{ entry.date | date: 'dd.MM.yyyy HH:mm' }}</span>
              {{ entry.message }}
            </li>
          }
        </ul>
      </section>
    } @else if (tasks.loading()) {
      <p class="muted">Loading...</p>
    } @else {
      <p>Task not found. <a routerLink="/board">Back to board</a></p>
    }
  `,
})
export class TaskDetailsComponent implements OnInit {
  readonly tasks = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly statuses = TASK_STATUSES;
  private readonly taskId = Number(this.route.snapshot.paramMap.get('id'));
  readonly task = computed(() => this.tasks.getTask(this.taskId));

  ngOnInit(): void {
    this.tasks.load();
  }

  onStatus(value: string): void {
    const status = this.statuses.find((s) => s === value);
    if (!status) {
      return;
    }
    this.tasks.changeStatus(this.taskId, status).subscribe({
      next: () => this.toast.show('Status updated', 'success'),
    });
  }

  onDelete(): void {
    if (!confirm('Delete task?')) {
      return;
    }
    this.tasks.deleteTask(this.taskId).subscribe({
      next: () => {
        this.toast.show('Task deleted', 'success');
        void this.router.navigate(['/board']);
      },
    });
  }
}
