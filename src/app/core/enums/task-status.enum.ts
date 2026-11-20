export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_REVIEW = 'ON_REVIEW',
  DONE = 'DONE',
}

export const TASK_STATUSES: TaskStatus[] = Object.values(TaskStatus);

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'Todo',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.ON_REVIEW]: 'On Review',
  [TaskStatus.DONE]: 'Done',
};
