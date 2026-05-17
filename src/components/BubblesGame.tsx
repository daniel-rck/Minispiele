import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { BubblesBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { particleOpacity, spawnBurst, stepParticles, type Particle } from '../lib/particles';
import BottomSheet from './BottomSheet';
import AriaLive from './AriaLive';

const ROWS = 9;
const COLS = 8;
const COLOR_COUNT = 5;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

// Logical coordinate system: 100 wide, ROWS+1 tall in same proportion as render box.
const FIELD_W = 100;
const FIELD_H = (100 / COLS) * (ROWS + 1);
const CELL = FIELD_W / COLS;
const RADIUS = CELL * 0.45;
const FLIGHT_SPEED = 0.55; // units of CELL per ms — gives a ~150ms flight at typical distance

type Cell = number; // -1 = empty, 0..4 = color

interface State {
  grid: Cell[];
  nextColor: number;
  upcoming: number;
  score: number;
  done: boolean;
}

interface Flight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
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

function dropFloating(grid: Cell[]): { grid: Cell[]; removed: number; removedIdx: number[] } {
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
  const removedIdx: number[] = [];
  const next = grid.slice();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== -1 && !anchored.has(i)) {
      next[i] = -1;
      removed++;
      removedIdx.push(i);
    }
  }
  return { grid: next, removed, removedIdx };
}

function findEmptyTarget(grid: Cell[], targetCol: number): number | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    const idx = r * COLS + targetCol;
    if (grid[idx] !== -1) continue;
    const ns = neighbors(idx);
    if (r === 0 || ns.some((n) => grid[n] !== -1)) return idx;
  }
  return null;
}

function cellCenter(idx: number): { x: number; y: number } {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const offsetX = r % 2 === 1 ? 0.5 : 0;
  return {
    x: (c + offsetX + 0.5) * CELL,
    y: (r + 0.5) * CELL,
  };
}

export default function BubblesGame() {
  const [state, setState] = useState<State>(buildInitial);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.BUBBLES_BEST, BubblesBestSchema, 0);
  const [aimCol, setAimCol] = useState<number>(Math.floor(COLS / 2));
  const [doneOpen, setDoneOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [flight, setFlight] = useState<Flight | null>(null);
  const [poppingIdx, setPoppingIdx] = useState<Set<number>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const flightTargetRef = useRef<{ idx: number; col: number } | null>(null);
  const flightRef = useRef<Flight | null>(null);
  flightRef.current = flight;
  const pendingLandingRef = useRef<{ color: number; idx: number } | null>(null);
  const popTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  useEffect(() => {
    return () => {
      if (popTimerRef.current !== null) {
        window.clearTimeout(popTimerRef.current);
        popTimerRef.current = null;
      }
    };
  }, []);

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

  const resolveLanding = useCallback(
    (color: number, idx: number) => {
      const grid = state.grid.slice();
      grid[idx] = color;
      const group = findGroup(grid, idx);
      let added = 0;
      let popped = false;
      const popIdxSet = new Set<number>();
      if (group.length >= 3) {
        for (const i of group) {
          grid[i] = -1;
          popIdxSet.add(i);
        }
        added += group.length * 10;
        popped = true;
      }
      const after = dropFloating(grid);
      for (const i of after.removedIdx) popIdxSet.add(i);
      if (after.removed > 0) added += after.removed * 15;
      vibrate(popped ? 25 : 12);

      if (popIdxSet.size > 0) {
        setPoppingIdx(popIdxSet);
        const bursts: Particle[] = [];
        for (const i of popIdxSet) {
          const c = cellCenter(i);
          const original = state.grid[i];
          // The just-shot cell is -1 in the previous state — fall back to the shot color.
          const colorIdx = original !== undefined && original >= 0 ? original : color;
          bursts.push(
            ...spawnBurst({
              x: c.x,
              y: c.y,
              count: 8,
              speed: 0.04,
              color: COLORS[colorIdx] ?? '#fff',
              lifeMs: 500,
              size: 1.2,
            }),
          );
        }
        setParticles((prev) => [...prev, ...bursts]);
        if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
        popTimerRef.current = window.setTimeout(() => {
          popTimerRef.current = null;
          setPoppingIdx(new Set());
          setState((s) => ({
            ...s,
            grid: after.grid,
            score: s.score + added,
            nextColor: s.upcoming,
            upcoming: randomColor(),
          }));
        }, 180);
      } else {
        setState((s) => ({
          ...s,
          grid: after.grid,
          score: s.score + added,
          nextColor: s.upcoming,
          upcoming: randomColor(),
        }));
      }
    },
    [state.grid, vibrate],
  );

  const shoot = useCallback(
    (col: number) => {
      if (state.done || flight) return;
      const target = findEmptyTarget(state.grid, col);
      if (target === null) return;
      const center = cellCenter(target);
      // start from bottom-center of the field
      const startX = FIELD_W / 2;
      const startY = FIELD_H - CELL * 0.6;
      const dx = center.x - startX;
      const dy = center.y - startY;
      const dist = Math.hypot(dx, dy) || 1;
      flightTargetRef.current = { idx: target, col };
      setFlight({
        x: startX,
        y: startY,
        vx: (dx / dist) * FLIGHT_SPEED,
        vy: (dy / dist) * FLIGHT_SPEED,
        color: state.nextColor,
      });
    },
    [state.done, state.grid, state.nextColor, flight],
  );

  // Flight animation loop: ride the bubble along the trajectory, bounce off side walls,
  // and resolve when it reaches the target cell.
  useAnimationFrame((delta) => {
    const f = flightRef.current;
    if (!f) return;
    let nx = f.x + f.vx * delta;
    const ny = f.y + f.vy * delta;
    let vx = f.vx;
    if (nx < RADIUS) {
      nx = RADIUS;
      vx = -vx;
    } else if (nx > FIELD_W - RADIUS) {
      nx = FIELD_W - RADIUS;
      vx = -vx;
    }
    const target = flightTargetRef.current;
    if (target) {
      const c = cellCenter(target.idx);
      if (Math.hypot(c.x - nx, c.y - ny) < CELL * 0.35 || ny < RADIUS) {
        pendingLandingRef.current = { color: f.color, idx: target.idx };
        flightTargetRef.current = null;
        setFlight(null);
        return;
      }
    }
    setFlight({ ...f, x: nx, y: ny, vx });
  }, flight !== null);

  // Resolve landing in an effect (outside the state updater) so it runs once
  // even under Strict Mode double-invocation.
  useEffect(() => {
    if (flight === null && pendingLandingRef.current !== null) {
      const { color, idx } = pendingLandingRef.current;
      pendingLandingRef.current = null;
      resolveLanding(color, idx);
    }
  }, [flight, resolveLanding]);

  // Particle animation loop
  useAnimationFrame((delta) => {
    setParticles((prev) => stepParticles(prev, delta));
  }, particles.length > 0);

  const restart = () => {
    finishedRef.current = false;
    setDoneOpen(false);
    setState(buildInitial());
    setAimCol(Math.floor(COLS / 2));
    setFlight(null);
    setPoppingIdx(new Set());
    setParticles([]);
    flightTargetRef.current = null;
    pendingLandingRef.current = null;
    if (popTimerRef.current !== null) {
      window.clearTimeout(popTimerRef.current);
      popTimerRef.current = null;
    }
  };

  const renderCells = () => {
    const cells: ReactElement[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const v = state.grid[idx]!;
        if (v === -1) continue;
        const center = cellCenter(idx);
        const popping = poppingIdx.has(idx);
        cells.push(
          <circle
            key={idx}
            cx={center.x}
            cy={center.y}
            r={RADIUS}
            fill={COLORS[v]}
            style={{
              transition: 'transform 180ms ease-out, opacity 180ms ease-out',
              transformOrigin: `${center.x}px ${center.y}px`,
              transform: popping ? 'scale(0.1)' : 'scale(1)',
              opacity: popping ? 0 : 1,
            }}
            data-testid="bubble-cell"
            aria-hidden
          />,
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
        style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}` }}
        role="application"
        aria-label="Blasenschießen-Spielfeld"
      >
        <svg
          viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {renderCells()}
          {flight && (
            <circle
              cx={flight.x}
              cy={flight.y}
              r={RADIUS}
              fill={COLORS[flight.color]}
              opacity={0.95}
            />
          )}
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={particleOpacity(p)}
            />
          ))}
          {!flight && (
            <circle
              cx={FIELD_W / 2}
              cy={FIELD_H - CELL * 0.6}
              r={RADIUS}
              fill={COLORS[state.nextColor]}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={0.4}
            />
          )}
        </svg>
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
            disabled={state.done || flight !== null}
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
        Nochmal spielen
      </button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Wähle eine Spalte und schieße die Blase ab. Drei oder mehr gleichfarbige Blasen platzen.
      </p>

      <BottomSheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Spiel vorbei">
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
            Nochmal spielen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
