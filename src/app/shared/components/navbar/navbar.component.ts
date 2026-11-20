import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GROUP_LABELS, TEAM_GROUPS } from '../../../core/enums/team-group.enum';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <a class="navbar__logo" routerLink="/board">TaskBoard</a>
      <button type="button" class="navbar__burger" aria-label="Menu" (click)="toggleMenu()">
        ☰
      </button>
      <nav class="navbar__menu" [class.navbar__menu--open]="menuOpen()">
        <a routerLink="/board" routerLinkActive="active" (click)="closeMenu()">Dashboard</a>
        <a routerLink="/team" routerLinkActive="active" (click)="closeMenu()">Team</a>
        @if (auth.currentUser(); as user) {
          <select #groupSelect class="navbar__group" (change)="onGroupChange(groupSelect.value)">
            @for (g of groups; track g) {
              <option [value]="g" [selected]="g === user.group">{{ labels[g] }}</option>
            }
          </select>
          <span class="navbar__user">
            <img class="avatar" [src]="user.image" alt="" />
            {{ user.firstName }}
          </span>
          <button type="button" class="btn btn--ghost" (click)="auth.logout()">Logout</button>
        }
      </nav>
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly tasks = inject(TaskService);

  readonly groups = TEAM_GROUPS;
  readonly labels = GROUP_LABELS;
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onGroupChange(value: string): void {
    const group = this.groups.find((g) => g === value);
    const user = this.auth.currentUser();
    if (group && user) {
      this.tasks.moveUser(user.id, group);
    }
  }
}
