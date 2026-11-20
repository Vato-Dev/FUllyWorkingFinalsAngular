import { TaskStatus } from '../../core/enums/task-status.enum';
import { TeamGroup } from '../../core/enums/team-group.enum';

export interface TaskLogEntry {
  date: string;
  message: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number;
  group: TeamGroup;
  log: TaskLogEntry[];
}

export interface TaskFormValue {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number;
}

export interface TodoDto {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export interface TodosResponse {
  todos: TodoDto[];
  total: number;
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}
