import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Priority, TaskStatus } from '../types';
import { calculateNextScheduleDate, evaluateConstraint } from '../lib/taskUtils';
import { startOfDay } from 'date-fns';

const STORAGE_KEY = 'minimalist_smart_todo_tasks';

export function useTasks(onConstraintTriggered?: (msg: string) => void) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Recalculate schedules on load to ensure 'today' is accurate
        return parsed.map((t: Task) => {
          if (t.status === 'active') {
             const { isConstrained, reason } = evaluateConstraint(t.priority, t.deadline);
             return {
               ...t,
               constraintFlag: isConstrained,
               constraintReason: reason,
               nextScheduleDate: calculateNextScheduleDate(t.priority, t.deadline, t.lastCompletedAt, t.createdAt)
             }
          }
          return t;
        });
      } catch (e) {
        console.error("Failed to parse tasks", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((title: string, priority: Priority, deadline: string | null) => {
    const now = new Date().toISOString();
    const { isConstrained, reason } = evaluateConstraint(priority, deadline);
    
    if (isConstrained && onConstraintTriggered && reason) {
      onConstraintTriggered(reason);
    }

    const newTask: Task = {
      id: uuidv4(),
      title,
      priority,
      deadline,
      createdAt: now,
      nextScheduleDate: calculateNextScheduleDate(priority, deadline, null, now),
      progress: 0,
      status: 'active',
      lastCompletedAt: null,
      constraintFlag: isConstrained,
      constraintReason: reason,
    };
    setTasks(prev => [...prev, newTask]);
  }, [onConstraintTriggered]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updatedTask = { ...t, ...updates };
        // If priority or deadline changed, recalculate schedule
        if (updates.priority !== undefined || updates.deadline !== undefined) {
          const { isConstrained, reason } = evaluateConstraint(updatedTask.priority, updatedTask.deadline);
          
          if (!t.constraintFlag && isConstrained && onConstraintTriggered && reason) {
            onConstraintTriggered(reason);
          }
          
          updatedTask.constraintFlag = isConstrained;
          updatedTask.constraintReason = reason;
          updatedTask.nextScheduleDate = calculateNextScheduleDate(
            updatedTask.priority,
            updatedTask.deadline,
            updatedTask.lastCompletedAt,
            updatedTask.createdAt
          );
        }
        return updatedTask;
      }
      return t;
    }));
  }, [onConstraintTriggered]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'completed',
          progress: 100,
          lastCompletedAt: new Date().toISOString(),
        };
      }
      return t;
    }));
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (progress >= 100) {
           return {
             ...t,
             status: 'completed',
             progress: 100,
             lastCompletedAt: new Date().toISOString(),
           };
        }
        return { ...t, progress };
      }
      return t;
    }));
  }, []);

  const restoreTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const { isConstrained, reason } = evaluateConstraint(t.priority, t.deadline);
        const restoredTask = {
          ...t,
          status: 'active' as TaskStatus,
          progress: 0,
          constraintFlag: isConstrained,
          constraintReason: reason,
        };
        restoredTask.nextScheduleDate = calculateNextScheduleDate(
            restoredTask.priority,
            restoredTask.deadline,
            restoredTask.lastCompletedAt,
            restoredTask.createdAt
        );
        return restoredTask;
      }
      return t;
    }));
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateProgress,
    restoreTask
  };
}
