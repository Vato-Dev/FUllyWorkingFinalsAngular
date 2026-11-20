import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <app-navbar />
    }
    <main class="container">
      <router-outlet />
    </main>
    <app-toast />
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
