import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { SchulteBestSchema, SchulteSizeSchema } from '../lib/persistedSchemas';
import { formatDuration } from '../lib/useGameTimer';
import { useVibration } from '../hooks/useVibration';
import AriaLive from './AriaLive';

const SIZES = [3, 4, 5, 6, 7] as const;
type Size = (typeof SIZES)[number];

function shuffled(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export default function SchulteGame() {
  const [size, setSize] = useLocalStorage<number>(STORAGE_KEYS.SCHULTE_SIZE, SchulteSizeSchema, 5);
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.SCHULTE_BEST,
    SchulteBestSchema,
    {},
  );
  const [board, setBoard] = useState<number[]>(() => shuffled(size * size));
  const [next, setNext] = useState(1);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedSec, setFinishedSec] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const { vibrate } = useVibration();

  const total = size * size;

  useEffect(() => {
    if (startedAt === null || finishedSec !== null) return;
    tickRef.current = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [startedAt, finishedSec]);

  const reset = useCallback(
    (s: Size = size as Size) => {
      setBoard(shuffled(s * s));
      setNext(1);
      setStartedAt(null);
      setFinishedSec(null);
      setTick(0);
    },
    [size],
  );

  const changeSize = (s: Size) => {
    setSize(s);
    setBoard(shuffled(s * s));
    setNext(1);
    setStartedAt(null);
    setFinishedSec(null);
    setTick(0);
  };

  const handlePress = (value: number) => {
    if (finishedSec !== null) return;
    if (value !== next) {
      vibrate([60, 30, 60]);
      return;
    }
    vibrate(15);
    if (startedAt === null) setStartedAt(performance.now());
    if (value === total) {
      const start = startedAt ?? performance.now();
      const sec = Math.max(1, Math.round((performance.now() - start) / 1000));
      setFinishedSec(sec);
      const key = String(size);
      const prev = bestMap[key];
      if (prev === undefined || sec < prev) {
        setBestMap({ ...bestMap, [key]: sec });
      }
      setAnnounce(`Fertig in ${sec} Sekunden`);
    } else {
      setNext(value + 1);
    }
  };

  const elapsed = useMemo(() => {
    if (finishedSec !== null) return finishedSec;
    if (startedAt === null) return 0;
    void tick;
    return Math.floor((performance.now() - startedAt) / 1000);
  }, [tick, startedAt, finishedSec]);

  const best = bestMap[String(size)];

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Größe:</span>
          <select
            value={size}
            onChange={(e) => changeSize(Number(e.target.value) as Size)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}×{s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Nächste: <span className="font-semibold tabular-nums">{next}</span>
        </div>
        <div className="text-center">
          Zeit: <span className="font-semibold tabular-nums">{formatDuration(elapsed)}</span>
        </div>
        <div className="text-right">
          {best !== undefined ? (
            <>
              Best: <span className="font-semibold tabular-nums">{formatDuration(best)}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div
        className="grid w-full max-w-md gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Schulte-Tabelle ${size} mal ${size}`}
      >
        {board.map((value, i) => {
          const done = value < next;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePress(value)}
              disabled={finishedSec !== null}
              aria-label={`Zahl ${value}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-base font-bold tabular-nums sm:text-xl md:text-2xl ${
                done
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-white text-slate-800 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="min-h-12 w-full max-w-md rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        {finishedSec !== null ? 'Nochmal spielen' : 'Neu mischen'}
      </button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe die Zahlen in aufsteigender Reihenfolge von 1 bis {total} so schnell wie möglich.
      </p>
    </div>
  );
}
