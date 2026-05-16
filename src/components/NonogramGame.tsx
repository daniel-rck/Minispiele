import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generate, isSolved, type Cell, type Nonogram } from '../lib/nonogram';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { NonogramBestSchema, NonogramSizeSchema } from '../lib/persistedSchemas';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import BottomSheet from './BottomSheet';
import AriaLive from './AriaLive';

const SIZES = [5, 7, 10] as const;

export default function NonogramGame() {
  const [size, setSize] = useLocalStorage<number>(
    STORAGE_KEYS.NONOGRAM_SIZE,
    NonogramSizeSchema,
    5,
  );
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.NONOGRAM_BEST,
    NonogramBestSchema,
    {},
  );
  const [puzzle, setPuzzle] = useState<Nonogram>(() => generate(size));
  const [cells, setCells] = useState<Cell[]>(() => new Array(size * size).fill(0));
  const [mode, setMode] = useState<'fill' | 'mark'>('fill');
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timer = useGameTimer();
  const startedRef = useRef(false);
  const wonRef = useRef(false);
  const { vibrate } = useVibration();
  useWakeLock(timer.status === 'running');

  const solved = useMemo(() => isSolved(puzzle, cells), [puzzle, cells]);

  useEffect(() => {
    if (timer.status === 'idle' && !startedRef.current) {
      timer.start();
      startedRef.current = true;
    }
  }, [timer]);

  useEffect(() => {
    if (solved && !wonRef.current) {
      wonRef.current = true;
      timer.stop();
      const sec = timer.elapsedSeconds;
      const key = String(puzzle.size);
      const prev = bestMap[key];
      if (prev === undefined || sec < prev) {
        setBestMap({ ...bestMap, [key]: sec });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Gelöst in ${formatDuration(sec)}`);
      vibrate([40, 30, 60]);
    }
  }, [solved, timer, bestMap, puzzle.size, setBestMap, vibrate]);

  const restart = useCallback(
    (nextSize: number = size) => {
      const p = generate(nextSize);
      setPuzzle(p);
      setCells(new Array(nextSize * nextSize).fill(0));
      setWinOpen(false);
      setScoreIsNew(false);
      startedRef.current = false;
      wonRef.current = false;
      timer.reset();
      timer.start();
      startedRef.current = true;
    },
    [size, timer],
  );

  const changeSize = (s: number) => {
    setSize(s);
    restart(s);
  };

  const handleCell = (idx: number) => {
    if (solved) return;
    setCells((prev) => {
      const next = prev.slice();
      const c = next[idx]!;
      if (mode === 'fill') {
        next[idx] = c === 1 ? 0 : 1;
      } else {
        next[idx] = c === 2 ? 0 : 2;
      }
      return next;
    });
    vibrate(10);
  };

  const maxRowHints = Math.max(...puzzle.rowHints.map((h) => h.length));
  const maxColHints = Math.max(...puzzle.colHints.map((h) => h.length));

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Größe:</span>
          <select
            value={puzzle.size}
            onChange={(e) => changeSize(Number(e.target.value))}
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

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Zeit:{' '}
          <span className="font-semibold tabular-nums">{formatDuration(timer.elapsedSeconds)}</span>
        </div>
        <div className="text-right">
          {bestMap[String(puzzle.size)] !== undefined ? (
            <>
              Best:{' '}
              <span className="font-semibold tabular-nums">
                {formatDuration(bestMap[String(puzzle.size)]!)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div className="w-full max-w-md overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${maxRowHints}fr repeat(${puzzle.size}, 1fr)`,
            gridTemplateRows: `${maxColHints}fr repeat(${puzzle.size}, 1fr)`,
            gap: '2px',
          }}
        >
          <div />
          {puzzle.colHints.map((hints, c) => (
            <div
              key={`ch-${c}`}
              className="flex aspect-square min-w-[24px] flex-col items-center justify-end pb-1 text-[10px] font-bold text-slate-700 sm:text-xs dark:text-slate-200"
            >
              {hints.map((h, i) => (
                <span key={i}>{h}</span>
              ))}
            </div>
          ))}
          {puzzle.rowHints.map((hints, r) => (
            <Fragment key={`row-${r}`}>
              <div className="flex aspect-square min-w-[24px] items-center justify-end gap-1 pr-1 text-[10px] font-bold text-slate-700 sm:text-xs dark:text-slate-200">
                {hints.map((h, i) => (
                  <span key={i}>{h}</span>
                ))}
              </div>
              {Array.from({ length: puzzle.size }, (_, c) => {
                const idx = r * puzzle.size + c;
                const cell = cells[idx]!;
                const thickRight =
                  c % 5 === 4 && c !== puzzle.size - 1
                    ? 'border-r-2 border-slate-700 dark:border-slate-300'
                    : '';
                const thickBottom =
                  r % 5 === 4 && r !== puzzle.size - 1
                    ? 'border-b-2 border-slate-700 dark:border-slate-300'
                    : '';
                return (
                  <button
                    key={`c-${idx}`}
                    type="button"
                    onClick={() => handleCell(idx)}
                    aria-label={`Zelle Zeile ${r + 1} Spalte ${c + 1}, ${
                      cell === 1 ? 'gefüllt' : cell === 2 ? 'markiert' : 'leer'
                    }`}
                    className={`aspect-square min-w-[24px] border border-slate-300 dark:border-slate-700 ${thickRight} ${thickBottom} ${
                      cell === 1
                        ? 'bg-slate-900 dark:bg-slate-100'
                        : cell === 2
                          ? 'bg-white text-red-500 dark:bg-slate-900'
                          : 'bg-white hover:bg-brand-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cell === 2 ? <span aria-hidden>✕</span> : null}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'fill' ? 'mark' : 'fill'))}
          aria-pressed={mode === 'mark'}
          className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-medium ${
            mode === 'fill'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-amber-500 text-white'
          }`}
        >
          {mode === 'fill' ? '◼ Füllen' : '✕ Markieren'}
        </button>
        <button
          type="button"
          onClick={() => restart()}
          className="min-h-12 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          Neues Rätsel
        </button>
      </div>

      <BottomSheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🖼️
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Rätsel gelöst in {formatDuration(timer.elapsedSeconds)}.
          </p>
          <button
            type="button"
            onClick={() => restart()}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Neues Rätsel
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
