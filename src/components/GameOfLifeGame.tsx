import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const ROWS = 30;
const COLS = 50;

type PatternName = 'glider' | 'blinker' | 'toad' | 'beacon' | 'pulsar' | 'pentadecathlon';

const PATTERNS: Record<PatternName, readonly [number, number][]> = {
  glider: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  blinker: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  toad: [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  beacon: [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 3],
    [3, 2],
    [3, 3],
  ],
  pulsar: [
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 8],
    [0, 9],
    [0, 10],
    [2, 0],
    [2, 5],
    [2, 7],
    [2, 12],
    [3, 0],
    [3, 5],
    [3, 7],
    [3, 12],
    [4, 0],
    [4, 5],
    [4, 7],
    [4, 12],
    [5, 2],
    [5, 3],
    [5, 4],
    [5, 8],
    [5, 9],
    [5, 10],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 8],
    [7, 9],
    [7, 10],
    [8, 0],
    [8, 5],
    [8, 7],
    [8, 12],
    [9, 0],
    [9, 5],
    [9, 7],
    [9, 12],
    [10, 0],
    [10, 5],
    [10, 7],
    [10, 12],
    [12, 2],
    [12, 3],
    [12, 4],
    [12, 8],
    [12, 9],
    [12, 10],
  ],
  pentadecathlon: [
    [0, 1],
    [1, 1],
    [2, 0],
    [2, 2],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 0],
    [7, 2],
    [8, 1],
    [9, 1],
  ],
};

const PATTERN_LABELS: Record<PatternName, string> = {
  glider: 'Glider',
  blinker: 'Blinker',
  toad: 'Toad',
  beacon: 'Beacon',
  pulsar: 'Pulsar',
  pentadecathlon: 'Pentadekathlon',
};

function emptyGrid(): Uint8Array {
  return new Uint8Array(ROWS * COLS);
}

function step(grid: Uint8Array, wrap: boolean): Uint8Array {
  const next = new Uint8Array(ROWS * COLS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let nr = r + dr;
          let nc = c + dc;
          if (wrap) {
            nr = (nr + ROWS) % ROWS;
            nc = (nc + COLS) % COLS;
          } else if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          if (grid[nr * COLS + nc]) n++;
        }
      }
      const idx = r * COLS + c;
      if (grid[idx]) next[idx] = n === 2 || n === 3 ? 1 : 0;
      else next[idx] = n === 3 ? 1 : 0;
    }
  }
  return next;
}

function countPopulation(grid: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i]) n++;
  return n;
}

export default function GameOfLifeGame() {
  const [, setTick] = useState(0); // bump to force render
  const gridRef = useRef<Uint8Array>(emptyGrid());
  const [running, setRunning] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [speed, setSpeed] = useState(10);
  const [generation, setGeneration] = useState(0);
  const [announcement, setAnnouncement] = useState('Klicke Zellen oder lade ein Muster.');

  const sfx = useGameSfx();
  const wrapRef = useRef(wrap);
  wrapRef.current = wrap;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const forceRender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (now - last > 1000 / speedRef.current) {
        gridRef.current = step(gridRef.current, wrapRef.current);
        setGeneration((g) => g + 1);
        forceRender();
        last = now;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [running, forceRender]);

  const toggleCell = useCallback(
    (r: number, c: number) => {
      if (running) return;
      const idx = r * COLS + c;
      gridRef.current[idx] = gridRef.current[idx] ? 0 : 1;
      forceRender();
    },
    [running, forceRender],
  );

  const clearGrid = useCallback(() => {
    setRunning(false);
    gridRef.current = emptyGrid();
    setGeneration(0);
    setAnnouncement('Gitter geleert.');
    forceRender();
  }, [forceRender]);

  const randomize = useCallback(() => {
    setRunning(false);
    const g = emptyGrid();
    for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.3 ? 1 : 0;
    gridRef.current = g;
    setGeneration(0);
    setAnnouncement('Zufallsbevölkerung erzeugt.');
    forceRender();
  }, [forceRender]);

  const loadPattern = useCallback(
    (name: PatternName) => {
      setRunning(false);
      const g = emptyGrid();
      const pattern = PATTERNS[name];
      const cr = Math.floor(ROWS / 2) - 4;
      const cc = Math.floor(COLS / 2) - 4;
      for (const [r, c] of pattern) {
        const nr = cr + r;
        const nc = cc + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) g[nr * COLS + nc] = 1;
      }
      gridRef.current = g;
      setGeneration(0);
      setAnnouncement(`${PATTERN_LABELS[name]} geladen.`);
      sfx.pop();
      forceRender();
    },
    [forceRender, sfx],
  );

  const oneStep = useCallback(() => {
    gridRef.current = step(gridRef.current, wrapRef.current);
    setGeneration((g) => g + 1);
    sfx.pop();
    forceRender();
  }, [forceRender, sfx]);

  const toggleRun = useCallback(() => {
    setRunning((r) => {
      const next = !r;
      setAnnouncement(next ? 'Simulation läuft.' : 'Pausiert.');
      return next;
    });
  }, []);

  // Recomputed each render; the grid lives in a ref, so the `generation` bump that
  // triggers the render is what keeps this value fresh. countPopulation is cheap.
  const population = countPopulation(gridRef.current);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 pb-2">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={toggleRun}>
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button variant="secondary" size="sm" onClick={oneStep} disabled={running}>
          Schritt
        </Button>
        <Button variant="ghost" size="sm" onClick={randomize}>
          Zufall
        </Button>
        <Button variant="ghost" size="sm" onClick={clearGrid}>
          Leeren
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-surface-700 dark:text-surface-200">
        <label className="flex items-center gap-2">
          Speed:
          <input
            type="range"
            min={1}
            max={30}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="Simulationsgeschwindigkeit"
          />
          <span className="tabular-nums">{speed}</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => setWrap(e.target.checked)}
            aria-label="Ränder verbinden"
          />
          Wrap
        </label>
        <label className="flex items-center gap-2">
          Muster:
          <select
            onChange={(e) => {
              const v = e.target.value as PatternName | '';
              if (v) loadPattern(v);
              e.target.value = '';
            }}
            defaultValue=""
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            <option value="">-- Wählen --</option>
            {Object.entries(PATTERN_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="flex items-center justify-between text-sm text-surface-700 dark:text-surface-200"
        style={{ width: 'min(95vw, 700px)' }}
      >
        <div>
          Generation: <span className="font-semibold tabular-nums">{generation}</span>
        </div>
        <div>
          Zellen: <span className="font-semibold tabular-nums">{population}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[700px]">
        <div
          className="grid fit-box gap-0 rounded-lg bg-slate-900 p-1 ring-1 ring-slate-700 dark:bg-slate-950"
          role="group"
          aria-label="Game-of-Life-Spielfeld"
          style={
            {
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              '--fit-ar': COLS / ROWS,
            } as CSSProperties
          }
        >
          {Array.from(gridRef.current).map((alive, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleCell(r, c)}
                aria-label={`Zelle ${r + 1},${c + 1} ${alive ? 'lebt' : 'leer'}`}
                className={`aspect-square ${alive ? 'bg-amber-400' : 'bg-slate-800/40 hover:bg-slate-700/60'}`}
              />
            );
          })}
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Conways Game of Life. Klicke Zellen zum Setzen, lade ein Muster, starte die Simulation.
      </p>
    </div>
  );
}
