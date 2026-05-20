import { useCallback, useEffect, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'stopped';

export interface GameTimer {
  status: TimerStatus;
  elapsedSeconds: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useGameTimer(initialSeconds = 0): GameTimer {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
  const [hidden, setHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    // Pause ticking when the tab is hidden so timed games stay fair.
    if (status !== 'running' || hidden) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, hidden]);

  const start = useCallback(() => {
    setStatus((s) => (s === 'idle' ? 'running' : s));
  }, []);

  const stop = useCallback(() => {
    setStatus((s) => (s === 'running' ? 'stopped' : s));
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setElapsedSeconds(0);
  }, []);

  return { status, elapsedSeconds, start, stop, reset };
}
