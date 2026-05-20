export const COLOR_FLOOD_SIZE = 14;
export const COLOR_FLOOD_MAX_MOVES = 25;
export const COLOR_FLOOD_PALETTE = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f1c40f',
  '#9b59b6',
  '#e67e22',
] as const;
export const COLOR_FLOOD_COLORS = COLOR_FLOOD_PALETTE.length;

export interface ColorFloodState {
  grid: number[];
  moves: number;
  won: boolean;
  lost: boolean;
}

function index(row: number, col: number): number {
  return row * COLOR_FLOOD_SIZE + col;
}

export function generateGrid(rng: () => number = Math.random): number[] {
  const grid = new Array<number>(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.floor(rng() * COLOR_FLOOD_COLORS);
  }
  return grid;
}

export function createInitialState(rng: () => number = Math.random): ColorFloodState {
  return { grid: generateGrid(rng), moves: 0, won: false, lost: false };
}

export function isWon(grid: number[]): boolean {
  const first = grid[0];
  for (let i = 1; i < grid.length; i++) {
    if (grid[i] !== first) return false;
  }
  return true;
}

export function floodedCells(grid: number[]): number {
  const target = grid[0];
  const visited = new Uint8Array(grid.length);
  const queue: number[] = [0];
  visited[0] = 1;
  let count = 0;
  while (queue.length) {
    const idx = queue.shift()!;
    count++;
    const row = Math.floor(idx / COLOR_FLOOD_SIZE);
    const col = idx % COLOR_FLOOD_SIZE;
    const neighbours: [number, number][] = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    for (const [nr, nc] of neighbours) {
      if (nr < 0 || nr >= COLOR_FLOOD_SIZE || nc < 0 || nc >= COLOR_FLOOD_SIZE) continue;
      const ni = index(nr, nc);
      if (visited[ni]) continue;
      if (grid[ni] !== target) continue;
      visited[ni] = 1;
      queue.push(ni);
    }
  }
  return count;
}

export function floodPercent(grid: number[]): number {
  return Math.round((floodedCells(grid) / grid.length) * 100);
}

export function applyMove(state: ColorFloodState, colorIdx: number): ColorFloodState {
  if (state.won || state.lost) return state;
  const oldColor = state.grid[0];
  if (colorIdx === oldColor) return state;

  const next = state.grid.slice();
  const visited = new Uint8Array(next.length);
  const queue: number[] = [0];
  visited[0] = 1;
  while (queue.length) {
    const idx = queue.shift()!;
    next[idx] = colorIdx;
    const row = Math.floor(idx / COLOR_FLOOD_SIZE);
    const col = idx % COLOR_FLOOD_SIZE;
    const neighbours: [number, number][] = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    for (const [nr, nc] of neighbours) {
      if (nr < 0 || nr >= COLOR_FLOOD_SIZE || nc < 0 || nc >= COLOR_FLOOD_SIZE) continue;
      const ni = index(nr, nc);
      if (visited[ni]) continue;
      if (next[ni] === oldColor || next[ni] === colorIdx) {
        visited[ni] = 1;
        queue.push(ni);
      }
    }
  }

  const moves = state.moves + 1;
  const won = isWon(next);
  const lost = !won && moves >= COLOR_FLOOD_MAX_MOVES;
  return { grid: next, moves, won, lost };
}
