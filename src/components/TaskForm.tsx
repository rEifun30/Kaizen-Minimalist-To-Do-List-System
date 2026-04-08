import React, { useState } from 'react';
import { Priority } from '../types';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TaskFormProps {
  onClose: () => void;
  onSubmit: (title: string, priority: Priority, deadline: string | null) => void;
}

export function TaskForm({ onClose, onSubmit }: TaskFormProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [hasDeadline, setHasDeadline] = useState<boolean | null>(null);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);

  const handleNext = () => {
    if (step === 1 && title.trim()) setStep(2);
    else if (step === 2) {
      if (hasDeadline && deadline) setStep(3);
      else if (hasDeadline === false) setStep(3);
    }
  };

  const handleSubmit = () => {
    if (title && priority) {
      onSubmit(title, priority, hasDeadline && deadline ? new Date(deadline).toISOString() : null);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-500",
                  i <= step ? "bg-red-500" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Step {step} of 3</p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                <h2 className="text-2xl font-medium text-white mb-6">What is the task for today?</h2>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  placeholder="e.g., Design the new landing page"
                  className="w-full bg-transparent border-b border-white/20 text-white text-xl pb-2 focus:outline-none focus:border-red-500 transition-colors placeholder:text-white/20"
                />
                <button
                  onClick={handleNext}
                  disabled={!title.trim()}
                  className="mt-8 w-full py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                >
                  Next
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                <h2 className="text-2xl font-medium text-white mb-6">Does it have a deadline?</h2>
                
                {hasDeadline === null && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setHasDeadline(true)}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => { setHasDeadline(false); setStep(3); }}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}

                {hasDeadline === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <input
                      type="date"
                      autoFocus
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                    />
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={() => setHasDeadline(null)}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={!deadline}
                        className="flex-1 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                <h2 className="text-2xl font-medium text-white mb-6">Set Priority</h2>
                <div className="flex flex-col gap-3">
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "w-full py-4 rounded-xl border text-left px-6 transition-all",
                        priority === p 
                          ? p === 'high' ? "border-red-500 bg-red-500/10 text-red-500" : "border-white bg-white/10 text-white"
                          : "border-white/10 text-white/70 hover:bg-white/5"
                      )}
                    >
                      <span className="capitalize font-medium">{p} Priority</span>
                      <span className="block text-xs opacity-70 mt-1">
                        {p === 'high' && "Always scheduled for today"}
                        {p === 'medium' && "Scheduled every 2 days"}
                        {p === 'low' && "Scheduled every 3 days"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!priority}
                    className="flex-1 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
