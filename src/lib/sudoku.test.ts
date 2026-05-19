import { describe, expect, it } from 'vitest';
import { conflictsAt, generatePuzzle, isComplete, SUDOKU_SIZE } from './sudoku';

function seededRng(seed: number): () => number {
  // Mulberry32-style PRNG so generatePuzzle is deterministic but varied enough.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

describe('sudoku', () => {
  it('generatePuzzle produces a valid solution of the right size', () => {
    const puzzle = generatePuzzle('easy', seededRng(1));
    expect(puzzle.cells.length).toBe(SUDOKU_SIZE * SUDOKU_SIZE);
    expect(puzzle.solution.length).toBe(SUDOKU_SIZE * SUDOKU_SIZE);

    // Solution: each row, column and 3x3 box has digits 1-9 exactly once.
    for (let r = 0; r < SUDOKU_SIZE; r++) {
      const row = new Set(puzzle.solution.slice(r * SUDOKU_SIZE, (r + 1) * SUDOKU_SIZE));
      expect(row.size).toBe(SUDOKU_SIZE);
    }
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      const col = new Set();
      for (let r = 0; r < SUDOKU_SIZE; r++) col.add(puzzle.solution[r * SUDOKU_SIZE + c]);
      expect(col.size).toBe(SUDOKU_SIZE);
    }

    // Givens must match the solution at their position.
    for (let i = 0; i < puzzle.cells.length; i++) {
      const cell = puzzle.cells[i]!;
      if (cell.given) {
        expect(cell.value).toBe(puzzle.solution[i]);
      } else {
        expect(cell.value).toBe(0);
      }
    }
  });

  it('isComplete is true when every cell matches the solution', () => {
    const puzzle = generatePuzzle('hard', seededRng(7));
    const full = puzzle.solution.map((v) => ({ value: v, given: true, notes: [] }));
    expect(isComplete(full, puzzle.solution)).toBe(true);
    expect(isComplete(puzzle.cells, puzzle.solution)).toBe(false);
  });

  it('conflictsAt finds duplicates in row, column or box', () => {
    const cells = Array.from({ length: SUDOKU_SIZE * SUDOKU_SIZE }, () => ({
      value: 0,
      given: false,
      notes: [] as number[],
    }));
    cells[0]!.value = 5;
    cells[1]!.value = 5; // same row conflict
    expect(conflictsAt(cells, 0)).toBe(true);
    expect(conflictsAt(cells, 1)).toBe(true);
    cells[1]!.value = 0;
    cells[SUDOKU_SIZE]!.value = 5; // same column conflict
    expect(conflictsAt(cells, 0)).toBe(true);
    cells[SUDOKU_SIZE]!.value = 0;
    cells[10]!.value = 5; // same 3x3 box conflict (row 1 col 1)
    expect(conflictsAt(cells, 0)).toBe(true);
  });

  it('conflictsAt returns false for empty cells', () => {
    const cells = Array.from({ length: SUDOKU_SIZE * SUDOKU_SIZE }, () => ({
      value: 0,
      given: false,
      notes: [] as number[],
    }));
    expect(conflictsAt(cells, 0)).toBe(false);
  });
});
