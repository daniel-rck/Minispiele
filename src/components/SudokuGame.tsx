import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SUDOKU_SIZE,
  conflictsAt,
  generatePuzzle,
  isComplete,
  type SudokuCell,
  type SudokuDifficulty,
} from '../lib/sudoku';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { SudokuBestSchema, SudokuDifficultySchema } from '../lib/persistedSchemas';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import Sheet from './ui/Sheet';
import AriaLive from './AriaLive';

const LABELS: Record<SudokuDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

interface GameSnapshot {
  cells: SudokuCell[];
  solution: number[];
  difficulty: SudokuDifficulty;
}

function buildPuzzle(diff: SudokuDifficulty): GameSnapshot {
  const p = generatePuzzle(diff);
  return { cells: p.cells, solution: p.solution, difficulty: p.difficulty };
}

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useLocalStorage<SudokuDifficulty>(
    STORAGE_KEYS.SUDOKU_DIFFICULTY,
    SudokuDifficultySchema,
    'easy',
  );
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.SUDOKU_BEST,
    SudokuBestSchema,
    {},
  );
  const [game, setGame] = useState<GameSnapshot>(() => buildPuzzle(difficulty));
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timer = useGameTimer();
  const startedRef = useRef(false);
  const wonRef = useRef(false);
  const { vibrate } = useVibration();
  useWakeLock(timer.status === 'running');

  useEffect(() => {
    if (timer.status === 'idle' && !startedRef.current) {
      timer.start();
      startedRef.current = true;
    }
  }, [timer]);

  const won = useMemo(() => isComplete(game.cells, game.solution), [game]);

  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      timer.stop();
      const sec = timer.elapsedSeconds;
      const prev = bestMap[game.difficulty];
      if (prev === undefined || sec < prev) {
        setBestMap({ ...bestMap, [game.difficulty]: sec });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Sudoku gelöst in ${formatDuration(sec)}`);
      vibrate([40, 30, 60]);
    }
  }, [won, timer, bestMap, game.difficulty, setBestMap, vibrate]);

  const restart = useCallback(
    (d: SudokuDifficulty = difficulty) => {
      setGame(buildPuzzle(d));
      setSelected(null);
      setNotesMode(false);
      setWinOpen(false);
      setScoreIsNew(false);
      startedRef.current = false;
      wonRef.current = false;
      timer.reset();
      timer.start();
      startedRef.current = true;
    },
    [difficulty, timer],
  );

  const changeDifficulty = (d: SudokuDifficulty) => {
    setDifficulty(d);
    restart(d);
  };

  const setValue = (idx: number, value: number) => {
    setGame((g) => {
      const cell = g.cells[idx];
      if (!cell || cell.given) return g;
      const cells = g.cells.slice();
      if (notesMode && value !== 0) {
        const has = cell.notes.includes(value);
        cells[idx] = {
          ...cell,
          notes: has ? cell.notes.filter((v) => v !== value) : [...cell.notes, value].sort(),
        };
      } else {
        cells[idx] = { ...cell, value, notes: [] };
      }
      return { ...g, cells };
    });
  };

  const handleCellPress = (idx: number) => {
    setSelected(idx);
    vibrate(10);
  };

  const handlePad = (n: number) => {
    if (selected === null) return;
    setValue(selected, n);
    vibrate(15);
  };

  const handleErase = () => {
    if (selected === null) return;
    setValue(selected, 0);
  };

  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected === null) return;
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        setValueRef.current(selected, Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        setValueRef.current(selected, 0);
      } else if (e.key === 'ArrowRight') {
        setSelected(Math.min(80, selected + 1));
      } else if (e.key === 'ArrowLeft') {
        setSelected(Math.max(0, selected - 1));
      } else if (e.key === 'ArrowDown') {
        setSelected(Math.min(80, selected + 9));
      } else if (e.key === 'ArrowUp') {
        setSelected(Math.max(0, selected - 9));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const best = bestMap[game.difficulty];
  const selectedValue = selected !== null ? (game.cells[selected]?.value ?? 0) : 0;

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={game.difficulty}
            onChange={(e) => changeDifficulty(e.target.value as SudokuDifficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(LABELS) as SudokuDifficulty[]).map((d) => (
              <option key={d} value={d}>
                {LABELS[d]}
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
        className="grid w-full max-w-md gap-px overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-700 dark:border-slate-500 dark:bg-slate-500"
        style={{ gridTemplateColumns: `repeat(${SUDOKU_SIZE}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Sudoku-Gitter"
      >
        {game.cells.map((cell, idx) => {
          const row = Math.floor(idx / SUDOKU_SIZE);
          const col = idx % SUDOKU_SIZE;
          const isSelected = selected === idx;
          const sameValue = selectedValue !== 0 && cell.value === selectedValue;
          const sameRow = selected !== null && Math.floor(selected / SUDOKU_SIZE) === row;
          const sameCol = selected !== null && selected % SUDOKU_SIZE === col;
          const sameBox =
            selected !== null &&
            Math.floor(row / 3) === Math.floor(Math.floor(selected / SUDOKU_SIZE) / 3) &&
            Math.floor(col / 3) === Math.floor((selected % SUDOKU_SIZE) / 3);
          const conflict = conflictsAt(game.cells, idx);
          const borderRight = col % 3 === 2 && col !== SUDOKU_SIZE - 1 ? 'mr-[1px]' : '';
          const borderBottom = row % 3 === 2 && row !== SUDOKU_SIZE - 1 ? 'mb-[1px]' : '';
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCellPress(idx)}
              aria-label={`Zeile ${row + 1} Spalte ${col + 1}, ${cell.value === 0 ? 'leer' : cell.value}`}
              className={`relative aspect-square text-base font-semibold tabular-nums sm:text-lg ${borderRight} ${borderBottom} ${
                isSelected
                  ? 'bg-brand-200 dark:bg-brand-900/60'
                  : sameValue
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : sameRow || sameCol || sameBox
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'bg-white dark:bg-slate-900'
              } ${cell.given ? 'text-slate-900 dark:text-slate-100' : 'text-brand-700 dark:text-brand-300'} ${
                conflict ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {cell.value !== 0 ? (
                cell.value
              ) : cell.notes.length > 0 ? (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 p-[1px] text-[8px] leading-tight text-slate-500 sm:text-[10px] dark:text-slate-400">
                  {Array.from({ length: 9 }, (_, n) => (
                    <span key={n} className="flex items-center justify-center">
                      {cell.notes.includes(n + 1) ? n + 1 : ''}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className="grid w-full max-w-md grid-cols-9 gap-1"
        role="group"
        aria-label="Zahlentastatur"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handlePad(n)}
            className="min-h-11 rounded-lg bg-white text-base font-semibold tabular-nums shadow-sm hover:bg-brand-50 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={() => setNotesMode((m) => !m)}
          aria-pressed={notesMode}
          className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-medium ${
            notesMode
              ? 'bg-amber-500 text-white'
              : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          Notizen
        </button>
        <button
          type="button"
          onClick={handleErase}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Löschen
        </button>
        <button
          type="button"
          onClick={() => restart()}
          className="min-h-12 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          Neu
        </button>
      </div>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🧩
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Gelöst in {formatDuration(timer.elapsedSeconds)}.
          </p>
          <button
            type="button"
            onClick={() => restart()}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Neues Sudoku
          </button>
        </div>
      </Sheet>
    </div>
  );
}
