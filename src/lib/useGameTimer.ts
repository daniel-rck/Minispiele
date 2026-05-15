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

export function useGameTimer(): GameTimer {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

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
