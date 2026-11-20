import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-stack">
      @for (m of toast.messages(); track m.id) {
        <div
          class="toast"
          [class.toast--error]="m.type === 'error'"
          [class.toast--success]="m.type === 'success'"
        >
          <span>{{ m.text }}</span>
          <button type="button" class="toast__close" (click)="toast.dismiss(m.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
