import { describe, expect, it } from 'vitest';
import {
  BUBBLES_COLOR_COUNT,
  BUBBLES_COLORS,
  BUBBLES_COLS,
  BUBBLES_ROWS,
  buildInitial,
  type Cell,
  cellCenter,
  dropFloating,
  findGroup,
  neighbors,
  randomColor,
} from './bubbles';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

function emptyGrid(): Cell[] {
  return new Array(BUBBLES_ROWS * BUBBLES_COLS).fill(-1);
}

describe('bubbles', () => {
  it('exposes one hex color per color slot', () => {
    expect(BUBBLES_COLORS).toHaveLength(BUBBLES_COLOR_COUNT);
  });

  it('randomColor maps rng into the color range', () => {
    expect(randomColor(seededRng([0]))).toBe(0);
    expect(randomColor(seededRng([0.99]))).toBe(BUBBLES_COLOR_COUNT - 1);
  });

  it('buildInitial fills the top four rows and leaves the rest empty', () => {
    const state = buildInitial(seededRng([0.1]));
    expect(state.grid).toHaveLength(BUBBLES_ROWS * BUBBLES_COLS);
    // Top four rows filled with a valid color.
    for (let i = 0; i < 4 * BUBBLES_COLS; i++) {
      expect(state.grid[i]).toBeGreaterThanOrEqual(0);
    }
    // Remaining rows empty.
    for (let i = 4 * BUBBLES_COLS; i < state.grid.length; i++) {
      expect(state.grid[i]).toBe(-1);
    }
    expect(state.score).toBe(0);
    expect(state.done).toBe(false);
  });

  it('neighbors returns the horizontal siblings within the top row', () => {
    // idx 0 (row 0, col 0): right sibling (1) and the two cells below it.
    expect(neighbors(0)).toContain(1);
    expect(neighbors(0)).toContain(BUBBLES_COLS); // (1,0)
    // No out-of-bounds negative indices.
    expect(neighbors(0).every((n) => n >= 0)).toBe(true);
  });

  it('neighbors of an even and an odd row differ in their diagonal offset', () => {
    const evenRowCell = 1 * 0 + 3; // row 0, col 3
    const oddRowCell = BUBBLES_COLS + 3; // row 1, col 3
    expect(neighbors(evenRowCell)).not.toEqual(neighbors(oddRowCell));
  });

  it('findGroup collects all connected same-color bubbles', () => {
    const grid = emptyGrid();
    grid[0] = 2;
    grid[1] = 2; // horizontal neighbor, same color
    grid[2] = 3; // different color, excluded
    const group = findGroup(grid, 0).sort((a, b) => a - b);
    expect(group).toEqual([0, 1]);
  });

  it('findGroup returns empty for an empty cell', () => {
    expect(findGroup(emptyGrid(), 0)).toEqual([]);
  });

  it('dropFloating removes bubbles not connected to the top row', () => {
    const grid = emptyGrid();
    grid[0] = 1; // anchored to the ceiling
    const floatingIdx = 4 * BUBBLES_COLS + 4; // somewhere in the middle, unconnected
    grid[floatingIdx] = 3;

    const result = dropFloating(grid);
    expect(result.removed).toBe(1);
    expect(result.removedIdx).toEqual([floatingIdx]);
    expect(result.grid[floatingIdx]).toBe(-1);
    expect(result.grid[0]).toBe(1); // the anchored bubble stays
  });

  it('cellCenter offsets odd rows by half a cell', () => {
    const even = cellCenter(0); // row 0
    const odd = cellCenter(BUBBLES_COLS); // row 1, col 0
    expect(odd.x).toBeGreaterThan(even.x);
  });
});
