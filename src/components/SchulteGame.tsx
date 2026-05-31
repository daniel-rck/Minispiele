import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { SchulteBestSchema, SchulteSizeSchema } from '../lib/persistedSchemas';
import {
  createInitialState,
  pressNumber,
  SCHULTE_SIZES,
  type SchulteSize,
  type SchulteState,
} from '../lib/schulte';
import { useGameSfx } from '../lib/useGameSfx';
import { formatDuration } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

export default function SchulteGame() {
  const [size, setSize] = useLocalStorage<number>(STORAGE_KEYS.SCHULTE_SIZE, SchulteSizeSchema, 5);
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.SCHULTE_BEST,
    SchulteBestSchema,
    {},
  );
  const [game, setGame] = useState<SchulteState>(() => createInitialState(size));
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedSec, setFinishedSec] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const board = game.board;
  const next = game.next;
  const total = game.total;

  useEffect(() => {
    if (startedAt === null || finishedSec !== null) return;
    tickRef.current = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [startedAt, finishedSec]);

  const reset = useCallback(
    (s: SchulteSize = size as SchulteSize) => {
      setGame(createInitialState(s));
      setStartedAt(null);
      setFinishedSec(null);
      setTick(0);
    },
    [size],
  );

  const changeSize = (s: SchulteSize) => {
    setSize(s);
    setGame(createInitialState(s));
    setStartedAt(null);
    setFinishedSec(null);
    setTick(0);
  };

  const handlePress = (value: number) => {
    if (finishedSec !== null) return;
    if (value !== next) {
      vibrate([60, 30, 60]);
      sfx.error();
      return;
    }
    vibrate(15);
    const start = startedAt ?? performance.now();
    if (startedAt === null) setStartedAt(start);
    const nextGame = pressNumber(game, value);
    setGame(nextGame);
    if (nextGame.done) {
      const sec = Math.max(1, Math.round((performance.now() - start) / 1000));
      setFinishedSec(sec);
      const key = String(size);
      const prev = bestMap[key];
      if (prev === undefined || sec < prev) {
        setBestMap({ ...bestMap, [key]: sec });
      }
      setAnnounce(`Fertig in ${sec} Sekunden`);
      sfx.win();
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
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Größe:</span>
          <select
            value={size}
            onChange={(e) => changeSize(Number(e.target.value) as SchulteSize)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {SCHULTE_SIZES.map((s) => (
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

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="grid fit-box gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          role="group"
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
      </div>

      <Button variant="primary" block className="max-w-md" onClick={() => reset()}>
        {finishedSec !== null ? 'Nochmal spielen' : 'Neu mischen'}
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe die Zahlen in aufsteigender Reihenfolge von 1 bis {total} so schnell wie möglich.
      </p>
    </div>
  );
}
