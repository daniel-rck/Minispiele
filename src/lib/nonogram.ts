export type Cell = 0 | 1 | 2; // 0 empty, 1 filled, 2 marked X

export interface Nonogram {
  size: number;
  solution: number[]; // 0 or 1
  rowHints: number[][];
  colHints: number[][];
}

export function computeHints(line: number[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v === 1) run++;
    else if (run > 0) {
      out.push(run);
      run = 0;
    }
  }
  if (run > 0) out.push(run);
  if (out.length === 0) out.push(0);
  return out;
}

export function generate(size: number, rng: () => number = Math.random): Nonogram {
  const solution = new Array(size * size).fill(0) as number[];
  // generate semi-dense pattern (50-60% fill)
  for (let i = 0; i < solution.length; i++) {
    solution[i] = rng() < 0.55 ? 1 : 0;
  }
  // ensure not empty: at least one filled per row/col
  for (let r = 0; r < size; r++) {
    if (!Array.from({ length: size }, (_, c) => solution[r * size + c]).some((v) => v === 1)) {
      const c = Math.floor(rng() * size);
      solution[r * size + c] = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    if (!Array.from({ length: size }, (_, r) => solution[r * size + c]).some((v) => v === 1)) {
      const r = Math.floor(rng() * size);
      solution[r * size + c] = 1;
    }
  }
  const rowHints: number[][] = [];
  const colHints: number[][] = [];
  for (let r = 0; r < size; r++) {
    rowHints.push(computeHints(Array.from({ length: size }, (_, c) => solution[r * size + c]!)));
  }
  for (let c = 0; c < size; c++) {
    colHints.push(computeHints(Array.from({ length: size }, (_, r) => solution[r * size + c]!)));
  }
  return { size, solution, rowHints, colHints };
}

export function isSolved(puzzle: Nonogram, cells: Cell[]): boolean {
  for (let i = 0; i < puzzle.solution.length; i++) {
    const sol = puzzle.solution[i];
    const cell = cells[i];
    if (sol === 1 && cell !== 1) return false;
    if (sol === 0 && cell === 1) return false;
  }
  return true;
}
