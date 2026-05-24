export type MineDifficulty = 'easy' | 'medium' | 'hard';
export type MinesMode = 'rect' | 'hex';

export interface MineCell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export interface MinesweeperState {
  grid: MineCell[];
  cols: number;
  rows: number;
  mines: number;
  revealed: number;
  flagged: number;
  lost: boolean;
  won: boolean;
  firstClick: boolean;
  difficulty: MineDifficulty;
  mode: MinesMode;
  /** Index of the mine that ended the game, or null. */
  losingIdx: number | null;
}

export interface DifficultyConfig {
  cols: number;
  rows: number;
  mines: number;
}

export const DIFFICULTY: Readonly<Record<MineDifficulty, DifficultyConfig>> = {
  easy: { cols: 9, rows: 9, mines: 10 },
  medium: { cols: 10, rows: 14, mines: 22 },
  hard: { cols: 12, rows: 18, mines: 42 },
};

export const HEX_DIFFICULTY: Readonly<Record<MineDifficulty, DifficultyConfig>> = {
  easy: { cols: 8, rows: 8, mines: 10 },
  medium: { cols: 10, rows: 10, mines: 18 },
  hard: { cols: 12, rows: 12, mines: 30 },
};

export function configFor(mode: MinesMode, difficulty: MineDifficulty): DifficultyConfig {
  return mode === 'hex' ? HEX_DIFFICULTY[difficulty] : DIFFICULTY[difficulty];
}

function emptyCell(): MineCell {
  return { mine: false, revealed: false, flagged: false, adjacent: 0 };
}

export function createInitialState(
  difficulty: MineDifficulty,
  mode: MinesMode = 'rect',
): MinesweeperState {
  const cfg = configFor(mode, difficulty);
  const total = cfg.cols * cfg.rows;
  const grid = Array.from({ length: total }, emptyCell);
  return {
    grid,
    cols: cfg.cols,
    rows: cfg.rows,
    mines: cfg.mines,
    revealed: 0,
    flagged: 0,
    lost: false,
    won: false,
    firstClick: true,
    difficulty,
    mode,
    losingIdx: null,
  };
}

function rectNeighbors(idx: number, cols: number, rows: number): number[] {
  const x = idx % cols;
  const y = Math.floor(idx / cols);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        result.push(ny * cols + nx);
      }
    }
  }
  return result;
}

function hexNeighbors(idx: number, cols: number, rows: number): number[] {
  const c = idx % cols;
  const r = Math.floor(idx / cols);
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
  const result: number[] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      result.push(nr * cols + nc);
    }
  }
  return result;
}

function neighborIndices(
  idx: number,
  cols: number,
  rows: number,
  mode: MinesMode = 'rect',
): number[] {
  return mode === 'hex' ? hexNeighbors(idx, cols, rows) : rectNeighbors(idx, cols, rows);
}

function computeAdjacents(
  grid: MineCell[],
  cols: number,
  rows: number,
  mode: MinesMode = 'rect',
): void {
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i]!;
    if (cell.mine) continue;
    let count = 0;
    for (const n of neighborIndices(i, cols, rows, mode)) {
      if (grid[n]!.mine) count += 1;
    }
    cell.adjacent = count;
  }
}

export function placeMinesAvoiding(
  state: MinesweeperState,
  firstIdx: number,
  rng: () => number = Math.random,
): MinesweeperState {
  const { cols, rows, mines, mode } = state;
  const total = cols * rows;
  const forbidden = new Set<number>([firstIdx, ...neighborIndices(firstIdx, cols, rows, mode)]);
  const available: number[] = [];
  for (let i = 0; i < total; i++) if (!forbidden.has(i)) available.push(i);

  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = available[i]!;
    available[i] = available[j]!;
    available[j] = tmp;
  }

  const minesToPlace = Math.min(mines, available.length);
  const mineSet = new Set(available.slice(0, minesToPlace));
  const grid = state.grid.map((cell, i) => ({ ...cell, mine: mineSet.has(i) }));
  computeAdjacents(grid, cols, rows, mode);
  return { ...state, grid, firstClick: false };
}

function nonMineCellCount(state: MinesweeperState): number {
  return state.cols * state.rows - state.mines;
}

function checkWin(state: MinesweeperState): MinesweeperState {
  if (state.lost) return state;
  if (state.revealed >= nonMineCellCount(state)) {
    return { ...state, won: true };
  }
  return state;
}

export function reveal(
  state: MinesweeperState,
  idx: number,
  rng: () => number = Math.random,
): MinesweeperState {
  if (state.lost || state.won) return state;
  const cell = state.grid[idx];
  if (!cell || cell.flagged || cell.revealed) return state;

  let working = state;
  if (state.firstClick) {
    working = placeMinesAvoiding(state, idx, rng);
  }

  const target = working.grid[idx]!;
  if (target.mine) {
    const grid = working.grid.map((c, i) => ({
      ...c,
      revealed: i === idx ? true : c.revealed,
    }));
    return { ...working, grid, lost: true, losingIdx: idx };
  }

  const grid = working.grid.map((c) => ({ ...c }));
  const queue: number[] = [idx];
  let revealedDelta = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const c = grid[current]!;
    if (c.revealed || c.flagged || c.mine) continue;
    c.revealed = true;
    revealedDelta += 1;
    if (c.adjacent === 0) {
      for (const n of neighborIndices(current, working.cols, working.rows, working.mode)) {
        const nc = grid[n]!;
        if (!nc.revealed && !nc.flagged && !nc.mine) queue.push(n);
      }
    }
  }
  const next: MinesweeperState = {
    ...working,
    grid,
    revealed: working.revealed + revealedDelta,
  };
  return checkWin(next);
}

export function toggleFlag(state: MinesweeperState, idx: number): MinesweeperState {
  if (state.lost || state.won) return state;
  const cell = state.grid[idx];
  if (!cell || cell.revealed) return state;
  const grid = state.grid.map((c, i) => (i === idx ? { ...c, flagged: !c.flagged } : c));
  const flagged = state.flagged + (cell.flagged ? -1 : 1);
  return { ...state, grid, flagged };
}
