import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_TIMER_SECONDS,
  clampSeconds,
  formatRemaining,
  joinSeconds,
  splitSeconds,
} from '../lib/clickerTimer';

const DURATION_KEY = 'minispiele.timer.durationSeconds';

const PRESETS: readonly number[] = [10, 30, 60, 180, 300, 600];

type Status = 'idle' | 'running' | 'alarming';

function loadDuration(): number {
  if (typeof window === 'undefined') return 60;
  const stored = window.localStorage.getItem(DURATION_KEY);
  if (stored === null) return 60;
  const n = Number(stored);
  if (!Number.isFinite(n)) return 60;
  return clampSeconds(n);
}

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getAudioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as AudioWindow;
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export default function ClickerTimer() {
  const [duration, setDuration] = useState<number>(loadDuration);
  const [remainingMs, setRemainingMs] = useState<number>(loadDuration() * 1000);
  const [status, setStatus] = useState<Status>('idle');

  const endAtRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DURATION_KEY, String(duration));
  }, [duration]);

  // Keep displayed time in sync with the configured duration while idle.
  useEffect(() => {
    if (status === 'idle') setRemainingMs(duration * 1000);
  }, [duration, status]);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current !== null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const beep = useCallback((frequency: number, durationS: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationS);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationS + 0.02);
  }, []);

  const startAlarm = useCallback(() => {
    stopAlarm();
    const Ctor = getAudioCtor();
    if (Ctor && !audioCtxRef.current) {
      audioCtxRef.current = new Ctor();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    beep(880, 0.35);
    alarmIntervalRef.current = window.setInterval(() => beep(880, 0.35), 600);
  }, [beep, stopAlarm]);

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
        startAlarm();
        return;
      }
      setRemainingMs(left);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [status, startAlarm]);

  // Clean up on unmount.
  useEffect(
    () => () => {
      stopAlarm();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
      }
    },
    [stopAlarm],
  );

  const handlePress = useCallback(() => {
    stopAlarm();
    // Prime the audio context on a user gesture so the alarm can play later.
    const Ctor = getAudioCtor();
    if (Ctor && !audioCtxRef.current) {
      try {
        audioCtxRef.current = new Ctor();
      } catch {
        audioCtxRef.current = null;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') void ctx.resume();

    endAtRef.current = Date.now() + duration * 1000;
    setRemainingMs(duration * 1000);
    setStatus('running');
  }, [duration, stopAlarm]);

  const handleReset = useCallback(() => {
    stopAlarm();
    endAtRef.current = null;
    setStatus('idle');
    setRemainingMs(duration * 1000);
  }, [duration, stopAlarm]);

  const { minutes, seconds } = splitSeconds(duration);
  const totalMs = duration * 1000;
  const progress = totalMs === 0 ? 0 : 1 - Math.max(0, Math.min(1, remainingMs / totalMs));

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col">
            <span className="text-slate-600 dark:text-slate-300 mb-1">Minuten</span>
            <input
              type="number"
              min={0}
              max={Math.floor(MAX_TIMER_SECONDS / 60)}
              value={minutes}
              onChange={(e) =>
                setDuration(joinSeconds(Number(e.target.value), seconds))
              }
              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base tabular-nums"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm flex flex-col">
            <span className="text-slate-600 dark:text-slate-300 mb-1">Sekunden</span>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) =>
                setDuration(joinSeconds(minutes, Number(e.target.value)))
              }
              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base tabular-nums"
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
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-300'
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
        className={`relative overflow-hidden rounded-3xl border-2 px-6 py-12 sm:py-16 text-center select-none transition ${
          status === 'alarming'
            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 animate-pulse'
            : status === 'running'
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-300'
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
        <div className="relative z-10 text-6xl sm:text-7xl font-bold tabular-nums">
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
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50 hover:border-brand-300"
        >
          Anhalten
        </button>
      </div>
    </div>
  );
}
