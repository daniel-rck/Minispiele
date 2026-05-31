import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import { STORAGE_KEYS } from '../lib/constants';
import {
  SudokuBestSchema,
  SudokuDifficultySchema,
  type SudokuState,
  SudokuStateSchema,
} from '../lib/persistedSchemas';
import {
  conflictsAt,
  generatePuzzle,
  isComplete,
  SUDOKU_SIZE,
  type SudokuCell,
  type SudokuDifficulty,
} from '../lib/sudoku';
import { useGameSfx } from '../lib/useGameSfx';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import DifficultySelector from './ui/DifficultySelector';
import Sheet from './ui/Sheet';

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

function snapshotToState(snapshot: GameSnapshot, seconds: number): SudokuState {
  return {
    difficulty: snapshot.difficulty,
    puzzle: snapshot.cells,
    solution: snapshot.solution,
    seconds,
  };
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
  const [savedState, setSavedState] = useLocalStorage<SudokuState>(
    STORAGE_KEYS.SUDOKU_STATE,
    SudokuStateSchema,
    null,
  );

  const restoredOnMount = useRef(savedState);
  const [game, setGame] = useState<GameSnapshot>(() => {
    const s = restoredOnMount.current;
    if (s) {
      return { cells: s.puzzle, solution: s.solution, difficulty: s.difficulty };
    }
    return buildPuzzle(difficulty);
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const timer = useGameTimer(restoredOnMount.current?.seconds ?? 0);
  const startedRef = useRef(false);
  const wonRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();
  useWakeLock(timer.status === 'running');

  const elapsedRef = useRef(timer.elapsedSeconds);
  elapsedRef.current = timer.elapsedSeconds;

  const gameRef = useRef(game);
  gameRef.current = game;
  const wonStateRef = useRef(false);

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
      sfx.win();
      setSavedState(null);
    }
  }, [won, timer, bestMap, game.difficulty, setBestMap, vibrate, sfx, setSavedState]);

  // Persist current snapshot on tab-hide so a refresh/close keeps progress fresh.
  // Stable listener reads latest game + won-state from refs to avoid re-subscribing on every move.
  useEffect(() => {
    wonStateRef.current = won;
  }, [won]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !wonStateRef.current) {
        setSavedState(snapshotToState(gameRef.current, elapsedRef.current));
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [setSavedState]);

  // Clear shake highlight after the wordle-shake animation finishes.
  useEffect(() => {
    if (shakeIdx === null) return;
    const t = window.setTimeout(() => setShakeIdx(null), 320);
    return () => window.clearTimeout(t);
  }, [shakeIdx]);

  const restart = useCallback(
    (d: SudokuDifficulty = difficulty) => {
      const fresh = buildPuzzle(d);
      setGame(fresh);
      setSelected(null);
      setNotesMode(false);
      setWinOpen(false);
      setScoreIsNew(false);
      setShakeIdx(null);
      startedRef.current = false;
      wonRef.current = false;
      timer.reset();
      timer.start();
      startedRef.current = true;
      elapsedRef.current = 0;
      setSavedState(snapshotToState(fresh, 0));
    },
    [difficulty, timer, setSavedState],
  );

  const changeDifficulty = (d: SudokuDifficulty) => {
    setDifficulty(d);
    restart(d);
  };

  const setValue = useCallback(
    (idx: number, value: number) => {
      const cell = game.cells[idx];
      if (!cell || cell.given) return;
      const cells = game.cells.slice();
      if (notesMode && value !== 0) {
        const has = cell.notes.includes(value);
        cells[idx] = {
          ...cell,
          notes: has ? cell.notes.filter((v) => v !== value) : [...cell.notes, value].sort(),
        };
      } else {
        cells[idx] = { ...cell, value, notes: [] };
      }
      const next: GameSnapshot = { ...game, cells };
      setGame(next);
      setSavedState(snapshotToState(next, elapsedRef.current));
      if (!notesMode && value !== 0 && conflictsAt(cells, idx)) {
        setShakeIdx(idx);
        vibrate([40, 60, 40]);
        sfx.error();
      }
    },
    [game, notesMode, setSavedState, vibrate, sfx],
  );

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
      if (helpOpen || winOpen) return; // Sheet handles its own keyboard while open
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setNotesMode((m) => !m);
        return;
      }
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
  }, [selected, helpOpen, winOpen]);

  const handleShare = async () => {
    const sec = timer.elapsedSeconds;
    const text = `Sudoku (${LABELS[game.difficulty]}) gelöst in ${formatDuration(sec)} 🧩`;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Minispiele · Sudoku', text });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setAnnounce('Ergebnis in die Zwischenablage kopiert');
      }
    } catch {
      // user cancelled the share sheet, or unsupported — silent.
    }
  };

  const best = bestMap[game.difficulty];
  const selectedValue = selected !== null ? (game.cells[selected]?.value ?? 0) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <DifficultySelector<SudokuDifficulty>
          value={game.difficulty}
          options={LABELS}
          onChange={changeDifficulty}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHelpOpen(true)}
          aria-label="Spielregeln anzeigen"
          className="min-h-11 min-w-11 px-3"
        >
          <span aria-hidden className="text-lg">
            ?
          </span>
        </Button>
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

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="grid fit-box gap-px overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-700 dark:border-slate-500 dark:bg-slate-500"
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
                aria-label={`Zeile ${row + 1} Spalte ${col + 1}, ${cell.value === 0 ? 'leer' : cell.value}${conflict ? ', Konflikt' : ''}`}
                aria-invalid={conflict || undefined}
                className={`relative aspect-square text-base font-semibold tabular-nums transition-colors duration-150 sm:text-lg ${borderRight} ${borderBottom} ${
                  isSelected
                    ? 'bg-brand-200 dark:bg-brand-900/60'
                    : sameValue
                      ? 'bg-[var(--color-warning-100)] dark:bg-[var(--color-warning-900)]/40'
                      : sameRow || sameCol || sameBox
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'bg-white dark:bg-slate-900'
                } ${cell.given ? 'text-slate-900 dark:text-slate-100' : 'text-brand-700 dark:text-brand-300'} ${
                  conflict
                    ? 'text-[var(--color-danger-600)] underline decoration-2 underline-offset-2 dark:text-[var(--color-danger-400)]'
                    : ''
                } ${shakeIdx === idx ? 'wordle-shake' : ''}`}
              >
                {cell.value !== 0 ? (
                  <>
                    {cell.value}
                    {conflict && (
                      <span
                        aria-hidden
                        className="absolute top-0 right-0.5 text-[8px] leading-none text-[var(--color-danger-600)] sm:text-[10px] dark:text-[var(--color-danger-400)]"
                      >
                        ⚠
                      </span>
                    )}
                  </>
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
      </div>

      <div
        className="grid w-full max-w-md grid-cols-5 gap-1 sm:grid-cols-9"
        role="group"
        aria-label="Zahlentastatur"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handlePad(n)}
            className="min-h-11 min-w-11 rounded-lg bg-white text-base font-semibold tabular-nums shadow-sm transition-colors hover:bg-brand-50 active:scale-95 dark:bg-slate-900 dark:hover:bg-slate-800"
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
          aria-keyshortcuts="n"
          className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-medium transition-colors ${
            notesMode
              ? 'bg-[var(--color-warning-500)] text-white'
              : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          Notizen
        </button>
        <button
          type="button"
          onClick={handleErase}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Löschen
        </button>
        <Button variant="primary" className="flex-1" onClick={() => restart()}>
          Neu
        </Button>
      </div>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div
            key={`win-${timer.elapsedSeconds}`}
            className="mb-2 inline-block text-4xl star-pop"
            aria-hidden
          >
            🧩
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-[var(--color-warning-100)] px-3 py-1 text-xs font-medium text-[var(--color-warning-800)] star-pop dark:bg-[var(--color-warning-900)]/40 dark:text-[var(--color-warning-200)]">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Gelöst in {formatDuration(timer.elapsedSeconds)}.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="primary" block onClick={() => restart()}>
              Neues Sudoku
            </Button>
            <Button variant="ghost" block onClick={handleShare}>
              Ergebnis teilen
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Wie spielt man?">
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p>
            <strong>Ziel:</strong> Fülle das 9×9-Gitter so, dass jede Ziffer 1 – 9 in jeder Zeile,
            Spalte und jedem 3×3-Block genau einmal vorkommt.
          </p>
          <p>
            <strong>Steuerung:</strong> Tippe oder klicke eine Zelle an, dann wähle eine Ziffer über
            die Zahlenleiste, per Tastatur (1 – 9) oder mit den Pfeiltasten zum Navigieren. Mit
            Backspace, Delete oder „Löschen" entfernst du eine Ziffer.
          </p>
          <p>
            <strong>Notizen:</strong> Wechsle mit „Notizen" (oder Taste{' '}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-slate-800">
              N
            </kbd>
            ) in den Notiz-Modus. Eingegebene Ziffern landen dann als kleine Hinweise in der Zelle,
            statt als finaler Wert.
          </p>
          <div>
            <strong>Markierungen:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>
                Die ausgewählte Zelle ist <span className="font-semibold">türkis</span> hinterlegt.
              </li>
              <li>
                Zellen mit derselben Ziffer wie die Auswahl sind{' '}
                <span className="font-semibold text-[var(--color-warning-700)] dark:text-[var(--color-warning-400)]">
                  gelb
                </span>{' '}
                markiert.
              </li>
              <li>Zeile, Spalte und 3×3-Block der Auswahl sind dezent grau betont.</li>
              <li>
                Konflikte zeigen sich{' '}
                <span className="font-semibold text-[var(--color-danger-600)] dark:text-[var(--color-danger-400)]">
                  rot ⚠
                </span>{' '}
                und kurz wackelnd — dann steht die Ziffer schon woanders in Zeile, Spalte oder
                Block.
              </li>
            </ul>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
