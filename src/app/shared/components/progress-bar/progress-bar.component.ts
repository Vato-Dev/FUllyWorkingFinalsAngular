import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="progress">
      <div class="progress__head">
        <span>{{ label() }}</span>
        <span>{{ detail() }} ({{ percent() }}%)</span>
      </div>
      <div class="progress__track">
        <div class="progress__fill" [style.width.%]="percent()"></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly label = input('');
  readonly detail = input('');
  readonly percent = input.required<number>();
}
