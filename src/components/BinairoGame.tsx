import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type BinairoSize, BinairoSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

type Cell = -1 | 0 | 1;
type Board = Cell[][];

const SIZES: readonly BinairoSize[] = [6, 8, 10];

function isValidPartial(grid: Board, r: number, c: number, n: number): boolean {
  const v = grid[r]?.[c];
  if (v === undefined || v < 0) return true;
  if (c >= 2 && grid[r]?.[c - 1] === v && grid[r]?.[c - 2] === v) return false;
  if (r >= 2 && grid[r - 1]?.[c] === v && grid[r - 2]?.[c] === v) return false;
  const row = grid[r];
  if (!row) return false;
  let rowCount = 0;
  for (const cell of row) if (cell === v) rowCount++;
  if (rowCount > n / 2) return false;
  let colCount = 0;
  for (let i = 0; i < n; i++) if (grid[i]?.[c] === v) colCount++;
  if (colCount > n / 2) return false;
  return true;
}

function fillGrid(solution: Board, n: number, r: number, c: number): boolean {
  if (r >= n) return true;
  const nr = c + 1 >= n ? r + 1 : r;
  const nc = c + 1 >= n ? 0 : c + 1;
  const vals: Cell[] = Math.random() < 0.5 ? [0, 1] : [1, 0];
  for (const v of vals) {
    const row = solution[r];
    if (!row) return false;
    row[c] = v;
    if (isValidPartial(solution, r, c, n) && fillGrid(solution, n, nr, nc)) return true;
    row[c] = -1;
  }
  return false;
}

interface Puzzle {
  solution: Board;
  grid: Board;
  given: boolean[][];
}

function generatePuzzle(n: number): Puzzle {
  const solution: Board = Array.from({ length: n }, () => Array<Cell>(n).fill(-1));
  fillGrid(solution, n, 0, 0);
  const grid: Board = solution.map((row) => [...row]);
  const given = Array.from({ length: n }, () => Array<boolean>(n).fill(true));
  const cells: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = cells[i];
    const b = cells[j];
    if (a && b) {
      cells[i] = b;
      cells[j] = a;
    }
  }
  const toRemove = Math.floor(n * n * 0.55);
  for (let i = 0; i < toRemove && i < cells.length; i++) {
    const pair = cells[i];
    if (!pair) continue;
    const [r, c] = pair;
    const row = grid[r];
    const givenRow = given[r];
    if (row && givenRow) {
      row[c] = -1;
      givenRow[c] = false;
    }
  }
  return { solution, grid, given };
}

function cellEquals(a: Board, b: Board): boolean {
  for (let r = 0; r < a.length; r++) {
    const aRow = a[r];
    const bRow = b[r];
    if (!aRow || !bRow) return false;
    for (let c = 0; c < aRow.length; c++) if (aRow[c] !== bRow[c]) return false;
  }
  return true;
}

export default function BinairoGame() {
  const [size, setSize] = useLocalStorage<BinairoSize>(
    STORAGE_KEYS.BINAIRO_SIZE,
    BinairoSizeSchema,
    8,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(size));
  const [solved, setSolved] = useState(false);
  const [announcement, setAnnouncement] = useState('Klicke: leer → 0 → 1 → leer.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: BinairoSize) => {
    setPuzzle(generatePuzzle(n));
    setSolved(false);
    setAnnouncement(`Neues ${n}×${n}-Rätsel gestartet.`);
  }, []);

  useEffect(() => {
    setPuzzle((prev) => (prev.grid.length === size ? prev : generatePuzzle(size)));
  }, [size]);

  const handleCell = useCallback(
    (r: number, c: number) => {
      if (solved) return;
      if (puzzle.given[r]?.[c]) return;
      vibrate(15);
      setPuzzle((prev) => {
        const next: Board = prev.grid.map((row) => [...row]);
        const row = next[r];
        if (!row) return prev;
        const current = row[c] ?? -1;
        row[c] = (current < 0 ? 0 : current === 0 ? 1 : -1) as Cell;
        return { ...prev, grid: next };
      });
    },
    [puzzle.given, solved, vibrate],
  );

  const checkSolution = useCallback(() => {
    const ok = cellEquals(puzzle.grid, puzzle.solution);
    if (ok) {
      setSolved(true);
      setAnnouncement('Gelöst! Perfekt.');
      sfx.win();
      vibrate([60, 40, 120]);
    } else {
      setAnnouncement('Noch nicht korrekt.');
      sfx.error();
      vibrate(40);
    }
  }, [puzzle.grid, puzzle.solution, sfx, vibrate]);

  // Auto-check when grid filled
  const isFull = useMemo(
    () => puzzle.grid.every((row) => row.every((v) => v !== -1)),
    [puzzle.grid],
  );
  useEffect(() => {
    if (isFull && !solved) checkSolution();
  }, [isFull, solved, checkSolution]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-4 pb-2">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as BinairoSize;
              setSize(next);
              restart(next);
            }}
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n}×{n}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={() => restart(size)}>
          Neues Rätsel
        </Button>
        <Button variant="ghost" size="sm" onClick={checkSolution}>
          Prüfen
        </Button>
      </div>

      <div className="fit-area w-full">
        <div
          className="grid fit-box max-w-md gap-1 rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
          role="group"
          aria-label="Binairo-Rätsel"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {puzzle.grid.flatMap((row, r) =>
            row.map((value, c) => {
              const isGiven = puzzle.given[r]?.[c] === true;
              const base =
                value === 0
                  ? 'bg-sky-500 text-white'
                  : value === 1
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-300';
              const givenRing = isGiven ? 'ring-2 ring-white/30' : '';
              const disabled = isGiven || solved;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCell(r, c)}
                  disabled={disabled}
                  aria-label={
                    isGiven
                      ? `Vorgabe ${value} Zeile ${r + 1} Spalte ${c + 1}`
                      : `Feld Zeile ${r + 1} Spalte ${c + 1}: ${value === -1 ? 'leer' : value}`
                  }
                  className={`flex aspect-square min-h-9 min-w-9 items-center justify-center rounded-full text-base font-bold transition disabled:cursor-not-allowed ${base} ${givenRing}`}
                >
                  {value === -1 ? '' : value}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Höchstens zwei gleiche Ziffern nebeneinander. Jede Zeile und Spalte enthält gleich viele 0en
        und 1en.
      </p>
    </div>
  );
}
