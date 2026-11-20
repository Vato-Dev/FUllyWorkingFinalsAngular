import { Pipe, PipeTransform } from '@angular/core';
import { STATUS_LABELS, TaskStatus } from '../../core/enums/task-status.enum';

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: TaskStatus): string {
    return STATUS_LABELS[value];
  }
}
