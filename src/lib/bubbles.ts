export const BUBBLES_ROWS = 9;
export const BUBBLES_COLS = 8;
export const BUBBLES_COLOR_COUNT = 5;
export const BUBBLES_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

// Logical coordinate system: 100 wide, ROWS+1 tall in same proportion as render box.
export const BUBBLES_FIELD_W = 100;
export const BUBBLES_FIELD_H = (100 / BUBBLES_COLS) * (BUBBLES_ROWS + 1);
export const BUBBLES_CELL = BUBBLES_FIELD_W / BUBBLES_COLS;
export const BUBBLES_RADIUS = BUBBLES_CELL * 0.45;

export type Cell = number; // -1 = empty, 0..4 = color

export interface BubblesState {
  grid: Cell[];
  nextColor: number;
  upcoming: number;
  score: number;
  done: boolean;
}

export function randomColor(rng: () => number = Math.random): number {
  return Math.floor(rng() * BUBBLES_COLOR_COUNT);
}

export function buildInitial(rng: () => number = Math.random): BubblesState {
  const grid: Cell[] = new Array(BUBBLES_ROWS * BUBBLES_COLS).fill(-1);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < BUBBLES_COLS; c++) {
      grid[r * BUBBLES_COLS + c] = randomColor(rng);
    }
  }
  return {
    grid,
    nextColor: randomColor(rng),
    upcoming: randomColor(rng),
    score: 0,
    done: false,
  };
}

export function neighbors(idx: number): number[] {
  const r = Math.floor(idx / BUBBLES_COLS);
  const c = idx % BUBBLES_COLS;
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
    .filter(([nr, nc]) => nr >= 0 && nr < BUBBLES_ROWS && nc >= 0 && nc < BUBBLES_COLS)
    .map(([nr, nc]) => nr * BUBBLES_COLS + nc);
}

export function findGroup(grid: Cell[], idx: number): number[] {
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

export function dropFloating(grid: Cell[]): {
  grid: Cell[];
  removed: number;
  removedIdx: number[];
} {
  const anchored = new Set<number>();
  const stack: number[] = [];
  for (let c = 0; c < BUBBLES_COLS; c++) {
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

export function cellCenter(idx: number): { x: number; y: number } {
  const r = Math.floor(idx / BUBBLES_COLS);
  const c = idx % BUBBLES_COLS;
  const offsetX = r % 2 === 1 ? 0.5 : 0;
  return {
    x: (c + offsetX + 0.5) * BUBBLES_CELL,
    y: (r + 0.5) * BUBBLES_CELL,
  };
}
