import { Directive, input } from '@angular/core';
import { TaskStatus } from '../../core/enums/task-status.enum';

@Directive({
  selector: '[appStatusBorder]',
  host: { '[attr.data-status]': 'appStatusBorder()' },
})
export class StatusBorderDirective {
  readonly appStatusBorder = input.required<TaskStatus>();
}
