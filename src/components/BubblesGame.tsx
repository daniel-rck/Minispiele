import {
  type CSSProperties,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import {
  buildInitial,
  BUBBLES_CELL as CELL,
  type Cell,
  BUBBLES_COLORS as COLORS,
  BUBBLES_COLS as COLS,
  cellCenter,
  dropFloating,
  BUBBLES_FIELD_H as FIELD_H,
  BUBBLES_FIELD_W as FIELD_W,
  findGroup,
  neighbors,
  BUBBLES_RADIUS as RADIUS,
  BUBBLES_ROWS as ROWS,
  randomColor,
  type BubblesState as State,
} from '../lib/bubbles';
import { STORAGE_KEYS } from '../lib/constants';
import { type Particle, particleOpacity, spawnBurst, stepParticles } from '../lib/particles';
import { BubblesBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const FLIGHT_SPEED = 0.55; // units of CELL per ms — gives a ~150ms flight at typical distance

interface Flight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
}

const START_X = FIELD_W / 2;
const START_Y = FIELD_H - CELL * 0.6;
const MAX_AIM_ANGLE_RAD = (85 * Math.PI) / 180;
const AIM_KEY_STEP_RAD = (3 * Math.PI) / 180;
const AIM_STEP = 0.4;
const AIM_MAX_STEPS = 1500;
const COLLISION_FACTOR = 1.7; // multiplied by RADIUS for circle-circle hit test

interface AimResult {
  idx: number;
  path: { x: number; y: number }[];
}

function findCeilingTarget(grid: Cell[], x: number): number | null {
  let best: { idx: number; dist: number } | null = null;
  for (let cc = 0; cc < COLS; cc++) {
    if (grid[cc] !== -1) continue;
    const c = cellCenter(cc);
    const d = Math.abs(c.x - x);
    if (best === null || d < best.dist) best = { idx: cc, dist: d };
  }
  return best?.idx ?? null;
}

function findFilledCollision(grid: Cell[], x: number, y: number): number | null {
  const rApprox = Math.floor(y / CELL);
  for (let rr = Math.max(0, rApprox - 1); rr <= Math.min(ROWS - 1, rApprox + 1); rr++) {
    for (let cc = 0; cc < COLS; cc++) {
      const idx = rr * COLS + cc;
      const v = grid[idx];
      if (v === undefined || v < 0) continue;
      const c = cellCenter(idx);
      if (Math.hypot(c.x - x, c.y - y) < RADIUS * COLLISION_FACTOR) return idx;
    }
  }
  return null;
}

function findLandingNear(grid: Cell[], x: number, y: number, hitIdx: number): number | null {
  let best: { idx: number; dist: number } | null = null;
  for (const i of neighbors(hitIdx)) {
    if (grid[i] !== -1) continue;
    const c = cellCenter(i);
    const d = Math.hypot(c.x - x, c.y - y);
    if (best === null || d < best.dist) best = { idx: i, dist: d };
  }
  return best?.idx ?? null;
}

function castShot(grid: Cell[], angle: number): AimResult | null {
  let x = START_X;
  let y = START_Y;
  let vx = Math.sin(angle);
  const vy = -Math.cos(angle);
  const path: { x: number; y: number }[] = [{ x, y }];
  for (let i = 0; i < AIM_MAX_STEPS; i++) {
    x += vx * AIM_STEP;
    y += vy * AIM_STEP;
    if (x < RADIUS) {
      x = RADIUS;
      vx = -vx;
      path.push({ x, y });
    } else if (x > FIELD_W - RADIUS) {
      x = FIELD_W - RADIUS;
      vx = -vx;
      path.push({ x, y });
    }
    if (y < RADIUS) {
      const idx = findCeilingTarget(grid, x);
      if (idx === null) return null;
      const c = cellCenter(idx);
      path.push({ x: c.x, y: c.y });
      return { idx, path };
    }
    const hit = findFilledCollision(grid, x, y);
    if (hit !== null) {
      const idx = findLandingNear(grid, x, y, hit);
      if (idx === null) return null;
      const c = cellCenter(idx);
      path.push({ x: c.x, y: c.y });
      return { idx, path };
    }
  }
  return null;
}

function pointToAngle(sx: number, sy: number): number | null {
  const dx = sx - START_X;
  const dy = sy - START_Y;
  if (dy >= 0) return null;
  const angle = Math.atan2(dx, -dy);
  return Math.max(-MAX_AIM_ANGLE_RAD, Math.min(MAX_AIM_ANGLE_RAD, angle));
}

export default function BubblesGame() {
  const [state, setState] = useState<State>(buildInitial);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.BUBBLES_BEST, BubblesBestSchema, 0);
  const [aimAngle, setAimAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
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
  const pendingShotRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

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
      sfx.lose();
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.done, state.score, best, setBest, vibrate, sfx]);

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
      if (popped) sfx.pop();

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
    [state.grid, vibrate, sfx],
  );

  const shoot = useCallback(
    (angle: number) => {
      if (state.done || flight) return;
      const shot = castShot(state.grid, angle);
      if (!shot) return;
      flightTargetRef.current = { idx: shot.idx, col: shot.idx % COLS };
      setFlight({
        x: START_X,
        y: START_Y,
        vx: Math.sin(angle) * FLIGHT_SPEED,
        vy: -Math.cos(angle) * FLIGHT_SPEED,
        color: state.nextColor,
      });
    },
    [state.done, state.grid, state.nextColor, flight],
  );

  const aimPreview = useMemo(() => {
    if (state.done || flight) return null;
    return castShot(state.grid, aimAngle);
  }, [state.done, flight, state.grid, aimAngle]);

  const updateAimFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = ((clientX - rect.left) / rect.width) * FIELD_W;
    const sy = ((clientY - rect.top) / rect.height) * FIELD_H;
    const a = pointToAngle(sx, sy);
    if (a !== null) setAimAngle(a);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (state.done || flight) return;
    e.preventDefault();
    setDragging(true);
    pendingShotRef.current = true;
    updateAimFromPointer(e.clientX, e.clientY);
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const finishDrag = (e: React.PointerEvent<SVGSVGElement>, doShoot: boolean) => {
    if (!dragging) return;
    setDragging(false);
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (doShoot && pendingShotRef.current) {
      pendingShotRef.current = false;
      shoot(aimAngle);
    } else {
      pendingShotRef.current = false;
    }
  };

  useEffect(() => {
    if (state.done) return;
    const onKey = (e: KeyboardEvent) => {
      if (flight) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setAimAngle((a) => Math.max(-MAX_AIM_ANGLE_RAD, a - AIM_KEY_STEP_RAD));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setAimAngle((a) => Math.min(MAX_AIM_ANGLE_RAD, a + AIM_KEY_STEP_RAD));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        shoot(aimAngle);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.done, flight, aimAngle, shoot]);

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
    setAimAngle(0);
    setDragging(false);
    setFlight(null);
    setPoppingIdx(new Set());
    setParticles([]);
    flightTargetRef.current = null;
    pendingLandingRef.current = null;
    pendingShotRef.current = false;
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
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="relative fit-box touch-none select-none overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950"
          style={{ '--fit-ar': FIELD_W / FIELD_H } as CSSProperties}
          role="application"
          aria-label="Blasenschießen-Spielfeld"
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => finishDrag(e, true)}
            onPointerCancel={(e) => finishDrag(e, false)}
          >
            {renderCells()}
            {aimPreview && (
              <polyline
                points={aimPreview.path.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={0.4}
                strokeDasharray="1.5 1.5"
                aria-hidden
              />
            )}
            {aimPreview && !flight && (
              <circle
                cx={aimPreview.path[aimPreview.path.length - 1]!.x}
                cy={aimPreview.path[aimPreview.path.length - 1]!.y}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.4}
                strokeDasharray="1 1"
                aria-hidden
              />
            )}
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
                cx={START_X}
                cy={START_Y}
                r={RADIUS}
                fill={COLORS[state.nextColor]}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={0.4}
              />
            )}
          </svg>
        </div>
      </div>

      <Button variant="primary" block className="max-w-md" onClick={restart}>
        Nochmal spielen
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Ziele durch Ziehen auf dem Spielfeld, beim Loslassen wird geschossen. Pfeiltasten ändern den
        Winkel, Leertaste schießt. Drei oder mehr gleichfarbige Blasen platzen.
      </p>

      <Sheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du erreichst {state.score} Punkte.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
