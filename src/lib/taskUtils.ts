import { addDays, isBefore, startOfDay, isAfter, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { Task, Priority } from '../types';

export function evaluateConstraint(priority: Priority, deadline: string | null): { isConstrained: boolean, reason?: string } {
  if (!deadline) return { isConstrained: false };
  const today = startOfDay(new Date());
  const deadlineDate = startOfDay(parseISO(deadline));
  const remainingDays = differenceInDays(deadlineDate, today);

  if (priority === 'medium' && remainingDays < 2) {
    return { isConstrained: true, reason: 'This task must be done today as it cannot be further scheduled.' };
  }
  if (priority === 'low' && remainingDays < 3) {
    return { isConstrained: true, reason: 'This task must be done today as it cannot be further scheduled.' };
  }
  return { isConstrained: false };
}

export function calculateNextScheduleDate(
  priority: Priority,
  deadline: string | null,
  lastCompletedAt: string | null,
  createdAt: string
): string {
  const today = startOfDay(new Date());
  let nextDate = today;

  const { isConstrained } = evaluateConstraint(priority, deadline);

  if (priority === 'high' || isConstrained) {
    nextDate = today;
  } else if (priority === 'medium') {
    if (lastCompletedAt) {
      nextDate = addDays(startOfDay(parseISO(lastCompletedAt)), 2);
    } else {
      nextDate = addDays(startOfDay(parseISO(createdAt)), 2);
    }
  } else if (priority === 'low') {
    if (lastCompletedAt) {
      nextDate = addDays(startOfDay(parseISO(lastCompletedAt)), 3);
    } else {
      nextDate = addDays(startOfDay(parseISO(createdAt)), 3);
    }
  }

  // If nextDate is in the past, it's overdue, so schedule for today
  if (isBefore(nextDate, today)) {
    nextDate = today;
  }

  // Deadline logic: must be scheduled BEFORE or ON deadline
  if (deadline) {
    const deadlineDate = startOfDay(parseISO(deadline));
    if (isAfter(nextDate, deadlineDate)) {
      nextDate = deadlineDate;
    }
  }

  return nextDate.toISOString();
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  const today = startOfDay(new Date());
  const scheduleDate = startOfDay(parseISO(task.nextScheduleDate));
  return isBefore(scheduleDate, today);
}

export function isTaskDueToday(task: Task): boolean {
  if (task.status === 'completed') return false;
  const today = startOfDay(new Date());
  const scheduleDate = startOfDay(parseISO(task.nextScheduleDate));
  // If it's overdue, it's treated as due today
  return isSameDay(scheduleDate, today) || isBefore(scheduleDate, today);
}
