import React, { useState, useMemo, useCallback } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskForm } from './components/TaskForm';
import { TaskItem } from './components/TaskItem';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Task } from './types';
import { isTaskDueToday, isTaskOverdue } from './lib/taskUtils';
import { Plus, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { differenceInDays, startOfDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const { tasks, addTask, updateTask, deleteTask, updateProgress, restoreTask } = useTasks(showToast);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { todayTasks, futureTasks, completedTasks } = useMemo(() => {
    const today: Task[] = [];
    const future: Record<number, Task[]> = {};
    const completed: Task[] = [];

    tasks.forEach(task => {
      if (task.status === 'completed') {
        completed.push(task);
      } else if (isTaskDueToday(task)) {
        today.push(task);
      } else {
        const days = differenceInDays(startOfDay(parseISO(task.nextScheduleDate)), startOfDay(new Date()));
        if (!future[days]) future[days] = [];
        future[days].push(task);
      }
    });

    // Sort today tasks: Overdue -> Constraint -> High -> Medium -> Low -> Earliest deadline
    today.sort((a, b) => {
      if (isTaskOverdue(a) && !isTaskOverdue(b)) return -1;
      if (!isTaskOverdue(a) && isTaskOverdue(b)) return 1;
      
      if (a.constraintFlag && !b.constraintFlag) return -1;
      if (!a.constraintFlag && b.constraintFlag) return 1;

      const priorityWeight = { high: 0, medium: 1, low: 2 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }

      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      
      return 0;
    });

    return { todayTasks: today, futureTasks: future, completedTasks: completed };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        <header className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">System</h1>
            <p className="text-white/50 font-mono text-sm">Minimalist Smart To-Do</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={24} />
          </button>
        </header>

        <main className="space-y-16">
          {/* TODAY SECTION */}
          <section>
            <h2 className="text-sm font-mono text-white/50 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              TODAY
            </h2>
            {todayTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center"
              >
                <p className="text-white/40">No tasks scheduled for today.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {todayTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onDo={setActiveTask}
                      onDelete={deleteTask}
                      onEdit={updateTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* FUTURE SECTIONS */}
          {Object.keys(futureTasks).sort((a, b) => Number(a) - Number(b)).map(daysStr => {
            const days = Number(daysStr);
            return (
              <section key={days}>
                <h2 className="text-sm font-mono text-white/50 mb-6">
                  IN {days} DAY{days > 1 ? 'S' : ''}
                </h2>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {futureTasks[days].map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onEdit={updateTask}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}

          {/* COMPLETED TASKS */}
          {completedTasks.length > 0 && (
            <section>
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm font-mono text-white/50 hover:text-white transition-colors mb-6"
              >
                {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                COMPLETED ({completedTasks.length})
              </button>
              
              <AnimatePresence>
                {showCompleted && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <AnimatePresence mode="popLayout">
                      {completedTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onDelete={deleteTask}
                          onRestore={restoreTask}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <TaskForm
            onClose={() => setIsFormOpen(false)}
            onSubmit={addTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTask && (
          <PomodoroTimer
            task={activeTask}
            onClose={() => setActiveTask(null)}
            onComplete={(progress) => updateProgress(activeTask.id, progress)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium text-sm"
          >
            <AlertCircle size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
