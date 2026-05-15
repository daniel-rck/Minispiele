import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_TIMER_SECONDS, formatRemaining, joinSeconds, splitSeconds } from '../lib/clickerTimer';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import { DurationSchema } from '../lib/persistedSchemas';
import { AlarmAudio } from '../lib/audio';

const PRESETS: readonly number[] = [10, 30, 60, 180, 300, 600];

type Status = 'idle' | 'running' | 'alarming';

export default function ClickerTimer() {
  const [duration, setDuration] = useLocalStorage<number>(
    STORAGE_KEYS.TIMER_DURATION,
    DurationSchema,
    60,
  );
  const [remainingMs, setRemainingMs] = useState<number>(duration * 1000);
  const [status, setStatus] = useState<Status>('idle');
  const [audioAvailable, setAudioAvailable] = useState<boolean>(true);

  const endAtRef = useRef<number | null>(null);
  const alarmRef = useRef<AlarmAudio | null>(null);

  if (alarmRef.current === null) {
    alarmRef.current = new AlarmAudio();
  }

  useEffect(() => {
    setAudioAvailable(alarmRef.current?.isAvailable() ?? false);
  }, []);

  // Keep displayed time in sync with the configured duration while idle.
  useEffect(() => {
    if (status === 'idle') setRemainingMs(duration * 1000);
  }, [duration, status]);

  // Animation tick while running.
  useEffect(() => {
    if (status !== 'running') return;
    let raf = 0;
    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = endAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setStatus('alarming');
        const started = alarmRef.current?.start() ?? false;
        if (!started) setAudioAvailable(false);
        return;
      }
      setRemainingMs(left);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [status]);

  // Clean up on unmount.
  useEffect(
    () => () => {
      alarmRef.current?.dispose();
      alarmRef.current = null;
    },
    [],
  );

  const handlePress = useCallback(() => {
    const alarm = alarmRef.current;
    if (alarm) {
      alarm.stop();
      const primed = alarm.prime();
      setAudioAvailable(primed);
      alarm.resume();
    }

    endAtRef.current = Date.now() + duration * 1000;
    setRemainingMs(duration * 1000);
    setStatus('running');
  }, [duration]);

  const handleReset = useCallback(() => {
    alarmRef.current?.stop();
    endAtRef.current = null;
    setStatus('idle');
    setRemainingMs(duration * 1000);
  }, [duration]);

  const { minutes, seconds } = splitSeconds(duration);
  const totalMs = duration * 1000;
  const progress = totalMs === 0 ? 0 : 1 - Math.max(0, Math.min(1, remainingMs / totalMs));

  return (
    <div className="flex flex-col gap-5">
      {!audioAvailable && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        >
          Sound nicht verfügbar — Alarm wird visuell angezeigt.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-slate-600 dark:text-slate-300">Minuten</span>
            <input
              type="number"
              min={0}
              max={Math.floor(MAX_TIMER_SECONDS / 60)}
              value={minutes}
              onChange={(e) => setDuration(joinSeconds(Number(e.target.value), seconds))}
              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base tabular-nums dark:border-slate-700 dark:bg-slate-900"
              inputMode="numeric"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-slate-600 dark:text-slate-300">Sekunden</span>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setDuration(joinSeconds(minutes, Number(e.target.value)))}
              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base tabular-nums dark:border-slate-700 dark:bg-slate-900"
              inputMode="numeric"
            />
          </label>
          <div className="flex flex-wrap gap-1 sm:ml-auto">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDuration(p)}
                aria-pressed={duration === p}
                className={`rounded-lg border px-2.5 py-1 text-sm transition ${
                  duration === p
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                    : 'border-slate-300 hover:border-brand-300 dark:border-slate-700'
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePress}
        aria-label="Timer starten oder neu starten"
        className={`relative overflow-hidden rounded-3xl border-2 px-6 py-12 text-center select-none transition sm:py-16 ${
          status === 'alarming'
            ? 'animate-pulse border-red-500 bg-red-50 dark:bg-red-950/40'
            : status === 'running'
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
              : 'border-slate-300 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <div
          aria-hidden
          className={`absolute inset-y-0 left-0 ${
            status === 'alarming'
              ? 'bg-red-200/70 dark:bg-red-900/40'
              : 'bg-brand-100/80 dark:bg-brand-900/40'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
        <div className="relative z-10 text-6xl font-bold tabular-nums sm:text-7xl">
          {formatRemaining(remainingMs)}
        </div>
        <div className="relative z-10 mt-2 text-sm text-slate-600 dark:text-slate-300">
          {status === 'alarming'
            ? 'Tippen, um Alarm zu beenden und neu zu starten'
            : status === 'running'
              ? 'Tippen, um neu zu starten'
              : 'Tippen, um zu starten'}
        </div>
      </button>

      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-600 dark:text-slate-300">
          Status:{' '}
          <span className="font-medium">
            {status === 'idle' ? 'bereit' : status === 'running' ? 'läuft' : 'Alarm'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={status === 'idle'}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:border-brand-300 disabled:opacity-50 dark:border-slate-700"
        >
          Anhalten
        </button>
      </div>
    </div>
  );
}
