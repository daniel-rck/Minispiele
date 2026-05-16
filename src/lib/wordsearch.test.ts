import { describe, it, expect } from 'vitest';
import { generate, lineBetween, matchWord } from './wordsearch';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('wordsearch', () => {
  it('generate creates a grid with the requested size and at most wordCount words', () => {
    const puzzle = generate(
      8,
      4,
      seededRng([0.1, 0.4, 0.2, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8, 0.05, 0.45, 0.85]),
    );
    expect(puzzle.size).toBe(8);
    expect(puzzle.grid.length).toBe(64);
    expect(puzzle.words.length).toBeLessThanOrEqual(4);
    // Each grid cell is a single uppercase letter.
    for (const ch of puzzle.grid) {
      expect(ch).toMatch(/^[A-Z]$/);
    }
    // Every placed word reads forward along its cells.
    for (const w of puzzle.words) {
      const read = w.cells.map((i) => puzzle.grid[i]).join('');
      expect(read).toBe(w.word);
    }
  });

  it('lineBetween returns the orthogonal line between two cells', () => {
    expect(lineBetween(0, 4, 5)).toEqual([0, 1, 2, 3, 4]); // horizontal
    expect(lineBetween(0, 20, 5)).toEqual([0, 5, 10, 15, 20]); // vertical
    expect(lineBetween(0, 24, 5)).toEqual([0, 6, 12, 18, 24]); // diagonal
    expect(lineBetween(0, 0, 5)).toEqual([0]);
  });

  it('lineBetween rejects non-line pairs', () => {
    expect(lineBetween(0, 7, 5)).toBeNull(); // knight-ish
  });

  it('matchWord finds a placed word and rejects unrelated cells', () => {
    const puzzle = generate(
      8,
      6,
      seededRng([0.1, 0.4, 0.2, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8, 0.05, 0.45, 0.85]),
    );
    if (puzzle.words.length === 0) return; // nothing to assert
    const w = puzzle.words[0]!;
    expect(matchWord(puzzle, w.cells)).toEqual(w);
    // Reversed cells also match (the player may drag either direction)
    expect(matchWord(puzzle, w.cells.slice().reverse())).toEqual(w);
    // A single cell shouldn't match a multi-letter word.
    expect(matchWord(puzzle, [w.cells[0]!])).toBeNull();
  });
});
