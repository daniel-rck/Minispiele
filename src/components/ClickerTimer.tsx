import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import { AlarmAudio } from '../lib/audio';
import {
  formatRemaining,
  joinSeconds,
  MAX_TIMER_SECONDS,
  pauseTimer,
  resumeTimer,
  splitSeconds,
} from '../lib/clickerTimer';
import { ANIMATION, HAPTICS, STORAGE_KEYS } from '../lib/constants';
import {
  DurationSchema,
  type TimerDisplayMode,
  TimerDisplayModeSchema,
  TimerUserPresetsSchema,
} from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import TimerDisplay from './TimerDisplay';

const BUILTIN_PRESETS: readonly number[] = [10, 30, 60, 180, 300, 600];
const MAX_USER_PRESETS = 3;

type Status = 'idle' | 'running' | 'paused' | 'alarming';

export default function ClickerTimer() {
  const [duration, setDuration] = useLocalStorage<number>(
    STORAGE_KEYS.TIMER_DURATION,
    DurationSchema,
    60,
  );
  const [userPresets, setUserPresets] = useLocalStorage<number[]>(
    STORAGE_KEYS.TIMER_PRESETS,
    TimerUserPresetsSchema,
    [],
  );
  const [displayMode, setDisplayMode] = useLocalStorage<TimerDisplayMode>(
    STORAGE_KEYS.TIMER_DISPLAY_MODE,
    TimerDisplayModeSchema,
    'flip',
  );
  const [remainingMs, setRemainingMs] = useState<number>(duration * 1000);
  const [status, setStatus] = useState<Status>('idle');
  const [audioAvailable, setAudioAvailable] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState('');

  const endAtRef = useRef<number | null>(null);
  const alarmRef = useRef<AlarmAudio | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  if (alarmRef.current === null) {
    alarmRef.current = new AlarmAudio();
  }

  const { vibrate } = useVibration();
  useWakeLock(status === 'running' || status === 'alarming');

  useEffect(() => {
    setAudioAvailable(alarmRef.current?.isAvailable() ?? false);
  }, []);

  useEffect(() => {
    if (status === 'idle') setRemainingMs(duration * 1000);
  }, [duration, status]);

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
        vibrate([...HAPTICS.ALARM_PATTERN]);
        setAnnouncement('Timer abgelaufen');
        return;
      }
      setRemainingMs(left);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [status, vibrate]);

  useEffect(
    () => () => {
      alarmRef.current?.dispose();
      alarmRef.current = null;
      if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    },
    [],
  );

  const startFresh = useCallback(() => {
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
    setAnnouncement(`Timer gestartet: ${formatRemaining(duration * 1000)}`);
  }, [duration]);

  const togglePause = useCallback(() => {
    if (status === 'running') {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = pauseTimer(endAt, Date.now());
      setRemainingMs(left);
      endAtRef.current = null;
      setStatus('paused');
      setAnnouncement('Pausiert');
    } else if (status === 'paused') {
      endAtRef.current = resumeTimer(remainingMs, Date.now());
      setStatus('running');
      setAnnouncement('Fortgesetzt');
    }
  }, [status, remainingMs]);

  const handleRestart = useCallback(() => {
    alarmRef.current?.stop();
    startFresh();
    setAnnouncement(`Neu gestartet: ${formatRemaining(duration * 1000)}`);
  }, [duration, startFresh]);

  const handlePress = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (status === 'idle' || status === 'alarming') {
      startFresh();
    } else {
      togglePause();
    }
  }, [status, startFresh, togglePause]);

  const startLongPress = useCallback(() => {
    longPressFiredRef.current = false;
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      vibrate(40);
      handleRestart();
    }, ANIMATION.LONG_PRESS_MS);
  }, [handleRestart, vibrate]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleSavePreset = useCallback(() => {
    setUserPresets((prev) => {
      if (prev.includes(duration)) return prev;
      const next = [duration, ...prev].slice(0, MAX_USER_PRESETS);
      return next;
    });
  }, [duration, setUserPresets]);

  const handleRemovePreset = useCallback(
    (value: number) => {
      setUserPresets((prev) => prev.filter((v) => v !== value));
    },
    [setUserPresets],
  );

  const adjustDuration = useCallback(
    (delta: number) => {
      setDuration((prev) => {
        const next = prev + delta;
        return next < 1 ? 1 : next > MAX_TIMER_SECONDS ? MAX_TIMER_SECONDS : next;
      });
    },
    [setDuration],
  );

  const { minutes, seconds } = splitSeconds(duration);
  const totalMs = duration * 1000;
  const progress = totalMs === 0 ? 0 : 1 - Math.max(0, Math.min(1, remainingMs / totalMs));
  const buttonLabel =
    status === 'idle'
      ? 'Starten'
      : status === 'running'
        ? 'Pause'
        : status === 'paused'
          ? 'Fortsetzen'
          : 'Neu starten';

  return (
    <div className="flex flex-col gap-4 pb-4">
      <AriaLive message={announcement} />

      {!audioAvailable && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        >
          Sound nicht verfügbar — Alarm wird visuell und per Vibration angezeigt.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end justify-center gap-3">
          <StepperInput
            label="Min"
            value={minutes}
            onChange={(v) => setDuration(joinSeconds(v, seconds))}
            max={Math.floor(MAX_TIMER_SECONDS / 60)}
          />
          <span className="pb-2 text-2xl font-bold text-slate-400">:</span>
          <StepperInput
            label="Sek"
            value={seconds}
            onChange={(v) => setDuration(joinSeconds(minutes, v))}
            max={59}
          />
        </div>

        <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {BUILTIN_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDuration(p)}
              aria-pressed={duration === p}
              className={`min-h-11 shrink-0 snap-start rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap transition ${
                duration === p
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-slate-300 hover:border-brand-300 dark:border-slate-700'
              }`}
            >
              {p < 60 ? `${p}s` : `${p / 60}m`}
            </button>
          ))}
          {userPresets.map((p) => (
            <span key={`user-${p}`} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setDuration(p)}
                aria-pressed={duration === p}
                className={`min-h-11 snap-start rounded-lg border py-1.5 pr-7 pl-3 text-sm whitespace-nowrap transition ${
                  duration === p
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                    : 'border-emerald-300 hover:border-emerald-500 dark:border-emerald-800'
                }`}
              >
                {formatRemaining(p * 1000)}
              </button>
              <button
                type="button"
                onClick={() => handleRemovePreset(p)}
                aria-label={`Preset ${formatRemaining(p * 1000)} entfernen`}
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-0.5 text-xs text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={userPresets.includes(duration) || userPresets.length >= MAX_USER_PRESETS}
            aria-label="Aktuelle Dauer als Preset speichern"
            className="min-h-11 shrink-0 snap-start rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm whitespace-nowrap text-slate-500 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700"
          >
            + speichern
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Anzeige</span>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              aria-pressed={displayMode === 'flip'}
              aria-label="Anzeige: Sekunden mit Umklapp-Animation"
              onClick={() => setDisplayMode('flip')}
              className={`min-h-9 rounded-md px-3 py-1 transition ${
                displayMode === 'flip'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:text-brand-600 dark:text-slate-300'
              }`}
            >
              Sekunden
            </button>
            <button
              type="button"
              aria-pressed={displayMode === 'continuous'}
              aria-label="Anzeige: Hundertstel-Sekunden"
              onClick={() => setDisplayMode('continuous')}
              className={`min-h-9 rounded-md px-3 py-1 transition ${
                displayMode === 'continuous'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:text-brand-600 dark:text-slate-300'
              }`}
            >
              Hundertstel
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={handlePress}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`${buttonLabel}. Lange halten, um neu zu starten.`}
          className={`relative w-full touch-manipulation overflow-hidden rounded-3xl border-2 px-6 py-16 text-center select-none transition motion-reduce:transition-none sm:py-20 ${
            status === 'alarming'
              ? 'animate-pulse border-red-500 bg-red-50 dark:bg-red-950/40'
              : status === 'running'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                : status === 'paused'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-slate-300 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900'
          }`}
        >
          <div
            aria-hidden
            className={`absolute inset-y-0 left-0 transition-[width] motion-reduce:transition-none ${
              status === 'alarming'
                ? 'bg-red-200/70 dark:bg-red-900/40'
                : status === 'paused'
                  ? 'bg-amber-200/60 dark:bg-amber-900/30'
                  : 'bg-brand-100/80 dark:bg-brand-900/40'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
          <div className="relative z-10 text-7xl font-bold tabular-nums sm:text-8xl">
            <TimerDisplay mode={displayMode} ms={remainingMs} />
          </div>
          <div className="relative z-10 mt-2 text-sm text-slate-600 dark:text-slate-300">
            {buttonLabel}
            {status !== 'idle' && status !== 'alarming' && ' · lang halten = neu starten'}
          </div>
        </button>

        {status !== 'idle' && (
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Neu starten"
            className="absolute top-2 right-2 min-h-11 min-w-11 rounded-full bg-white/80 text-slate-600 shadow-sm hover:bg-white hover:text-brand-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ↺
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <div>
          Status:{' '}
          <span className="font-medium">
            {status === 'idle'
              ? 'bereit'
              : status === 'running'
                ? 'läuft'
                : status === 'paused'
                  ? 'pausiert'
                  : 'Alarm'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => adjustDuration(-10)}
          className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 dark:border-slate-700"
        >
          −10s
        </button>
        <button
          type="button"
          onClick={() => adjustDuration(10)}
          className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 dark:border-slate-700"
        >
          +10s
        </button>
      </div>
    </div>
  );
}

interface StepperInputProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  max: number;
}

function StepperInput({ label, value, onChange, max }: StepperInputProps) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex flex-col items-center">
      <span className="mb-1 text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={dec}
          aria-label={`${label} minus eins`}
          className="min-h-12 min-w-12 rounded-lg border border-slate-300 text-lg font-medium hover:border-brand-300 dark:border-slate-700"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          className="w-16 min-h-12 rounded-lg border border-slate-300 bg-white text-center text-2xl font-semibold tabular-nums dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="button"
          onClick={inc}
          aria-label={`${label} plus eins`}
          className="min-h-12 min-w-12 rounded-lg border border-slate-300 text-lg font-medium hover:border-brand-300 dark:border-slate-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
