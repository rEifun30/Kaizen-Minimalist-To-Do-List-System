import { useState, useEffect, useCallback, useRef } from 'react';
import { playAlarmSound } from '../utils/sound';

export type PomodoroPhase = 'focus' | 'break';
export type PomodoroState = 'idle' | 'running' | 'paused';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60;  // 5 minutes in seconds
const DEFAULT_TITLE = 'Kaizen — A Minimalist To-Do System';

interface UsePomodoroReturn {
  phase: PomodoroPhase;
  state: PomodoroState;
  timeLeft: number;
  totalTime: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

interface TimerState {
  phase: PomodoroPhase;
  timeLeft: number;
  totalTime: number;
}

export function usePomodoro(): UsePomodoroReturn {
  const [timer, setTimer] = useState<TimerState>({
    phase: 'focus',
    timeLeft: FOCUS_DURATION,
    totalTime: FOCUS_DURATION,
  });
  const [state, setState] = useState<PomodoroState>('idle');

  const stateRef = useRef<PomodoroState>('idle');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Update document title
  useEffect(() => {
    if (state === 'idle') {
      document.title = DEFAULT_TITLE;
      return;
    }

    const minutes = Math.floor(timer.timeLeft / 60);
    const seconds = timer.timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const phaseLabel = timer.phase === 'focus' ? 'Focus' : 'Break';
    document.title = `${timeStr} - ${phaseLabel} | Kaizen`;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [timer.timeLeft, timer.phase, state]);

  // Single interval - transitions happen atomically in one state update
  useEffect(() => {
    if (state !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimer((prev) => {
        if (prev.timeLeft <= 1) {
          // Phase complete
          playAlarmSound();

          if (prev.phase === 'focus') {
            return {
              phase: 'break' as PomodoroPhase,
              timeLeft: BREAK_DURATION,
              totalTime: BREAK_DURATION,
            };
          } else {
            return {
              phase: 'focus' as PomodoroPhase,
              timeLeft: FOCUS_DURATION,
              totalTime: FOCUS_DURATION,
            };
          }
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const start = useCallback(() => {
    setTimer({
      phase: 'focus',
      timeLeft: FOCUS_DURATION,
      totalTime: FOCUS_DURATION,
    });
    setState('running');
  }, []);

  const pause = useCallback(() => {
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    setState('running');
  }, []);

  const stop = useCallback(() => {
    setState('idle');
    setTimer({
      phase: 'focus',
      timeLeft: FOCUS_DURATION,
      totalTime: FOCUS_DURATION,
    });
    document.title = DEFAULT_TITLE;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setTimer({
      phase: 'focus',
      timeLeft: FOCUS_DURATION,
      totalTime: FOCUS_DURATION,
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    phase: timer.phase,
    state,
    timeLeft: timer.timeLeft,
    totalTime: timer.totalTime,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
