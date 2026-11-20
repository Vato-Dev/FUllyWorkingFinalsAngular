import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap, throwError } from 'rxjs';
import { STATUS_LABELS, TaskStatus } from '../enums/task-status.enum';
import { resolveGroup, saveGroup, TeamGroup } from '../enums/team-group.enum';
import {
  Progress,
  TaskFormValue,
  TaskItem,
  TaskLogEntry,
  TodoDto,
  TodosResponse,
} from '../../shared/interfaces/task.interface';
import { User, UsersResponse } from '../../shared/interfaces/user.interface';
import { API_URL, AuthService } from './auth.service';

const TASKS_KEY = 'app_tasks';
const API_LIMIT = 30;
const DUMMY_TODOS_MAX_ID = 254;
const ACTIVE_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.ON_REVIEW,
];

export function calcProgress(tasks: TaskItem[]): Progress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly tasks = signal<TaskItem[]>([]);
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  private loaded = false;

  readonly userMap = computed(() => new Map(this.users().map((u) => [u.id, u])));

  readonly myTasks = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.tasks().filter((t) => t.assigneeId === user.id) : [];
  });

  readonly teamTasks = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.tasks().filter((t) => t.group === user.group) : [];
  });

  readonly groupMembers = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.users().filter((u) => u.group === user.group) : [];
  });

  readonly myProgress = computed(() => calcProgress(this.myTasks()));
  readonly teamProgress = computed(() => calcProgress(this.teamTasks()));

  load(): void {
    if (this.loaded) {
      this.ensureCurrentUser();
      return;
    }
    this.loading.set(true);
    forkJoin({
      todos: this.http.get<TodosResponse>(`${API_URL}/todos?limit=${API_LIMIT}`),
      users: this.http.get<UsersResponse>(`${API_URL}/users?limit=${API_LIMIT}`),
    }).subscribe({
      next: ({ todos, users }) => {
        const apiUsers: User[] = users.users.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          username: u.username,
          image: u.image,
          group: resolveGroup(u.id),
        }));
        const merged = [...apiUsers, ...this.auth.getLocalUsers()];
        this.users.set(merged);
        this.ensureCurrentUser();

        const stored = this.readStoredTasks();
        this.tasks.set(stored ?? todos.todos.map((t) => this.mapTodo(t)));
        this.saveTasks();
        this.loaded = true;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getTask(id: number): TaskItem | undefined {
    return this.tasks().find((t) => t.id === id);
  }

  progressFor(userId: number): Progress {
    return calcProgress(this.tasks().filter((t) => t.assigneeId === userId));
  }

  createTask(value: TaskFormValue): Observable<TaskItem> {
    return this.http
      .post<TodoDto>(`${API_URL}/todos/add`, {
        todo: value.title,
        completed: value.status === TaskStatus.DONE,
        userId: value.assigneeId,
      })
      .pipe(
        map(() => {
          const task: TaskItem = {
            id: Date.now(),
            ...value,
            group: resolveGroup(value.assigneeId),
            log: [this.entry('Task is created')],
          };
          this.tasks.update((list) => [task, ...list]);
          this.saveTasks();
          return task;
        }),
      );
  }

  updateTask(id: number, changes: Partial<TaskFormValue>): Observable<TaskItem> {
    const current = this.getTask(id);
    if (!current) {
      return throwError(() => new Error('Task is not found'));
    }
    const updated: TaskItem = {
      ...current,
      ...changes,
      group: changes.assigneeId !== undefined ? resolveGroup(changes.assigneeId) : current.group,
      log: this.buildLog(current, changes),
    };
    const request$: Observable<unknown> = this.isRemote(id)
      ? this.http.put<TodoDto>(`${API_URL}/todos/${id}`, {
          todo: updated.title,
          completed: updated.status === TaskStatus.DONE,
        })
      : of(null);
    return request$.pipe(
      map(() => {
        this.tasks.update((list) => list.map((t) => (t.id === id ? updated : t)));
        this.saveTasks();
        return updated;
      }),
    );
  }

  changeStatus(id: number, status: TaskStatus): Observable<TaskItem> {
    return this.updateTask(id, { status });
  }

  deleteTask(id: number): Observable<unknown> {
    const request$: Observable<unknown> = this.isRemote(id)
      ? this.http.delete<TodoDto>(`${API_URL}/todos/${id}`)
      : of(null);
    return request$.pipe(
      tap(() => {
        this.tasks.update((list) => list.filter((t) => t.id !== id));
        this.saveTasks();
      }),
    );
  }

  moveUser(userId: number, group: TeamGroup): void {
    saveGroup(userId, group);
    this.users.update((list) => list.map((u) => (u.id === userId ? { ...u, group } : u)));
    this.tasks.update((list) => list.map((t) => (t.assigneeId === userId ? { ...t, group } : t)));
    this.saveTasks();
    if (this.auth.currentUser()?.id === userId) {
      this.auth.setGroup(group);
    }
  }

  private ensureCurrentUser(): void {
    const me = this.auth.currentUser();
    if (me && !this.users().some((u) => u.id === me.id)) {
      this.users.update((list) => [...list, me]);
    }
  }

  private isRemote(id: number): boolean {
    return id <= DUMMY_TODOS_MAX_ID;
  }

  private mapTodo(todo: TodoDto): TaskItem {
    const assigneeId = ((todo.userId - 1) % API_LIMIT) + 1;
    const status = todo.completed ? TaskStatus.DONE : ACTIVE_STATUSES[todo.id % 3];
    return {
      id: todo.id,
      title: todo.todo,
      description: '',
      status,
      assigneeId,
      group: resolveGroup(assigneeId),
      log: [this.entry('Task is loaded - API')],
    };
  }

  private buildLog(current: TaskItem, changes: Partial<TaskFormValue>): TaskLogEntry[] {
    const entries: TaskLogEntry[] = [];
    if (changes.status !== undefined && changes.status !== current.status) {
      entries.push(
        this.entry(`Statusi: ${STATUS_LABELS[current.status]} → ${STATUS_LABELS[changes.status]}`),
      );
    }
    if (changes.assigneeId !== undefined && changes.assigneeId !== current.assigneeId) {
      entries.push(this.entry('Assigned person changed'));
    }
    if (entries.length === 0) {
      entries.push(this.entry('Signing changed'));
    }
    return [...current.log, ...entries];
  }

  private entry(message: string): TaskLogEntry {
    return { date: new Date().toISOString(), message };
  }

  private readStoredTasks(): TaskItem[] | null {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as TaskItem[];
    } catch {
      return null;
    }
  }

  private saveTasks(): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(this.tasks()));
  }
}
