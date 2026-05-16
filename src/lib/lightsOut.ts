export const LIGHTS_SIZE = 5;

export interface LightsState {
  grid: boolean[];
  moves: number;
  solved: boolean;
}

export function toggleCell(grid: boolean[], idx: number): boolean[] {
  const next = grid.slice();
  const x = idx % LIGHTS_SIZE;
  const y = Math.floor(idx / LIGHTS_SIZE);
  const flip = (px: number, py: number) => {
    if (px < 0 || px >= LIGHTS_SIZE || py < 0 || py >= LIGHTS_SIZE) return;
    const i = py * LIGHTS_SIZE + px;
    next[i] = !next[i];
  };
  flip(x, y);
  flip(x - 1, y);
  flip(x + 1, y);
  flip(x, y - 1);
  flip(x, y + 1);
  return next;
}

export function isAllOff(grid: boolean[]): boolean {
  return grid.every((v) => !v);
}

export function generatePuzzle(steps: number, rng: () => number = Math.random): boolean[] {
  let grid: boolean[] = new Array(LIGHTS_SIZE * LIGHTS_SIZE).fill(false);
  const used = new Set<number>();
  while (used.size < steps) {
    const idx = Math.floor(rng() * grid.length);
    if (used.has(idx)) continue;
    used.add(idx);
    grid = toggleCell(grid, idx);
  }
  if (isAllOff(grid)) {
    grid = toggleCell(grid, 0);
  }
  return grid;
}

export function press(state: LightsState, idx: number): LightsState {
  if (state.solved) return state;
  const grid = toggleCell(state.grid, idx);
  const solved = isAllOff(grid);
  return { grid, moves: state.moves + 1, solved };
}

export function createInitialState(steps: number, rng: () => number = Math.random): LightsState {
  return {
    grid: generatePuzzle(steps, rng),
    moves: 0,
    solved: false,
  };
}
