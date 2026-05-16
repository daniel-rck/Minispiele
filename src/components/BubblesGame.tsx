import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { BubblesBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import BottomSheet from './BottomSheet';
import AriaLive from './AriaLive';

const ROWS = 9;
const COLS = 8;
const COLOR_COUNT = 5;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

type Cell = number; // -1 = empty, 0..4 = color

interface State {
  grid: Cell[];
  nextColor: number;
  upcoming: number;
  score: number;
  done: boolean;
}

function randomColor(): number {
  return Math.floor(Math.random() * COLOR_COUNT);
}

function buildInitial(): State {
  const grid: Cell[] = new Array(ROWS * COLS).fill(-1);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r * COLS + c] = randomColor();
    }
  }
  return { grid, nextColor: randomColor(), upcoming: randomColor(), score: 0, done: false };
}

function neighbors(idx: number): number[] {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const odd = r % 2 === 1;
  const candidates: [number, number][] = [
    [r, c - 1],
    [r, c + 1],
    [r - 1, c],
    [r - 1, c + (odd ? 1 : -1)],
    [r + 1, c],
    [r + 1, c + (odd ? 1 : -1)],
  ];
  return candidates
    .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS)
    .map(([nr, nc]) => nr * COLS + nc);
}

function findGroup(grid: Cell[], idx: number): number[] {
  const color = grid[idx];
  if (color === undefined || color < 0) return [];
  const visited = new Set<number>([idx]);
  const stack = [idx];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of neighbors(cur)) {
      if (visited.has(n)) continue;
      if (grid[n] === color) {
        visited.add(n);
        stack.push(n);
      }
    }
  }
  return [...visited];
}

function dropFloating(grid: Cell[]): { grid: Cell[]; removed: number } {
  // anchored to row 0
  const anchored = new Set<number>();
  const stack: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (grid[c] !== -1) {
      anchored.add(c);
      stack.push(c);
    }
  }
  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of neighbors(cur)) {
      if (anchored.has(n)) continue;
      if (grid[n] !== -1) {
        anchored.add(n);
        stack.push(n);
      }
    }
  }
  let removed = 0;
  const next = grid.slice();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== -1 && !anchored.has(i)) {
      next[i] = -1;
      removed++;
    }
  }
  return { grid: next, removed };
}

function findEmptyTarget(grid: Cell[], targetCol: number): number | null {
  // Find lowest reachable empty cell in that column, attached to existing bubble
  for (let r = ROWS - 1; r >= 0; r--) {
    const idx = r * COLS + targetCol;
    if (grid[idx] !== -1) continue;
    // check has neighbor
    const ns = neighbors(idx);
    if (r === 0 || ns.some((n) => grid[n] !== -1)) return idx;
  }
  return null;
}

export default function BubblesGame() {
  const [state, setState] = useState<State>(buildInitial);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.BUBBLES_BEST, BubblesBestSchema, 0);
  const [aimCol, setAimCol] = useState<number>(Math.floor(COLS / 2));
  const [doneOpen, setDoneOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  const occupiedBottom = useMemo(
    () => state.grid.some((v, i) => v !== -1 && Math.floor(i / COLS) >= ROWS - 1),
    [state.grid],
  );

  useEffect(() => {
    if (occupiedBottom && !state.done) {
      setState((s) => ({ ...s, done: true }));
    }
  }, [occupiedBottom, state.done]);

  useEffect(() => {
    if (state.done && !finishedRef.current) {
      finishedRef.current = true;
      if (state.score > best) setBest(state.score);
      setAnnounce(`Spiel zu Ende. ${state.score} Punkte`);
      vibrate([80, 60, 80]);
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.done, state.score, best, setBest, vibrate]);

  const shoot = useCallback(
    (col: number) => {
      if (state.done) return;
      const target = findEmptyTarget(state.grid, col);
      if (target === null) return;
      const grid = state.grid.slice();
      grid[target] = state.nextColor;
      const group = findGroup(grid, target);
      let added = 0;
      let popped = false;
      if (group.length >= 3) {
        for (const i of group) grid[i] = -1;
        added += group.length * 10;
        popped = true;
      }
      const after = dropFloating(grid);
      if (after.removed > 0) added += after.removed * 15;
      vibrate(popped ? 25 : 12);
      setState((s) => ({
        ...s,
        grid: after.grid,
        score: s.score + added,
        nextColor: s.upcoming,
        upcoming: randomColor(),
      }));
    },
    [state.done, state.grid, state.nextColor, vibrate],
  );

  const restart = () => {
    finishedRef.current = false;
    setDoneOpen(false);
    setState(buildInitial());
    setAimCol(Math.floor(COLS / 2));
  };

  const renderCells = () => {
    const cells: ReactElement[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const v = state.grid[idx]!;
        const offsetX = r % 2 === 1 ? 0.5 : 0;
        const xPct = ((c + offsetX) / COLS) * 100;
        const yPct = (r / ROWS) * 100;
        if (v === -1) continue;
        cells.push(
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${100 / COLS}%`,
              height: `${100 / ROWS}%`,
            }}
            aria-hidden
          >
            <span className="block h-full w-full rounded-full" style={{ background: COLORS[v] }} />
          </div>,
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950"
        style={{ aspectRatio: `${COLS} / ${ROWS + 1}` }}
        role="application"
        aria-label="Blasenschießen-Spielfeld"
      >
        <div className="absolute inset-x-0 top-0" style={{ bottom: '12%' }}>
          {renderCells()}
        </div>
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2"
          style={{ height: '14%' }}
        >
          <span
            className="block h-10 w-10 rounded-full ring-2 ring-white/70"
            style={{ background: COLORS[state.nextColor] }}
            aria-label={`Nächste Blase`}
          />
        </div>
      </div>

      <div
        className="grid w-full max-w-md grid-cols-8 gap-1"
        role="group"
        aria-label="Schussspalten"
      >
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            type="button"
            onPointerEnter={() => setAimCol(c)}
            onClick={() => shoot(c)}
            disabled={state.done}
            aria-label={`Spalte ${c + 1}`}
            className={`min-h-11 rounded-lg text-sm font-medium ${
              aimCol === c
                ? 'bg-brand-600 text-white'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {c + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={restart}
        className="min-h-12 w-full max-w-md rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Neues Spiel
      </button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Wähle eine Spalte und schieße die Blase ab. Drei oder mehr gleichfarbige Blasen platzen.
      </p>

      <BottomSheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Game Over">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du erreichst {state.score} Punkte.
          </p>
          <button
            type="button"
            onClick={restart}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
