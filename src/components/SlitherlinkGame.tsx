import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type SlitherlinkSize, SlitherlinkSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SIZES: readonly SlitherlinkSize[] = [4, 5, 6];

type EdgeState = 0 | 1 | 2; // 0 empty, 1 line, 2 X

interface Puzzle {
  n: number;
  clues: number[][]; // -1 = no clue
  hEdges: EdgeState[][]; // (n+1) rows × n cols
  vEdges: EdgeState[][]; // n rows × (n+1) cols
}

function generate(n: number): Puzzle {
  const solH: number[][] = Array.from({ length: n + 1 }, () => Array<number>(n).fill(0));
  const solV: number[][] = Array.from({ length: n }, () => Array<number>(n + 1).fill(0));
  const r1 = Math.floor(Math.random() * (n - 1));
  const c1 = Math.floor(Math.random() * (n - 1));
  const r2 = Math.min(n, r1 + 2 + Math.floor(Math.random() * Math.max(1, n - r1 - 2)));
  const c2 = Math.min(n, c1 + 2 + Math.floor(Math.random() * Math.max(1, n - c1 - 2)));
  for (let c = c1; c < c2; c++) {
    solH[r1]![c] = 1;
    solH[r2]![c] = 1;
  }
  for (let r = r1; r < r2; r++) {
    solV[r]![c1] = 1;
    solV[r]![c2] = 1;
  }
  const clues: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(-1));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let count = 0;
      if (solH[r]?.[c]) count++;
      if (solH[r + 1]?.[c]) count++;
      if (solV[r]?.[c]) count++;
      if (solV[r]?.[c + 1]) count++;
      if (Math.random() < 0.65) clues[r]![c] = count;
    }
  }
  const hEdges: EdgeState[][] = Array.from({ length: n + 1 }, () => Array<EdgeState>(n).fill(0));
  const vEdges: EdgeState[][] = Array.from({ length: n }, () => Array<EdgeState>(n + 1).fill(0));
  return { n, clues, hEdges, vEdges };
}

function countSides(puzzle: Puzzle, r: number, c: number): number {
  let count = 0;
  if (puzzle.hEdges[r]?.[c] === 1) count++;
  if (puzzle.hEdges[r + 1]?.[c] === 1) count++;
  if (puzzle.vEdges[r]?.[c] === 1) count++;
  if (puzzle.vEdges[r]?.[c + 1] === 1) count++;
  return count;
}

function isSolved(puzzle: Puzzle): boolean {
  const { n, clues } = puzzle;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const clue = clues[r]?.[c] ?? -1;
      if (clue >= 0 && countSides(puzzle, r, c) !== clue) return false;
    }
  }
  let lines = 0;
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) if (puzzle.hEdges[r]?.[c] === 1) lines++;
  for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) if (puzzle.vEdges[r]?.[c] === 1) lines++;
  return lines >= 4;
}

export default function SlitherlinkGame() {
  const [size, setSize] = useLocalStorage<SlitherlinkSize>(
    STORAGE_KEYS.SLITHERLINK_SIZE,
    SlitherlinkSizeSchema,
    5,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(size));
  const [announcement, setAnnouncement] = useState(
    'Klicke auf Kanten. Rechtsklick = X (keine Linie).',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: SlitherlinkSize) => {
    setPuzzle(generate(n));
    setAnnouncement('Neues Rätsel.');
  }, []);

  useEffect(() => {
    if (puzzle.n !== size) restart(size);
  }, [size, puzzle.n, restart]);

  const cycleEdge = useCallback(
    (kind: 'h' | 'v', r: number, c: number, toX: boolean) => {
      vibrate(10);
      setPuzzle((p) => {
        const next: Puzzle = {
          ...p,
          hEdges: p.hEdges.map((row) => [...row] as EdgeState[]),
          vEdges: p.vEdges.map((row) => [...row] as EdgeState[]),
        };
        const arr = kind === 'h' ? next.hEdges : next.vEdges;
        const cur = arr[r]?.[c] ?? 0;
        const target: EdgeState = toX ? (cur === 2 ? 0 : 2) : cur === 1 ? 0 : 1;
        arr[r]![c] = target;
        if (isSolved(next)) {
          setAnnouncement('Gelöst! Alle Regeln erfüllt.');
          sfx.win();
          vibrate([60, 40, 120]);
        }
        return next;
      });
    },
    [sfx, vibrate],
  );

  const renderEdge = (kind: 'h' | 'v', r: number, c: number) => {
    const v = (kind === 'h' ? puzzle.hEdges[r]?.[c] : puzzle.vEdges[r]?.[c]) ?? 0;
    const lineCls =
      v === 1 ? 'bg-amber-400' : v === 2 ? 'bg-transparent' : 'bg-slate-700 hover:bg-slate-500';
    return (
      <button
        key={`${kind}-${r}-${c}`}
        type="button"
        onClick={() => cycleEdge(kind, r, c, false)}
        onContextMenu={(e) => {
          e.preventDefault();
          cycleEdge(kind, r, c, true);
        }}
        aria-label={`Kante ${kind === 'h' ? 'waagerecht' : 'senkrecht'} ${r},${c}: ${
          v === 1 ? 'Linie' : v === 2 ? 'X' : 'leer'
        }`}
        className={`relative ${
          kind === 'h' ? 'col-span-1 mx-1 h-1.5' : 'row-span-1 my-1 w-1.5'
        } rounded ${lineCls}`}
        style={kind === 'h' ? { width: '32px' } : { height: '32px' }}
      >
        {v === 2 && (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-slate-400"
          >
            ×
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as SlitherlinkSize;
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
      </div>

      <div
        className="rounded-2xl bg-slate-900 p-3 dark:bg-slate-950"
        role="group"
        aria-label="Slitherlink-Rätsel"
      >
        {Array.from({ length: puzzle.n }).map((_, r) => (
          <div key={`row-${r}`}>
            <div className="flex items-center">
              {Array.from({ length: puzzle.n + 1 }).map((__, c) => (
                <span
                  key={`dot-${r}-${c}`}
                  className="block h-3 w-3 rounded-full bg-amber-500"
                  aria-hidden
                >
                  {c < puzzle.n ? renderEdge('h', r, c) : null}
                </span>
              ))}
            </div>
            <div className="flex items-center">
              {Array.from({ length: puzzle.n + 1 }).map((__, c) => (
                <span key={`v-${r}-${c}`} className="flex flex-col items-center">
                  {renderEdge('v', r, c)}
                  {c < puzzle.n && (
                    <span
                      className="flex h-8 w-8 items-center justify-center text-sm font-bold"
                      aria-hidden
                    >
                      {(() => {
                        const clue = puzzle.clues[r]?.[c] ?? -1;
                        if (clue < 0) return '';
                        const sides = countSides(puzzle, r, c);
                        const color =
                          sides > clue
                            ? 'text-rose-400'
                            : sides === clue
                              ? 'text-emerald-400'
                              : 'text-slate-400';
                        return <span className={color}>{clue}</span>;
                      })()}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center">
          {Array.from({ length: puzzle.n + 1 }).map((__, c) => (
            <span key={`bdot-${c}`} className="block h-3 w-3 rounded-full bg-amber-500" aria-hidden>
              {c < puzzle.n ? renderEdge('h', puzzle.n, c) : null}
            </span>
          ))}
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Klicke auf Kanten zum Zeichnen. Rechtsklick markiert eine Kante als sicher leer (×). Zahlen
        geben an, wie viele der vier Kanten dieser Zelle zur Schleife gehören.
      </p>
    </div>
  );
}
