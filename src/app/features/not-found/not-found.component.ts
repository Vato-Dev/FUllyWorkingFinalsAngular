import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="auth">
      <div class="auth__card">
        <h1>404</h1>
        <p>Page is not found</p>
        <a class="btn btn--primary" routerLink="/board">На главную</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
