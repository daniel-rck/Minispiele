export type Direction = 'left' | 'right' | 'up' | 'down';
export const GRID_SIZE = 4;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const WINNING_TILE = 2048;

export interface SlideResult {
  grid: number[];
  moved: boolean;
  gained: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let defaultRng: () => number = Math.random;

export function setRng(rng: () => number): void {
  defaultRng = rng;
}

export function makeSeededRng(seed: number): () => number {
  return mulberry32(seed);
}

export function emptyGrid(): number[] {
  return Array.from({ length: CELL_COUNT }, () => 0);
}

export function spawnRandom(grid: readonly number[], rng: () => number = defaultRng): number[] {
  const empties: number[] = [];
  grid.forEach((v, i) => {
    if (v === 0) empties.push(i);
  });
  if (empties.length === 0) return grid.slice();
  const pick = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const next = grid.slice();
  if (pick !== undefined) next[pick] = value;
  return next;
}

export function createInitialGrid(rng: () => number = defaultRng): number[] {
  let g = emptyGrid();
  g = spawnRandom(g, rng);
  g = spawnRandom(g, rng);
  return g;
}

function getRow(grid: readonly number[], row: number): number[] {
  return [
    grid[row * GRID_SIZE + 0] ?? 0,
    grid[row * GRID_SIZE + 1] ?? 0,
    grid[row * GRID_SIZE + 2] ?? 0,
    grid[row * GRID_SIZE + 3] ?? 0,
  ];
}

function setRow(grid: number[], row: number, values: readonly number[]): void {
  for (let c = 0; c < GRID_SIZE; c++) {
    grid[row * GRID_SIZE + c] = values[c] ?? 0;
  }
}

function getCol(grid: readonly number[], col: number): number[] {
  return [
    grid[0 * GRID_SIZE + col] ?? 0,
    grid[1 * GRID_SIZE + col] ?? 0,
    grid[2 * GRID_SIZE + col] ?? 0,
    grid[3 * GRID_SIZE + col] ?? 0,
  ];
}

function setCol(grid: number[], col: number, values: readonly number[]): void {
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r * GRID_SIZE + col] = values[r] ?? 0;
  }
}

function slideLine(line: readonly number[]): { line: number[]; gained: number } {
  const nonZero = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < nonZero.length) {
    const a = nonZero[i];
    const b = nonZero[i + 1];
    if (a !== undefined && b !== undefined && a === b) {
      const merged = a * 2;
      out.push(merged);
      gained += merged;
      i += 2;
    } else if (a !== undefined) {
      out.push(a);
      i += 1;
    } else {
      i += 1;
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained };
}

export function slide(grid: readonly number[], direction: Direction): SlideResult {
  const next = grid.slice();
  let gained = 0;
  let moved = false;

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = getRow(next, r);
      const source = direction === 'left' ? row : row.slice().reverse();
      const { line, gained: g } = slideLine(source);
      const result = direction === 'left' ? line : line.slice().reverse();
      gained += g;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (result[c] !== row[c]) moved = true;
      }
      setRow(next, r, result);
    }
  } else {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = getCol(next, c);
      const source = direction === 'up' ? col : col.slice().reverse();
      const { line, gained: g } = slideLine(source);
      const result = direction === 'up' ? line : line.slice().reverse();
      gained += g;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (result[r] !== col[r]) moved = true;
      }
      setCol(next, c, result);
    }
  }

  return { grid: next, moved, gained };
}

export function isGameOver(grid: readonly number[]): boolean {
  if (grid.some((v) => v === 0)) return false;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = grid[r * GRID_SIZE + c];
      const right = grid[r * GRID_SIZE + c + 1];
      const below = grid[(r + 1) * GRID_SIZE + c];
      if (c + 1 < GRID_SIZE && v === right) return false;
      if (r + 1 < GRID_SIZE && v === below) return false;
    }
  }
  return true;
}

export function hasWinningTile(grid: readonly number[]): boolean {
  return grid.some((v) => v >= WINNING_TILE);
}
