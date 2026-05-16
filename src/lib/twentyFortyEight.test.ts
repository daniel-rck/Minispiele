import { describe, it, expect } from 'vitest';
import {
  createInitialGrid,
  emptyGrid,
  hasWinningTile,
  isGameOver,
  makeSeededRng,
  slide,
  spawnRandom,
} from './twentyFortyEight';

describe('twentyFortyEight.emptyGrid', () => {
  it('returns 16 zeros', () => {
    const g = emptyGrid();
    expect(g).toHaveLength(16);
    expect(g.every((v) => v === 0)).toBe(true);
  });
});

describe('twentyFortyEight.createInitialGrid', () => {
  it('spawns exactly two non-zero tiles', () => {
    const rng = makeSeededRng(1);
    const g = createInitialGrid(rng);
    const nonZero = g.filter((v) => v !== 0);
    expect(nonZero).toHaveLength(2);
    expect(nonZero.every((v) => v === 2 || v === 4)).toBe(true);
  });
});

describe('twentyFortyEight.spawnRandom', () => {
  it('leaves a full grid unchanged', () => {
    const full = Array.from({ length: 16 }, (_, i) => i + 2);
    const next = spawnRandom(full);
    expect(next).toEqual(full);
  });
});

describe('twentyFortyEight.slide', () => {
  function fromRows(...rows: number[][]): number[] {
    return rows.flat();
  }

  it('slides values to the left and packs them', () => {
    const grid = fromRows([0, 2, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { grid: next, moved, gained } = slide(grid, 'left');
    expect(next.slice(0, 4)).toEqual([4, 0, 0, 0]);
    expect(moved).toBe(true);
    expect(gained).toBe(4);
  });

  it('merges only adjacent equal tiles once', () => {
    const grid = fromRows([2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { grid: next, gained } = slide(grid, 'left');
    expect(next.slice(0, 4)).toEqual([4, 4, 0, 0]);
    expect(gained).toBe(8);
  });

  it('does not merge 2 + 4 (different values)', () => {
    const grid = fromRows([2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { grid: next, gained } = slide(grid, 'left');
    expect(next.slice(0, 4)).toEqual([2, 4, 0, 0]);
    expect(gained).toBe(0);
  });

  it('slides right correctly', () => {
    const grid = fromRows([2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { grid: next } = slide(grid, 'right');
    expect(next.slice(0, 4)).toEqual([0, 0, 0, 4]);
  });

  it('slides up correctly', () => {
    const grid = fromRows([2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { grid: next } = slide(grid, 'up');
    expect(next[0]).toBe(4);
    expect(next[4]).toBe(0);
  });

  it('reports moved=false when nothing changes', () => {
    const grid = fromRows([4, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    const { moved } = slide(grid, 'left');
    expect(moved).toBe(false);
  });
});

describe('twentyFortyEight.isGameOver', () => {
  it('is false when empties remain', () => {
    expect(isGameOver(emptyGrid())).toBe(false);
  });

  it('is false when adjacent equal tiles exist', () => {
    const full = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 4];
    expect(isGameOver(full)).toBe(false);
  });

  it('is true when no moves remain', () => {
    const full = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(isGameOver(full)).toBe(true);
  });
});

describe('twentyFortyEight.hasWinningTile', () => {
  it('detects 2048', () => {
    const g = emptyGrid();
    g[0] = 2048;
    expect(hasWinningTile(g)).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(hasWinningTile(emptyGrid())).toBe(false);
  });
});
