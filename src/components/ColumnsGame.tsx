import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { ColumnsBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const COLS = 6;
const ROWS = 13;
const COLOR_COUNT = 6;
const COLORS: readonly string[] = [
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-violet-500',
  'bg-orange-500',
];

type Cell = number; // -1 empty, 0..5 color index

interface Piece {
  col: number;
  row: number;
  colors: [number, number, number];
}

function emptyGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(-1));
}

function randomPiece(centerCol: number): Piece {
  return {
    col: centerCol,
    row: 0,
    colors: [
      Math.floor(Math.random() * COLOR_COUNT),
      Math.floor(Math.random() * COLOR_COUNT),
      Math.floor(Math.random() * COLOR_COUNT),
    ],
  };
}

function canMove(grid: readonly Cell[][], r: number, c: number): boolean {
  for (let i = 0; i < 3; i++) {
    if (r + i >= ROWS || c < 0 || c >= COLS) return false;
    const row = grid[r + i];
    if (!row) continue;
    if (r + i >= 0 && (row[c] ?? -1) >= 0) return false;
  }
  return true;
}

function lockPiece(grid: Cell[][], piece: Piece): void {
  for (let i = 0; i < 3; i++) {
    const r = piece.row + i;
    if (r >= 0 && r < ROWS) {
      const row = grid[r];
      const color = piece.colors[i];
      if (row && color !== undefined) row[piece.col] = color;
    }
  }
}

function removeMatches(grid: Cell[][]): number {
  let totalRemoved = 0;
  let removed = true;
  while (removed) {
    removed = false;
    const toRemove = new Set<number>(); // r * COLS + c
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      const row = grid[r];
      if (!row) continue;
      for (let c = 0; c < COLS - 2; c++) {
        const v = row[c];
        if (v !== undefined && v >= 0 && v === row[c + 1] && v === row[c + 2]) {
          let end = c + 2;
          while (end + 1 < COLS && row[end + 1] === v) end++;
          for (let i = c; i <= end; i++) toRemove.add(r * COLS + i);
        }
      }
    }
    // vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        const v = grid[r]?.[c];
        if (v !== undefined && v >= 0 && v === grid[r + 1]?.[c] && v === grid[r + 2]?.[c]) {
          let end = r + 2;
          while (end + 1 < ROWS && grid[end + 1]?.[c] === v) end++;
          for (let i = r; i <= end; i++) toRemove.add(i * COLS + c);
        }
      }
    }
    // diagonal ↘
    for (let r = 0; r < ROWS - 2; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const v = grid[r]?.[c];
        if (v !== undefined && v >= 0 && v === grid[r + 1]?.[c + 1] && v === grid[r + 2]?.[c + 2]) {
          toRemove.add(r * COLS + c);
          toRemove.add((r + 1) * COLS + (c + 1));
          toRemove.add((r + 2) * COLS + (c + 2));
        }
      }
    }
    // diagonal ↙
    for (let r = 0; r < ROWS - 2; r++) {
      for (let c = 2; c < COLS; c++) {
        const v = grid[r]?.[c];
        if (v !== undefined && v >= 0 && v === grid[r + 1]?.[c - 1] && v === grid[r + 2]?.[c - 2]) {
          toRemove.add(r * COLS + c);
          toRemove.add((r + 1) * COLS + (c - 1));
          toRemove.add((r + 2) * COLS + (c - 2));
        }
      }
    }
    if (toRemove.size > 0) {
      removed = true;
      totalRemoved += toRemove.size;
      for (const key of toRemove) {
        const r = Math.floor(key / COLS);
        const c = key % COLS;
        const row = grid[r];
        if (row) row[c] = -1;
      }
      // gravity
      for (let c = 0; c < COLS; c++) {
        let w = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          const v = grid[r]?.[c];
          if (v !== undefined && v >= 0) {
            const wRow = grid[w];
            const rRow = grid[r];
            if (wRow && rRow) {
              wRow[c] = v;
              if (w !== r) rRow[c] = -1;
            }
            w--;
          }
        }
      }
    }
  }
  return totalRemoved;
}

export default function ColumnsGame() {
  const [grid, setGrid] = useState<Cell[][]>(emptyGrid);
  const [piece, setPiece] = useState<Piece>(() => randomPiece(Math.floor(COLS / 2)));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [announcement, setAnnouncement] = useState('Bereit');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.COLUMNS_BEST, ColumnsBestSchema, 0);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();
  const dropIntervalMs = Math.max(120, 800 - level * 50);
  const tickRef = useRef<number>(0);
  const gridRef = useRef(grid);
  const pieceRef = useRef(piece);
  const overRef = useRef(over);

  gridRef.current = grid;
  pieceRef.current = piece;
  overRef.current = over;

  const dropStep = useCallback(() => {
    if (overRef.current) return;
    const g = gridRef.current.map((row) => [...row]);
    const p = pieceRef.current;
    if (canMove(g, p.row + 1, p.col)) {
      setPiece({ ...p, row: p.row + 1 });
      return;
    }
    // lock
    lockPiece(g, p);
    const removed = removeMatches(g);
    if (removed > 0) {
      sfx.clear();
      vibrate(20);
      setScore((s) => {
        const newScore = s + removed * 10;
        setLevel(Math.floor(newScore / 500) + 1);
        return newScore;
      });
    } else {
      sfx.pop();
    }
    setGrid(g);
    // spawn
    const spawn = randomPiece(Math.floor(COLS / 2));
    const stacked =
      (g[0]?.[spawn.col] ?? -1) >= 0 ||
      (g[1]?.[spawn.col] ?? -1) >= 0 ||
      (g[2]?.[spawn.col] ?? -1) >= 0;
    if (stacked) {
      setOver(true);
      overRef.current = true;
      let sNow = 0;
      setScore((s) => {
        sNow = s;
        return s;
      });
      const newBest = sNow > best;
      if (newBest) setBest(sNow);
      setIsNewBest(newBest);
      setOverOpen(true);
      setAnnouncement(newBest ? `Spiel vorbei. Neue Bestmarke ${sNow}` : 'Spiel vorbei');
      sfx.lose();
      vibrate([120, 60, 120]);
    } else {
      setPiece(spawn);
    }
  }, [best, setBest, sfx, vibrate]);

  useEffect(() => {
    if (over) return;
    tickRef.current = window.setInterval(dropStep, dropIntervalMs);
    return () => window.clearInterval(tickRef.current);
  }, [dropStep, dropIntervalMs, over]);

  const move = useCallback((dc: number) => {
    setPiece((p) => (canMove(gridRef.current, p.row, p.col + dc) ? { ...p, col: p.col + dc } : p));
  }, []);

  const rotate = useCallback(() => {
    setPiece((p) => {
      const [a, b, c] = p.colors;
      return { ...p, colors: [c, a, b] };
    });
  }, []);

  const softDrop = useCallback(() => {
    dropStep();
  }, [dropStep]);

  const restart = useCallback(() => {
    setGrid(emptyGrid());
    setPiece(randomPiece(Math.floor(COLS / 2)));
    setScore(0);
    setLevel(1);
    setOver(false);
    overRef.current = false;
    setOverOpen(false);
    setIsNewBest(false);
    setAnnouncement('Neues Spiel gestartet');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (over) {
        if (e.code === 'Space') restart();
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, rotate, softDrop, restart, over]);

  // visual grid: render cells, overlay piece
  const display = useMemo(() => {
    const g = grid.map((row) => [...row]);
    if (!over) {
      for (let i = 0; i < 3; i++) {
        const r = piece.row + i;
        const color = piece.colors[i];
        if (r >= 0 && r < ROWS && color !== undefined) {
          const row = g[r];
          if (row) row[piece.col] = color;
        }
      }
    }
    return g;
  }, [grid, piece, over]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <div className="text-center">
          Level: <span className="font-semibold tabular-nums">{level}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="grid gap-[2px] rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
        role="group"
        aria-label="Columns-Spielfeld"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          maxWidth: '280px',
          width: '100%',
        }}
      >
        {display.flatMap((row, r) =>
          row.map((value, c) => {
            const color = value >= 0 ? COLORS[value] : 'bg-slate-800/40';
            const isActivePiece =
              !over && c === piece.col && r >= piece.row && r < piece.row + 3 && value >= 0;
            const ring = isActivePiece ? 'ring-2 ring-amber-300' : '';
            return (
              <div
                key={`${r}-${c}`}
                aria-hidden
                className={`aspect-square rounded-full ${color} ${ring}`}
              />
            );
          }),
        )}
      </div>

      <div className="grid w-full max-w-md grid-cols-4 gap-2 sm:hidden">
        <button
          type="button"
          aria-label="Nach links"
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          onClick={() => move(-1)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Farben drehen"
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          onClick={rotate}
        >
          ↻
        </button>
        <button
          type="button"
          aria-label="Schneller fallen"
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          onClick={softDrop}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Nach rechts"
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          onClick={() => move(1)}
        >
          →
        </button>
      </div>

      <Button variant="primary" onClick={restart} className="max-w-md">
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Bilde Dreierreihen waagrecht, senkrecht oder diagonal. Pfeil↑ rotiert die Farben.
      </p>

      <Sheet open={overOpen} onClose={() => setOverOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          {isNewBest && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-surface-600 dark:text-surface-300">
            Du hast {score} Punkte erreicht.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
