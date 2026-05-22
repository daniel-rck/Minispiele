import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type FutoshikiSize, FutoshikiSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SIZES: readonly FutoshikiSize[] = [4, 5, 6];

interface Puzzle {
  n: number;
  solution: number[][];
  grid: number[][];
  given: boolean[][];
  ineqH: string[][]; // size n × (n-1) — between columns
  ineqV: string[][]; // size (n-1) × n — between rows
}

function shuffleArr<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
}

function generate(n: number): Puzzle {
  const solution: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const base = Array.from({ length: n }, (_, i) => i + 1);
  for (let r = 0; r < n; r++) {
    const row = solution[r];
    if (!row) continue;
    for (let c = 0; c < n; c++) row[c] = base[(c + r) % n] ?? 0;
  }
  // shuffle rows and columns
  for (let i = 0; i < n * 2; i++) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (Math.random() < 0.5) {
      const ra = solution[a];
      const rb = solution[b];
      if (ra && rb) {
        solution[a] = rb;
        solution[b] = ra;
      }
    } else {
      for (let r = 0; r < n; r++) {
        const row = solution[r];
        if (!row) continue;
        const va = row[a];
        const vb = row[b];
        if (va !== undefined && vb !== undefined) {
          row[a] = vb;
          row[b] = va;
        }
      }
    }
  }
  const ineqH: string[][] = Array.from({ length: n }, () => Array<string>(n - 1).fill(''));
  const ineqV: string[][] = Array.from({ length: n - 1 }, () => Array<string>(n).fill(''));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 1; c++) {
      const row = ineqH[r];
      const v1 = solution[r]?.[c];
      const v2 = solution[r]?.[c + 1];
      if (row && v1 !== undefined && v2 !== undefined && Math.random() < 0.4) {
        row[c] = v1 < v2 ? '<' : '>';
      }
    }
  }
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n; c++) {
      const row = ineqV[r];
      const v1 = solution[r]?.[c];
      const v2 = solution[r + 1]?.[c];
      if (row && v1 !== undefined && v2 !== undefined && Math.random() < 0.4) {
        row[c] = v1 < v2 ? '∧' : '∨';
      }
    }
  }
  const grid: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const given: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const cells: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  shuffleArr(cells);
  const reveals = Math.floor(n * n * 0.25);
  for (let i = 0; i < reveals && i < cells.length; i++) {
    const pair = cells[i];
    if (!pair) continue;
    const [r, c] = pair;
    const grow = grid[r];
    const giv = given[r];
    const sv = solution[r]?.[c];
    if (grow && giv && sv !== undefined) {
      grow[c] = sv;
      giv[c] = true;
    }
  }
  return { n, solution, grid, given, ineqH, ineqV };
}

function isSolved(puzzle: Puzzle): boolean {
  for (let r = 0; r < puzzle.n; r++) {
    for (let c = 0; c < puzzle.n; c++) {
      if (puzzle.grid[r]?.[c] !== puzzle.solution[r]?.[c]) return false;
    }
  }
  return true;
}

export default function FutoshikiGame() {
  const [size, setSize] = useLocalStorage<FutoshikiSize>(
    STORAGE_KEYS.FUTOSHIKI_SIZE,
    FutoshikiSizeSchema,
    5,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(size));
  const [active, setActive] = useState<[number, number] | null>(null);
  const [announcement, setAnnouncement] = useState('Fülle das Gitter mit den Zahlen 1 bis N.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: FutoshikiSize) => {
    setPuzzle(generate(n));
    setActive(null);
    setAnnouncement(`Neues ${n}×${n}-Rätsel.`);
  }, []);

  useEffect(() => {
    setPuzzle((prev) => (prev.n === size ? prev : generate(size)));
  }, [size]);

  const setCell = useCallback(
    (value: number) => {
      if (!active) return;
      const [r, c] = active;
      if (puzzle.given[r]?.[c]) return;
      vibrate(15);
      setPuzzle((p) => {
        const grid = p.grid.map((row) => [...row]);
        const row = grid[r];
        if (!row) return p;
        row[c] = value;
        return { ...p, grid };
      });
    },
    [active, puzzle.given, vibrate],
  );

  const check = useCallback(() => {
    if (isSolved(puzzle)) {
      sfx.win();
      vibrate([60, 40, 120]);
      setAnnouncement('Gelöst! Perfekt.');
    } else {
      sfx.error();
      vibrate(40);
      setAnnouncement('Noch nicht korrekt. Prüfe die Regeln.');
    }
  }, [puzzle, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as FutoshikiSize;
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
        <Button variant="ghost" size="sm" onClick={check}>
          Prüfen
        </Button>
      </div>

      <div
        className="grid items-center justify-center gap-[1px] rounded-2xl bg-surface-200 p-2 dark:bg-surface-800"
        role="group"
        aria-label="Futoshiki-Spielfeld"
        style={{
          gridTemplateColumns: Array.from({ length: puzzle.n * 2 - 1 }, (_, i) =>
            i % 2 === 0 ? '44px' : '18px',
          ).join(' '),
        }}
      >
        {Array.from({ length: puzzle.n }).flatMap((_, r) => {
          const rowCells: React.ReactNode[] = [];
          for (let c = 0; c < puzzle.n; c++) {
            const value = puzzle.grid[r]?.[c] ?? 0;
            const isGiven = puzzle.given[r]?.[c] === true;
            const isActive = active?.[0] === r && active?.[1] === c;
            rowCells.push(
              <button
                key={`cell-${r}-${c}`}
                type="button"
                onClick={() => setActive([r, c])}
                disabled={isGiven}
                aria-label={`Zelle Zeile ${r + 1} Spalte ${c + 1}${value ? `: ${value}` : ''}`}
                className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-md text-base font-bold ${
                  isGiven
                    ? 'bg-surface-300 text-surface-700 dark:bg-surface-700 dark:text-surface-100'
                    : isActive
                      ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-500 dark:bg-amber-900/50 dark:text-amber-100'
                      : 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100'
                }`}
              >
                {value || ''}
              </button>,
            );
            if (c < puzzle.n - 1) {
              const ch = puzzle.ineqH[r]?.[c] ?? '';
              rowCells.push(
                <span
                  key={`ih-${r}-${c}`}
                  aria-hidden
                  className="text-center text-sm font-bold text-amber-600 dark:text-amber-400"
                >
                  {ch}
                </span>,
              );
            }
          }
          if (r < puzzle.n - 1) {
            for (let c = 0; c < puzzle.n; c++) {
              const ch = puzzle.ineqV[r]?.[c] ?? '';
              rowCells.push(
                <span
                  key={`iv-${r}-${c}`}
                  aria-hidden
                  className="flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-400"
                >
                  {ch}
                </span>,
              );
              if (c < puzzle.n - 1) {
                rowCells.push(<span key={`sp-${r}-${c}`} aria-hidden />);
              }
            }
          }
          return rowCells;
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: puzzle.n }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCell(i + 1)}
            disabled={!active}
            aria-label={`Zahl ${i + 1}`}
            className="min-h-12 min-w-12 rounded-xl bg-surface-100 px-3 text-lg font-bold disabled:opacity-50 dark:bg-surface-800"
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCell(0)}
          disabled={!active}
          aria-label="Zelle leeren"
          className="min-h-12 min-w-12 rounded-xl bg-surface-100 px-3 text-lg font-bold disabled:opacity-50 dark:bg-surface-800"
        >
          ×
        </button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Latein-Quadrat: Jede Zahl 1..N kommt pro Zeile und Spalte genau einmal vor. Die Pfeile
        zwischen Zellen zeigen, welche Zahl größer sein muss.
      </p>
    </div>
  );
}
