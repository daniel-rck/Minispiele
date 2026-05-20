import { describe, expect, it } from 'vitest';
import {
  applyMove,
  COLOR_FLOOD_COLORS,
  COLOR_FLOOD_MAX_MOVES,
  COLOR_FLOOD_SIZE,
  createInitialState,
  floodedCells,
  floodPercent,
  isWon,
} from './colorFlood';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('colorFlood', () => {
  it('createInitialState produces a grid of N*N cells with valid colour indices', () => {
    const state = createInitialState();
    expect(state.grid.length).toBe(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE);
    expect(state.moves).toBe(0);
    expect(state.won).toBe(false);
    expect(state.lost).toBe(false);
    for (const c of state.grid) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(COLOR_FLOOD_COLORS);
    }
  });

  it('isWon recognises a uniformly coloured grid', () => {
    expect(isWon(new Array(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE).fill(2))).toBe(true);
    const mixed = new Array(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE).fill(2);
    mixed[5] = 1;
    expect(isWon(mixed)).toBe(false);
  });

  it('floodedCells counts only the connected blob touching the origin', () => {
    const size = COLOR_FLOOD_SIZE;
    const grid = new Array<number>(size * size).fill(1);
    grid[0] = 0;
    grid[1] = 0;
    grid[size] = 0;
    // A separate "0" island in the bottom right corner should NOT be counted.
    grid[size * size - 1] = 0;
    expect(floodedCells(grid)).toBe(3);
  });

  it('floodPercent returns 100 for a uniform grid', () => {
    const grid = new Array<number>(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE).fill(4);
    expect(floodPercent(grid)).toBe(100);
  });

  it('applyMove repaints the connected region from (0,0) to the new colour', () => {
    const size = COLOR_FLOOD_SIZE;
    const grid = new Array<number>(size * size).fill(1);
    grid[0] = 0;
    grid[1] = 0;
    grid[size] = 0;
    const state = { grid, moves: 0, won: false, lost: false };
    const next = applyMove(state, 1);
    expect(next.moves).toBe(1);
    expect(next.won).toBe(true);
    expect(next.grid[0]).toBe(1);
  });

  it('applyMove ignores moves that pick the current colour', () => {
    const state = createInitialState(seededRng([0]));
    const colour = state.grid[0] ?? 0;
    const next = applyMove(state, colour);
    expect(next).toBe(state);
  });

  it('applyMove flags lost once the move budget is exhausted without a win', () => {
    const size = COLOR_FLOOD_SIZE;
    // Row 0 = colour 0, row 1 acts as a colour-2 wall, the rest stays colour 0.
    // Applying colour 1 only repaints row 0 — the grid stays multicoloured.
    const grid = new Array<number>(size * size).fill(0);
    for (let c = 0; c < size; c++) grid[size + c] = 2;
    let state = { grid, moves: COLOR_FLOOD_MAX_MOVES - 1, won: false, lost: false };
    state = applyMove(state, 1);
    expect(state.moves).toBe(COLOR_FLOOD_MAX_MOVES);
    expect(state.won).toBe(false);
    expect(state.lost).toBe(true);
  });

  it('applyMove is a no-op once the game ended', () => {
    const state = {
      grid: new Array<number>(COLOR_FLOOD_SIZE * COLOR_FLOOD_SIZE).fill(0),
      moves: 1,
      won: true,
      lost: false,
    };
    expect(applyMove(state, 2)).toBe(state);
  });
});
