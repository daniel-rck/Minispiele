export type SudokuDifficulty = 'easy' | 'medium' | 'hard';
export const SUDOKU_SIZE = 9;
const BOX = 3;
const TOTAL = SUDOKU_SIZE * SUDOKU_SIZE;

const CLUE_COUNTS: Record<SudokuDifficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
};

export interface SudokuCell {
  value: number;
  given: boolean;
  notes: number[];
}

export interface SudokuPuzzle {
  cells: SudokuCell[];
  solution: number[];
  difficulty: SudokuDifficulty;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function canPlace(grid: number[], idx: number, value: number): boolean {
  const row = Math.floor(idx / SUDOKU_SIZE);
  const col = idx % SUDOKU_SIZE;
  for (let i = 0; i < SUDOKU_SIZE; i++) {
    if (grid[row * SUDOKU_SIZE + i] === value) return false;
    if (grid[i * SUDOKU_SIZE + col] === value) return false;
  }
  const br = Math.floor(row / BOX) * BOX;
  const bc = Math.floor(col / BOX) * BOX;
  for (let r = br; r < br + BOX; r++) {
    for (let c = bc; c < bc + BOX; c++) {
      if (grid[r * SUDOKU_SIZE + c] === value) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[], idx: number, rng: () => number): boolean {
  if (idx >= TOTAL) return true;
  if (grid[idx] !== 0) return fillGrid(grid, idx + 1, rng);
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  for (const v of values) {
    if (canPlace(grid, idx, v)) {
      grid[idx] = v;
      if (fillGrid(grid, idx + 1, rng)) return true;
      grid[idx] = 0;
    }
  }
  return false;
}

function countSolutions(grid: number[], limit: number): number {
  const idx = grid.indexOf(0);
  if (idx === -1) return 1;
  let count = 0;
  for (let v = 1; v <= 9; v++) {
    if (canPlace(grid, idx, v)) {
      grid[idx] = v;
      count += countSolutions(grid, limit - count);
      grid[idx] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

export function generatePuzzle(
  difficulty: SudokuDifficulty,
  rng: () => number = Math.random,
): SudokuPuzzle {
  const solution: number[] = new Array(TOTAL).fill(0);
  fillGrid(solution, 0, rng);
  const puzzle = solution.slice();
  const target = CLUE_COUNTS[difficulty];
  const indices = shuffle(
    Array.from({ length: TOTAL }, (_, i) => i),
    rng,
  );
  let clues = TOTAL;
  for (const idx of indices) {
    if (clues <= target) break;
    const saved = puzzle[idx]!;
    puzzle[idx] = 0;
    const work = puzzle.slice();
    if (countSolutions(work, 2) === 1) {
      clues--;
    } else {
      puzzle[idx] = saved;
    }
  }
  const cells: SudokuCell[] = puzzle.map((v) => ({
    value: v,
    given: v !== 0,
    notes: [],
  }));
  return { cells, solution, difficulty };
}

export function isComplete(cells: SudokuCell[], solution: number[]): boolean {
  return cells.every((c, i) => c.value === solution[i]);
}

export function conflictsAt(cells: SudokuCell[], idx: number): boolean {
  const value = cells[idx]?.value ?? 0;
  if (value === 0) return false;
  const row = Math.floor(idx / SUDOKU_SIZE);
  const col = idx % SUDOKU_SIZE;
  for (let i = 0; i < SUDOKU_SIZE; i++) {
    const ri = row * SUDOKU_SIZE + i;
    const ci = i * SUDOKU_SIZE + col;
    if (ri !== idx && cells[ri]?.value === value) return true;
    if (ci !== idx && cells[ci]?.value === value) return true;
  }
  const br = Math.floor(row / BOX) * BOX;
  const bc = Math.floor(col / BOX) * BOX;
  for (let r = br; r < br + BOX; r++) {
    for (let c = bc; c < bc + BOX; c++) {
      const i = r * SUDOKU_SIZE + c;
      if (i !== idx && cells[i]?.value === value) return true;
    }
  }
  return false;
}
