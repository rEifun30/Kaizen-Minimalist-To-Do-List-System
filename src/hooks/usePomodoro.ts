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

export function usePomodoro(): UsePomodoroReturn {
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [state, setState] = useState<PomodoroState>('idle');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [totalTime, setTotalTime] = useState(FOCUS_DURATION);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<PomodoroPhase>('focus');
  const stateRef = useRef<PomodoroState>('idle');

  // Keep refs in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Update document title based on timer state
  useEffect(() => {
    if (state === 'idle') {
      document.title = DEFAULT_TITLE;
      return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const phaseLabel = phase === 'focus' ? 'Focus' : 'Break';
    document.title = `${timeStr} - ${phaseLabel} | Kaizen`;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [timeLeft, phase, state]);

  // Timer logic
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed, transition to next phase
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const handlePhaseComplete = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const currentPhase = phaseRef.current;

    if (currentPhase === 'focus') {
      // Focus session ended - play alarm sound
      playAlarmSound();

      // Transition to break
      setPhase('break');
      setTimeLeft(BREAK_DURATION);
      setTotalTime(BREAK_DURATION);
      // Auto-start break after a brief delay
      setTimeout(() => {
        if (stateRef.current === 'running') {
          // Keep running for break
        }
      }, 1000);
    } else {
      // Break session ended - play alarm sound
      playAlarmSound();

      // Transition back to focus
      setPhase('focus');
      setTimeLeft(FOCUS_DURATION);
      setTotalTime(FOCUS_DURATION);
    }
  }, []);

  const start = useCallback(() => {
    setPhase('focus');
    setTimeLeft(FOCUS_DURATION);
    setTotalTime(FOCUS_DURATION);
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
    setPhase('focus');
    setTimeLeft(FOCUS_DURATION);
    setTotalTime(FOCUS_DURATION);
    document.title = DEFAULT_TITLE;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('focus');
    setTimeLeft(FOCUS_DURATION);
    setTotalTime(FOCUS_DURATION);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  return {
    phase,
    state,
    timeLeft,
    totalTime,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
