import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  type MinesweeperHexDifficulty,
  MinesweeperHexDifficultySchema,
} from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const HEX_R = 18;

interface DiffConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFS: Record<MinesweeperHexDifficulty, DiffConfig> = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 10, cols: 10, mines: 18 },
  hard: { rows: 12, cols: 12, mines: 30 },
};

const DIFF_LABELS: Record<MinesweeperHexDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

const NUM_COLORS = [
  '',
  '#0ea5e9',
  '#10b981',
  '#ef4444',
  '#a855f7',
  '#fbbf24',
  '#f97316',
  '#06b6d4',
  '#94a3b8',
];

function hexNeighbors(r: number, c: number, rows: number, cols: number): [number, number][] {
  const even = r % 2 === 0;
  const dirs: [number, number][] = even
    ? [
        [-1, -1],
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
      ]
    : [
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
  const result: [number, number][] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push([nr, nc]);
  }
  return result;
}

function hexPos(r: number, c: number) {
  const w = HEX_R * Math.sqrt(3);
  const x = 30 + c * w + (r % 2) * (w / 2);
  const y = 30 + r * HEX_R * 1.5;
  return { x, y };
}

interface State {
  difficulty: MinesweeperHexDifficulty;
  rows: number;
  cols: number;
  totalMines: number;
  grid: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  mines: [number, number][];
  firstClick: boolean;
  over: 'win' | 'loss' | null;
}

function makeState(difficulty: MinesweeperHexDifficulty): State {
  const d = DIFFS[difficulty];
  return {
    difficulty,
    rows: d.rows,
    cols: d.cols,
    totalMines: d.mines,
    grid: Array.from({ length: d.rows }, () => Array<number>(d.cols).fill(0)),
    revealed: Array.from({ length: d.rows }, () => Array<boolean>(d.cols).fill(false)),
    flagged: Array.from({ length: d.rows }, () => Array<boolean>(d.cols).fill(false)),
    mines: [],
    firstClick: true,
    over: null,
  };
}

function placeMines(state: State, safeR: number, safeC: number): void {
  const safe = new Set<number>();
  safe.add(safeR * state.cols + safeC);
  for (const [r, c] of hexNeighbors(safeR, safeC, state.rows, state.cols)) {
    safe.add(r * state.cols + c);
  }
  let placed = 0;
  while (placed < state.totalMines) {
    const r = Math.floor(Math.random() * state.rows);
    const c = Math.floor(Math.random() * state.cols);
    if (state.grid[r]?.[c] === -1 || safe.has(r * state.cols + c)) continue;
    state.grid[r]![c] = -1;
    state.mines.push([r, c]);
    placed++;
  }
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (state.grid[r]?.[c] === -1) continue;
      const n = hexNeighbors(r, c, state.rows, state.cols).filter(
        ([nr, nc]) => state.grid[nr]?.[nc] === -1,
      ).length;
      state.grid[r]![c] = n;
    }
  }
}

function revealRecursive(state: State, r: number, c: number): void {
  if (state.revealed[r]?.[c] || state.flagged[r]?.[c]) return;
  state.revealed[r]![c] = true;
  if (state.grid[r]?.[c] === 0) {
    for (const [nr, nc] of hexNeighbors(r, c, state.rows, state.cols)) {
      revealRecursive(state, nr, nc);
    }
  }
}

export default function MinesweeperHexGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useLocalStorage<MinesweeperHexDifficulty>(
    STORAGE_KEYS.MINESWEEPER_HEX_DIFFICULTY,
    MinesweeperHexDifficultySchema,
    'easy',
  );
  const [, setBump] = useState(0);
  const stateRef = useRef<State>(makeState(difficulty));
  const [announcement, setAnnouncement] = useState('Linksklick = aufdecken, Rechtsklick = Flagge.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const force = useCallback(() => setBump((b) => b + 1), []);

  const restart = useCallback(
    (next: MinesweeperHexDifficulty) => {
      stateRef.current = makeState(next);
      setAnnouncement(`${DIFF_LABELS[next]} gestartet.`);
      force();
    },
    [force],
  );

  useEffect(() => {
    if (stateRef.current.difficulty !== difficulty) restart(difficulty);
  }, [difficulty, restart]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 60 + s.cols * HEX_R * Math.sqrt(3) + HEX_R;
    canvas.height = 60 + s.rows * HEX_R * 1.5 + HEX_R;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const { x, y } = hexPos(r, c);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 6 + (i * Math.PI) / 3;
          const hx = x + (HEX_R - 1) * Math.cos(angle);
          const hy = y + (HEX_R - 1) * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        const isRevealed = s.revealed[r]?.[c];
        const isFlag = s.flagged[r]?.[c];
        const value = s.grid[r]?.[c] ?? 0;
        if (isRevealed) {
          if (value === -1) {
            ctx.fillStyle = '#7f1d1d';
            ctx.fill();
            ctx.strokeStyle = '#f43f5e';
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = '#334155';
          }
          ctx.stroke();
          if (value === -1) {
            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('*', x, y);
          } else if (value > 0) {
            ctx.fillStyle = NUM_COLORS[value] ?? '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(value), x, y);
          }
        } else {
          ctx.fillStyle = '#334155';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.stroke();
          if (isFlag) {
            ctx.fillStyle = '#f43f5e';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚑', x, y);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    draw();
  });

  const findHex = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const s = stateRef.current;
    let bestR = -1;
    let bestC = -1;
    let bestDist = Infinity;
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const { x, y } = hexPos(r, c);
        const d = Math.hypot(mx - x, my - y);
        if (d < HEX_R && d < bestDist) {
          bestDist = d;
          bestR = r;
          bestC = c;
        }
      }
    }
    if (bestR < 0) return null;
    return [bestR, bestC] as const;
  };

  const onLeftClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.over) return;
    const pos = findHex(e);
    if (!pos) return;
    const [r, c] = pos;
    if (s.flagged[r]?.[c]) return;
    if (s.firstClick) {
      placeMines(s, r, c);
      s.firstClick = false;
    }
    vibrate(15);
    if (s.grid[r]?.[c] === -1) {
      s.revealed[r]![c] = true;
      s.over = 'loss';
      for (const [mr, mc] of s.mines) s.revealed[mr]![mc] = true;
      setAnnouncement('Boom! Verloren.');
      sfx.lose();
      vibrate([120, 60, 80]);
    } else {
      revealRecursive(s, r, c);
      let unrevealed = 0;
      for (let rr = 0; rr < s.rows; rr++) {
        for (let cc = 0; cc < s.cols; cc++) {
          if (!s.revealed[rr]?.[cc]) unrevealed++;
        }
      }
      if (unrevealed === s.totalMines) {
        s.over = 'win';
        setAnnouncement('Gewonnen! Alle sicheren Felder aufgedeckt.');
        sfx.win();
        vibrate([60, 40, 120]);
      } else {
        sfx.pop();
      }
    }
    force();
  };

  const onRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const s = stateRef.current;
    if (s.over) return;
    const pos = findHex(e);
    if (!pos) return;
    const [r, c] = pos;
    if (s.revealed[r]?.[c]) return;
    s.flagged[r]![c] = !s.flagged[r]![c];
    vibrate(10);
    force();
  };

  const s = stateRef.current;
  let flagCount = 0;
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) if (s.flagged[r]?.[c]) flagCount++;
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Schwierigkeit:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as MinesweeperHexDifficulty)}
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <option key={d} value={d}>
                {DIFF_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={() => restart(difficulty)}>
          Neues Spiel
        </Button>
      </div>

      <div className="text-sm text-surface-700 dark:text-surface-200">
        Minen: <span className="font-semibold tabular-nums">{s.totalMines - flagCount}</span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={onLeftClick}
        onContextMenu={onRightClick}
        aria-label="Hex-Minensucher Spielfeld"
        className="rounded-lg ring-1 ring-slate-700"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Klick = aufdecken, Rechtsklick = Flagge. Sechseck-Gitter mit bis zu 6 Nachbarn pro Feld.
      </p>
    </div>
  );
}
