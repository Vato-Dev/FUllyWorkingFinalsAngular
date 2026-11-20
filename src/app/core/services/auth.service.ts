import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, of, throwError } from 'rxjs';
import { TeamGroup, resolveGroup, saveGroup } from '../enums/team-group.enum';
import {
  AuthRequest,
  AuthResponse,
  RegisterRequest,
  User,
} from '../../shared/interfaces/user.interface';

export const API_URL = 'https://dummyjson.com';

const SESSION_KEY = 'app_session';
const USERS_KEY = 'app_local_users';
const LOCAL_TOKEN = 'local-token';

interface Session {
  token: string;
  user: User;
}

type LocalUser = Omit<User, 'group'> & { password: string };

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readJson<Session>(SESSION_KEY));

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  login(request: AuthRequest): Observable<User> {
    const local = this.readLocalUsers().find(
      (u) => u.username === request.username && u.password === request.password,
    );
    if (local) {
      const user = this.toUser(local);
      this.setSession(LOCAL_TOKEN, user);
      return of(user);
    }
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, {
        username: request.username,
        password: request.password,
        expiresInMins: 60,
      })
      .pipe(
        map((res) => {
          const user: User = {
            id: res.id,
            firstName: res.firstName,
            lastName: res.lastName,
            email: res.email,
            username: res.username,
            image: res.image,
            group: resolveGroup(res.id),
          };
          this.setSession(res.accessToken, user);
          return user;
        }),
      );
  }

  register(request: RegisterRequest): Observable<User> {
    if (this.readLocalUsers().some((u) => u.username === request.username)) {
      return throwError(() => new Error('User already exists'));
    }
    return this.http
      .post<unknown>(`${API_URL}/users/add`, {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        username: request.username,
        password: request.password,
      })
      .pipe(
        map(() => {
          const id = Date.now();
          const local: LocalUser = {
            id,
            firstName: request.firstName,
            lastName: request.lastName,
            email: request.email,
            username: request.username,
            image: `${API_URL}/icon/${request.username}/128`,
            password: request.password,
          };
          localStorage.setItem(USERS_KEY, JSON.stringify([...this.readLocalUsers(), local]));
          saveGroup(id, request.group);
          const user = this.toUser(local);
          this.setSession(LOCAL_TOKEN, user);
          return user;
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    void this.router.navigate(['/login']);
  }

  setGroup(group: TeamGroup): void {
    const current = this.session();
    if (!current) {
      return;
    }
    const next: Session = { ...current, user: { ...current.user, group } };
    this.session.set(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }

  getLocalUsers(): User[] {
    return this.readLocalUsers().map((u) => this.toUser(u));
  }

  private setSession(token: string, user: User): void {
    const session: Session = { token, user };
    this.session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private readLocalUsers(): LocalUser[] {
    return readJson<LocalUser[]>(USERS_KEY) ?? [];
  }

  private toUser(local: LocalUser): User {
    return {
      id: local.id,
      firstName: local.firstName,
      lastName: local.lastName,
      email: local.email,
      username: local.username,
      image: local.image,
      group: resolveGroup(local.id),
    };
  }
}
