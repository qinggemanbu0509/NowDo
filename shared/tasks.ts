export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof taskPriorities)[number];

export interface TaskSchedule {
  dueDate: string;
  startTime?: string;
}

export interface TaskMetadataChanges {
  startTime?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  done: boolean;
  dueDate?: unknown;
  startTime?: unknown;
  priority?: unknown;
}
