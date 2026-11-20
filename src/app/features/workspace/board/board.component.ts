import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TASK_STATUSES, TaskStatus } from '../../../core/enums/task-status.enum';
import { ToastService } from '../../../core/services/toast.service';
import { TaskService } from '../../../core/services/task.service';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { StatusBorderDirective } from '../../../shared/directives/status-border.directive';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { TaskItem } from '../../../shared/interfaces/task.interface';

type BoardTab = 'my' | 'team';
type BoardView = 'kanban' | 'list';

interface Column {
  status: TaskStatus | null;
  items: TaskItem[];
}

@Component({
  selector: 'app-board',
  imports: [RouterLink, ProgressBarComponent, StatusBorderDirective, StatusLabelPipe],
  template: `
    <section>
      <div class="page-head">
        <h1>Task Dashboard</h1>
        <a class="btn btn--primary" routerLink="/tasks/new">+ New task</a>
      </div>

      <div class="toolbar">
        <div class="tabs">
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="tab() === 'my'"
            (click)="setTab('my')"
          >
            My tasks
          </button>
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="tab() === 'team'"
            (click)="setTab('team')"
          >
            Team tasks
          </button>
        </div>
        <div class="tabs">
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="view() === 'kanban'"
            (click)="view.set('kanban')"
          >
            kanban
          </button>
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="view() === 'list'"
            (click)="view.set('list')"
          >
            list
          </button>
        </div>
      </div>

      <app-progress-bar
        [label]="tab() === 'my' ? 'my progress' : 'team progress'"
        [detail]="progress().done + ' from ' + progress().total"
        [percent]="progress().percent"
      />

      @if (tab() === 'team') {
        <label class="field field--inline">
          Assigned
          <select #member (change)="onMember(member.value)">
            <option value="">all participants</option>
            @for (m of tasks.groupMembers(); track m.id) {
              <option [value]="m.id">{{ m.firstName }} {{ m.lastName }}</option>
            }
          </select>
        </label>
      }

      @if (tasks.loading()) {
        <p class="muted">Loading...</p>
      } @else if (visibleTasks().length === 0) {
        <p class="muted">No tasks yet</p>
      } @else {
        <div class="board" [class.board--list]="view() === 'list'">
          @for (col of columns(); track col.status) {
            <div class="board__col">
              @if (col.status !== null) {
                <h3>
                  {{ col.status | statusLabel }}
                  <span class="count">{{ col.items.length }}</span>
                </h3>
              }
              @for (task of col.items; track task.id) {
                <article class="task" [appStatusBorder]="task.status">
                  <a class="task__title" [routerLink]="['/tasks', task.id]">{{ task.title }}</a>
                  <span class="badge" [attr.data-status]="task.status">
                    {{ task.status | statusLabel }}
                  </span>
                  @let assignee = tasks.userMap().get(task.assigneeId);
                  @if (assignee) {
                    <div class="task__assignee">
                      <img class="avatar" [src]="assignee.image" alt="" />
                      <span>{{ assignee.firstName }} {{ assignee.lastName }}</span>
                    </div>
                  }
                  <div class="task__actions">
                    <select #st (change)="onStatus(task.id, st.value)">
                      @for (s of statuses; track s) {
                        <option [value]="s" [selected]="s === task.status">
                          {{ s | statusLabel }}
                        </option>
                      }
                    </select>
                    <a class="btn btn--small" [routerLink]="['/tasks', task.id, 'edit']">
                      Change
                    </a>
                    <button
                      type="button"
                      class="btn btn--small btn--danger"
                      (click)="onDelete(task.id)"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BoardComponent implements OnInit {
  readonly tasks = inject(TaskService);
  private readonly toast = inject(ToastService);

  readonly statuses = TASK_STATUSES;
  readonly tab = signal<BoardTab>('my');
  readonly view = signal<BoardView>('kanban');
  readonly memberFilter = signal<number | null>(null);

  readonly progress = computed(() =>
    this.tab() === 'my' ? this.tasks.myProgress() : this.tasks.teamProgress(),
  );

  readonly visibleTasks = computed(() => {
    if (this.tab() === 'my') {
      return this.tasks.myTasks();
    }
    const memberId = this.memberFilter();
    const list = this.tasks.teamTasks();
    return memberId === null ? list : list.filter((t) => t.assigneeId === memberId);
  });

  readonly columns = computed<Column[]>(() =>
    this.view() === 'kanban'
      ? TASK_STATUSES.map((status) => ({
          status,
          items: this.visibleTasks().filter((t) => t.status === status),
        }))
      : [{ status: null, items: this.visibleTasks() }],
  );

  ngOnInit(): void {
    this.tasks.load();
  }

  setTab(tab: BoardTab): void {
    this.tab.set(tab);
    this.memberFilter.set(null);
  }

  onMember(value: string): void {
    this.memberFilter.set(value === '' ? null : Number(value));
  }

  onStatus(id: number, value: string): void {
    const status = this.statuses.find((s) => s === value);
    if (!status) {
      return;
    }
    this.tasks.changeStatus(id, status).subscribe({
      next: () => this.toast.show('status changed', 'success'),
    });
  }

  onDelete(id: number): void {
    if (!confirm('Delete task?')) {
      return;
    }
    this.tasks.deleteTask(id).subscribe({
      next: () => this.toast.show('Task deleted', 'success'),
    });
  }
}
