import React, { useState } from 'react';
import { Task } from '../types';
import { Play, Pause, Square, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePomodoro } from '../hooks/usePomodoro';
import { getSoundSettings, saveSoundSettings, initializeSounds } from '../utils/sound';

interface PomodoroTimerProps {
  task: Task;
  onClose: () => void;
  onComplete: (progress: number) => void;
}

export function PomodoroTimer({ task, onClose, onComplete }: PomodoroTimerProps) {
  const { phase, state, timeLeft, totalTime, start, pause, resume, stop } = usePomodoro();
  const [showProgressPrompt, setShowProgressPrompt] = useState(false);
  const [progress, setProgress] = useState(task.progress || 0);
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundSettings().enabled);

  // Auto-start on mount
  React.useEffect(() => {
    initializeSounds();
    start();
  }, [start]);

  const handleStop = () => {
    stop();
    setShowProgressPrompt(true);
  };

  const handleDone = () => {
    stop();
    onComplete(100);
    onClose();
  };

  const handleSaveProgress = () => {
    onComplete(progress);
    onClose();
  };

  const toggleSound = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    const settings = getSoundSettings();
    settings.enabled = newEnabled;
    saveSoundSettings(settings);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = ((totalTime - timeLeft) / totalTime) * 100;

  const phaseLabel = phase === 'focus' ? 'Focus Session' : 'Break';
  const isFocus = phase === 'focus';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
        className={cn(
          "bg-white/10 border rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center relative overflow-hidden min-h-[400px] transition-colors duration-500",
          isFocus ? "border-white/20" : "border-green-500/30"
        )}
      >
        <AnimatePresence mode="wait">
          {!showProgressPrompt ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center absolute inset-0 p-8"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-white truncate pr-4">{task.title}</h2>
                <button
                  onClick={toggleSound}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              {/* Phase indicator */}
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isFocus ? "bg-red-500" : "bg-green-500"
                )} />
                <p className="text-white/50 text-sm">{phaseLabel}</p>
              </div>

              {/* Timer display */}
              <div className="text-6xl font-mono text-white mb-10 tracking-tighter">
                {formatTime(timeLeft)}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isFocus ? "bg-red-500" : "bg-green-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>

              {/* Controls */}
              <div className="flex gap-3 w-full mt-auto">
                <button
                  onClick={state === 'running' ? pause : resume}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  {state === 'running' ? <Pause size={20} /> : <Play size={20} />}
                  {state === 'running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <Square size={20} />
                  Stop
                </button>
              </div>
              <button
                onClick={handleDone}
                className="mt-3 w-full py-3 rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
              >
                <CheckCircle2 size={20} />
                Mark as Done
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center absolute inset-0 p-8"
            >
              <h2 className="text-xl font-medium text-white mb-6">Session Ended</h2>
              <p className="text-white/70 mb-8 text-center">How much progress did you make?</p>

              <div className="w-full mb-8">
                <div className="flex justify-between text-white/50 text-sm mb-2">
                  <span>0%</span>
                  <span className="text-white font-mono">{progress}%</span>
                  <span>100%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div className="flex gap-2 w-full mb-8 mt-auto">
                {[25, 50, 75, 100].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setProgress(preset)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border transition-colors text-sm",
                      progress === preset
                        ? "bg-red-500/20 border-red-500/50 text-red-500"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <button
                onClick={handleSaveProgress}
                className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
              >
                Save Progress
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
