import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Priority, TaskStatus } from '../types';
import { calculateNextScheduleDate, evaluateConstraint } from '../lib/taskUtils';
import { startOfDay } from 'date-fns';
import { supabase } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'minimalist_smart_todo_tasks';

function toDb(task: Task) {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    deadline: task.deadline,
    created_at: task.createdAt,
    next_schedule_date: task.nextScheduleDate,
    progress: task.progress,
    status: task.status,
    last_completed_at: task.lastCompletedAt,
    constraint_flag: task.constraintFlag,
    constraint_reason: task.constraintReason,
  };
}

function fromDb(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    deadline: row.deadline,
    createdAt: row.created_at,
    nextScheduleDate: row.next_schedule_date,
    progress: row.progress,
    status: row.status,
    lastCompletedAt: row.last_completed_at,
    constraintFlag: row.constraint_flag,
    constraintReason: row.constraint_reason,
  };
}

export function useTasks(onConstraintTriggered?: (msg: string) => void, user: User | null = null) {
  const isSynced = !!user;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load tasks from Supabase or localStorage
  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      if (isSynced && user) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error('Failed to load tasks from Supabase:', error.message);
          // Fallback to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try { setTasks(JSON.parse(stored)); } catch { /* ignore */ }
          }
        } else {
          const parsed = (data || []).map(fromDb).map(t => {
            if (t.status === 'active') {
              const { isConstrained, reason } = evaluateConstraint(t.priority, t.deadline);
              return {
                ...t,
                constraintFlag: isConstrained,
                constraintReason: reason,
                nextScheduleDate: calculateNextScheduleDate(t.priority, t.deadline, t.lastCompletedAt, t.createdAt)
              };
            }
            return t;
          });
          setTasks(parsed);
        }
      } else {
        if (cancelled) return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored).map((t: Task) => {
              if (t.status === 'active') {
                const { isConstrained, reason } = evaluateConstraint(t.priority, t.deadline);
                return {
                  ...t,
                  constraintFlag: isConstrained,
                  constraintReason: reason,
                  nextScheduleDate: calculateNextScheduleDate(t.priority, t.deadline, t.lastCompletedAt, t.createdAt)
                };
              }
              return t;
            });
            setTasks(parsed);
          } catch (e) {
            console.error("Failed to parse tasks", e);
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      }
      setInitialized(true);
    }

    loadTasks();
    return () => { cancelled = true; };
  }, [isSynced, user?.id]);

  // Persist to localStorage when not synced
  useEffect(() => {
    if (!isSynced) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isSynced]);

  const syncTask = useCallback(async (task: Task) => {
    if (isSynced && user) {
      const { error } = await supabase
        .from('tasks')
        .upsert({ ...toDb(task), user_id: user.id });
      if (error) console.error('Failed to sync task:', error.message);
    }
  }, [isSynced, user?.id]);

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
    syncTask(newTask);
  }, [onConstraintTriggered, syncTask]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updatedTask = { ...t, ...updates };
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
        syncTask(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  }, [onConstraintTriggered, syncTask]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (isSynced && user) {
      supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to delete task from Supabase:', error.message);
          }
        });
    }
  }, [isSynced, user?.id]);

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
        syncTask(restoredTask);
        return restoredTask;
      }
      return t;
    }));
  }, [syncTask]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateProgress,
    restoreTask,
    initialized,
  };
}
