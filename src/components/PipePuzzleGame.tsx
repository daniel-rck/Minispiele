import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type PipePuzzleSize, PipePuzzleSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SIZES: readonly PipePuzzleSize[] = [5, 7, 9];

type Pipe = [number, number, number, number]; // top, right, bottom, left

interface Puzzle {
  n: number;
  grid: Pipe[][];
}

function generatePuzzle(n: number): Puzzle {
  const visited: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  type Conn = { top: boolean; right: boolean; bottom: boolean; left: boolean };
  const connections: Conn[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ top: false, right: false, bottom: false, left: false })),
  );
  const dirs: [number, number, keyof Conn, keyof Conn][] = [
    [-1, 0, 'top', 'bottom'],
    [0, 1, 'right', 'left'],
    [1, 0, 'bottom', 'top'],
    [0, -1, 'left', 'right'],
  ];
  function dfs(r: number, c: number): void {
    const row = visited[r];
    if (row) row[c] = true;
    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    for (const [dr, dc, dir, opp] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr]?.[nc]) {
        connections[r]![c]![dir] = true;
        connections[nr]![nc]![opp] = true;
        dfs(nr, nc);
      }
    }
  }
  dfs(0, 0);
  const grid: Pipe[][] = Array.from({ length: n }, () => Array<Pipe>(n).fill([0, 0, 0, 0]));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const conn = connections[r]![c]!;
      const pipe: Pipe = [
        conn.top ? 1 : 0,
        conn.right ? 1 : 0,
        conn.bottom ? 1 : 0,
        conn.left ? 1 : 0,
      ];
      const rotations = Math.floor(Math.random() * 4);
      let rotated: Pipe = [...pipe] as Pipe;
      for (let i = 0; i < rotations; i++) {
        rotated = [rotated[3], rotated[0], rotated[1], rotated[2]];
      }
      grid[r]![c] = rotated;
    }
  }
  return { n, grid };
}

function rotateClockwise(p: Pipe): Pipe {
  return [p[3], p[0], p[1], p[2]];
}

function checkConnections(puzzle: Puzzle): boolean[][] {
  const { n, grid } = puzzle;
  const connected: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  if (!grid[0]?.[0]) return connected;
  const queue: [number, number][] = [[0, 0]];
  connected[0]![0] = true;
  const dirs: [number, number, number, number][] = [
    [-1, 0, 0, 2],
    [0, 1, 1, 3],
    [1, 0, 2, 0],
    [0, -1, 3, 1],
  ];
  while (queue.length) {
    const head = queue.shift();
    if (!head) break;
    const [r, c] = head;
    const cell = grid[r]?.[c];
    if (!cell) continue;
    for (const [dr, dc, my, opp] of dirs) {
      if (!cell[my]) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const neighbor = grid[nr]?.[nc];
      if (!neighbor || connected[nr]?.[nc] || !neighbor[opp]) continue;
      connected[nr]![nc] = true;
      queue.push([nr, nc]);
    }
  }
  return connected;
}

export default function PipePuzzleGame() {
  const [size, setSize] = useLocalStorage<PipePuzzleSize>(
    STORAGE_KEYS.PIPE_PUZZLE_SIZE,
    PipePuzzleSizeSchema,
    7,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(size));
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState(false);
  const [announcement, setAnnouncement] = useState(
    'Klicke auf Rohre zum Drehen. Verbinde alle Rohre.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: PipePuzzleSize) => {
    setPuzzle(generatePuzzle(n));
    setMoves(0);
    setOver(false);
    setAnnouncement('Klicke Rohre zum Drehen.');
  }, []);

  useEffect(() => {
    if (puzzle.n !== size) restart(size);
  }, [size, puzzle.n, restart]);

  const connected = useMemo(() => checkConnections(puzzle), [puzzle]);

  const rotateCell = useCallback(
    (r: number, c: number) => {
      if (over) return;
      vibrate(15);
      sfx.pop();
      setMoves((m) => m + 1);
      setPuzzle((p) => {
        const next: Pipe[][] = p.grid.map((row) => row.map((cell) => [...cell] as Pipe));
        const cell = next[r]?.[c];
        if (!cell) return p;
        next[r]![c] = rotateClockwise(cell);
        return { ...p, grid: next };
      });
    },
    [over, vibrate, sfx],
  );

  useEffect(() => {
    if (over) return;
    let allConnected = true;
    for (let r = 0; r < puzzle.n; r++) {
      for (let c = 0; c < puzzle.n; c++) {
        if (!connected[r]?.[c]) {
          allConnected = false;
          break;
        }
      }
      if (!allConnected) break;
    }
    if (allConnected) {
      setOver(true);
      setAnnouncement(`Gelöst in ${moves} Zügen.`);
      sfx.win();
      vibrate([60, 40, 120]);
    }
  }, [connected, puzzle.n, moves, over, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as PipePuzzleSize;
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
        <span className="text-sm text-surface-700 dark:text-surface-200">
          Züge: <span className="font-semibold tabular-nums">{moves}</span>
        </span>
      </div>

      <div
        className="grid gap-[1px] rounded-lg bg-slate-900 p-1 dark:bg-slate-950"
        role="group"
        aria-label="Pipe-Puzzle-Spielfeld"
        style={{
          gridTemplateColumns: `repeat(${puzzle.n}, minmax(0, 1fr))`,
          maxWidth: '420px',
          width: '100%',
        }}
      >
        {puzzle.grid.flatMap((row, r) =>
          row.map((pipe, c) => {
            const isConnected = connected[r]?.[c];
            const color = isConnected ? 'bg-emerald-500' : 'bg-slate-500';
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => rotateCell(r, c)}
                aria-label={`Rohr ${r + 1},${c + 1}${isConnected ? ' verbunden' : ''}`}
                className="relative aspect-square bg-slate-800"
              >
                <span
                  className={`absolute left-1/2 top-1/2 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 ${color}`}
                />
                {pipe[0] === 1 && (
                  <span
                    className={`absolute left-1/2 top-0 h-1/2 w-1/4 -translate-x-1/2 ${color}`}
                  />
                )}
                {pipe[1] === 1 && (
                  <span
                    className={`absolute right-0 top-1/2 h-1/4 w-1/2 -translate-y-1/2 ${color}`}
                  />
                )}
                {pipe[2] === 1 && (
                  <span
                    className={`absolute bottom-0 left-1/2 h-1/2 w-1/4 -translate-x-1/2 ${color}`}
                  />
                )}
                {pipe[3] === 1 && (
                  <span
                    className={`absolute left-0 top-1/2 h-1/4 w-1/2 -translate-y-1/2 ${color}`}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tippe ein Rohr zum 90°-Drehen. Verbinde alle Felder zu einem zusammenhängenden Netz, das in
        der oberen linken Ecke startet.
      </p>
    </div>
  );
}
