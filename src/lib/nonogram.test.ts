import { describe, it, expect } from 'vitest';
import { computeHints, generate, isSolved } from './nonogram';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('nonogram', () => {
  it('computeHints returns runs of filled cells', () => {
    expect(computeHints([1, 1, 0, 1, 0, 1, 1, 1])).toEqual([2, 1, 3]);
    expect(computeHints([0, 0, 0])).toEqual([0]);
    expect(computeHints([1, 1, 1])).toEqual([3]);
    expect(computeHints([1])).toEqual([1]);
  });

  it('generate produces hints that match the solution', () => {
    const size = 5;
    const puzzle = generate(size, seededRng([0.1, 0.4, 0.7, 0.2, 0.5, 0.8, 0.3, 0.6, 0.9]));
    expect(puzzle.size).toBe(size);
    expect(puzzle.solution.length).toBe(size * size);
    expect(puzzle.rowHints.length).toBe(size);
    expect(puzzle.colHints.length).toBe(size);
    for (let r = 0; r < size; r++) {
      const row = Array.from({ length: size }, (_, c) => puzzle.solution[r * size + c]!);
      expect(puzzle.rowHints[r]).toEqual(computeHints(row));
    }
    for (let c = 0; c < size; c++) {
      const col = Array.from({ length: size }, (_, r) => puzzle.solution[r * size + c]!);
      expect(puzzle.colHints[c]).toEqual(computeHints(col));
    }
  });

  it('isSolved requires filled cells to match exactly', () => {
    const puzzle = generate(4, seededRng([0.1, 0.4, 0.6, 0.9]));
    const matching = puzzle.solution.map((v) => (v === 1 ? 1 : 0)) as (0 | 1 | 2)[];
    expect(isSolved(puzzle, matching)).toBe(true);
    // Marks (2) on empty cells are fine, on filled cells they are not.
    const wrong = matching.slice();
    const firstFilled = puzzle.solution.findIndex((v) => v === 1);
    if (firstFilled >= 0) {
      wrong[firstFilled] = 2;
      expect(isSolved(puzzle, wrong)).toBe(false);
    }
  });
});
