import React, { useState } from 'react';
import { Task } from '../types';
import { Play, Edit2, Trash2, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { isTaskOverdue, isTaskDueToday } from '../lib/taskUtils';
import { differenceInDays, startOfDay, parseISO } from 'date-fns';
import { motion } from 'motion/react';

interface TaskItemProps {
  task: Task;
  onDo?: (task: Task) => void;
  onEdit?: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function TaskItem({ task, onDo, onEdit, onDelete, onRestore }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDeadline, setEditDeadline] = useState(task.deadline ? task.deadline.split('T')[0] : '');

  const isCompleted = task.status === 'completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const isConstrained = task.constraintFlag && !isCompleted;

  // Calculate overdue and urgency details
  let dueText = '';
  let overdueDays = 0;
  let isDueSoon = false;
  let dueSoonDays = 0;

  if (!isCompleted && task.deadline) {
    const deadlineDate = startOfDay(parseISO(task.deadline));
    const today = startOfDay(new Date());
    const diffDays = differenceInDays(deadlineDate, today);

    if (overdue) {
      overdueDays = Math.abs(diffDays);
      dueText = `OVERDUE by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
    } else if (isConstrained) {
      dueText = 'MUST DO TODAY';
    } else if (task.priority === 'high' && diffDays > 0 && diffDays <= 3) {
      // High priority early warning
      isDueSoon = true;
      dueSoonDays = diffDays;
      dueText = `Due soon (Overdue in ${dueSoonDays} day${dueSoonDays > 1 ? 's' : ''})`;
    } else if (dueToday) {
      dueText = 'TODAY';
    } else {
      const days = differenceInDays(startOfDay(parseISO(task.nextScheduleDate)), startOfDay(new Date()));
      dueText = `In ${days} day${days > 1 ? 's' : ''}`;
    }
  } else if (!isCompleted) {
    if (overdue) {
      dueText = 'OVERDUE';
    } else if (isConstrained) {
      dueText = 'MUST DO TODAY';
    } else if (dueToday) {
      dueText = 'TODAY';
    } else {
      const days = differenceInDays(startOfDay(parseISO(task.nextScheduleDate)), startOfDay(new Date()));
      dueText = `In ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(task.id, {
        title: editTitle,
        priority: editPriority,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
      });
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="bg-white/10 border border-white/20 rounded-2xl p-5"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 text-white text-lg pb-1 focus:outline-none focus:border-red-500 transition-colors"
          />
          <div className="flex gap-4">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as any)}
              className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 [color-scheme:dark]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSaveEdit}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-colors duration-300",
        isCompleted ? "bg-white/5 border-white/5 opacity-50" : "bg-white/5 border-white/10 hover:border-white/20",
        overdue && !isCompleted ? "border-red-500/30 bg-red-500/5" : "",
        isConstrained && !overdue ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : ""
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className={cn(
                "text-xs font-mono px-2 py-0.5 rounded-md border",
                task.priority === 'high' ? "border-red-500/50 text-red-500 bg-red-500/10" : 
                task.priority === 'medium' ? "border-white/20 text-white/70" : "border-white/10 text-white/50"
              )}>
                {task.priority.toUpperCase()}
              </span>
              {!isCompleted && (
                <span className={cn(
                  "text-xs font-medium tracking-wider flex items-center gap-1",
                  overdue ? "text-red-500" :
                  isDueSoon ? "text-orange-400" :
                  isConstrained ? "text-red-500" : "text-white/40"
                )}>
                  {isConstrained && !overdue && !isDueSoon && <AlertCircle size={12} />}
                  {overdue && <AlertCircle size={12} />}
                  {dueText}
                </span>
              )}
            </div>
            <h3 className={cn(
              "text-lg font-medium text-white truncate transition-all",
              isCompleted && "line-through text-white/50"
            )}>
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 opacity-100 2xl:opacity-0 2xl:group-hover:opacity-100 transition-opacity">
            {!isCompleted && onDo && dueToday && (
              <button 
                onClick={() => onDo(task)}
                className="p-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors"
                title="Do Task"
              >
                <Play size={16} className="fill-current" />
              </button>
            )}
            {!isCompleted && onEdit && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
            )}
            {isCompleted && onRestore && (
              <button 
                onClick={() => onRestore(task.id)}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Restore"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button 
              onClick={() => onDelete(task.id)}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!isCompleted && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <motion.div 
            layout
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          />
        </div>
      )}
    </motion.div>
  );
}
