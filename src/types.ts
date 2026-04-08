export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null; // ISO string
  createdAt: string; // ISO string
  nextScheduleDate: string; // ISO string
  progress: number; // 0 - 100
  status: TaskStatus;
  lastCompletedAt: string | null; // ISO string
  constraintFlag?: boolean;
  constraintReason?: string;
}
