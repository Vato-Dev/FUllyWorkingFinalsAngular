import { Component, OnInit, computed, inject } from '@angular/core';
import { GROUP_LABELS, TEAM_GROUPS } from '../../../core/enums/team-group.enum';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-team-management',
  imports: [ProgressBarComponent],
  template: `
    @if (auth.currentUser(); as me) {
      <section>
        <div class="page-head">
          <h1>Team: {{ labels[me.group] }}</h1>
        </div>

        <label class="field field--inline">
          My group
          <select #g (change)="onGroupChange(g.value)">
            @for (item of groups; track item) {
              <option [value]="item" [selected]="item === me.group">{{ labels[item] }}</option>
            }
          </select>
        </label>

        <app-progress-bar
          label="Team progress"
          [detail]="tasks.teamProgress().done + ' of ' + tasks.teamProgress().total"
          [percent]="tasks.teamProgress().percent"
        />

        <h2>Members ({{ tasks.groupMembers().length }})</h2>
        <ul class="members">
          @for (m of tasks.groupMembers(); track m.id) {
            @let p = tasks.progressFor(m.id);
            <li class="members__item">
              <img class="avatar" [src]="m.image" alt="" />
              <span class="members__name">{{ m.firstName }} {{ m.lastName }}</span>
              <div class="members__progress">
                <app-progress-bar
                  label="Progress"
                  [detail]="p.done + ' of ' + p.total"
                  [percent]="p.percent"
                />
              </div>
            </li>
          }
        </ul>

        <h2>Invite to my group</h2>
        <ul class="members">
          @for (u of candidates(); track u.id) {
            <li class="members__item">
              <img class="avatar" [src]="u.image" alt="" />
              <span class="members__name">{{ u.firstName }} {{ u.lastName }}</span>
              <span class="muted">{{ labels[u.group] }}</span>
              <button type="button" class="btn btn--small btn--primary" (click)="invite(u)">
                Add
              </button>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class TeamManagementComponent implements OnInit {
  readonly tasks = inject(TaskService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly groups = TEAM_GROUPS;
  readonly labels = GROUP_LABELS;

  readonly candidates = computed(() => {
    const group = this.auth.currentUser()?.group;
    return this.tasks.users().filter((u) => u.group !== group);
  });

  ngOnInit(): void {
    this.tasks.load();
  }

  invite(user: User): void {
    const group = this.auth.currentUser()?.group;
    if (group) {
      this.tasks.moveUser(user.id, group);
      this.toast.show(`${user.firstName} added to the group`, 'success');
    }
  }

  onGroupChange(value: string): void {
    const group = this.groups.find((g) => g === value);
    const me = this.auth.currentUser();
    if (group && me) {
      this.tasks.moveUser(me.id, group);
    }
  }
}
