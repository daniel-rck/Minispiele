import { describe, it, expect } from 'vitest';
import {
  LIGHTS_SIZE,
  createInitialState,
  generatePuzzle,
  isAllOff,
  press,
  toggleCell,
} from './lightsOut';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('lightsOut', () => {
  it('toggleCell flips the cell and its orthogonal neighbours', () => {
    const grid: boolean[] = new Array(LIGHTS_SIZE * LIGHTS_SIZE).fill(false);
    const next = toggleCell(grid, 12); // centre of a 5x5 grid
    expect(next[12]).toBe(true);
    expect(next[7]).toBe(true);
    expect(next[17]).toBe(true);
    expect(next[11]).toBe(true);
    expect(next[13]).toBe(true);
    // diagonals stay off
    expect(next[6]).toBe(false);
    expect(next[18]).toBe(false);
  });

  it('toggleCell on a corner only flips the cell and its two in-bounds neighbours', () => {
    const grid: boolean[] = new Array(LIGHTS_SIZE * LIGHTS_SIZE).fill(false);
    const next = toggleCell(grid, 0);
    expect(next.filter(Boolean).length).toBe(3);
    expect(next[0]).toBe(true);
    expect(next[1]).toBe(true);
    expect(next[LIGHTS_SIZE]).toBe(true);
  });

  it('isAllOff detects an empty grid', () => {
    expect(isAllOff(new Array(25).fill(false))).toBe(true);
    expect(isAllOff(new Array(25).fill(true))).toBe(false);
  });

  it('generatePuzzle yields a non-trivial board', () => {
    const grid = generatePuzzle(5, seededRng([0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8]));
    expect(grid.length).toBe(LIGHTS_SIZE * LIGHTS_SIZE);
    expect(isAllOff(grid)).toBe(false);
  });

  it('press toggles, counts moves and detects the solved state', () => {
    const state = createInitialState(1, seededRng([0]));
    // First toggle was at index 0 → grid has lights at 0, 1, LIGHTS_SIZE.
    // Pressing index 0 again flips them all off → solved.
    const afterPress = press(state, 0);
    expect(afterPress.moves).toBe(1);
    expect(afterPress.solved).toBe(true);
    // Once solved, further presses are no-ops.
    expect(press(afterPress, 5)).toBe(afterPress);
  });

  it('createInitialState reports zero moves and an unsolved grid', () => {
    const state = createInitialState(3, seededRng([0.1, 0.3, 0.5]));
    expect(state.moves).toBe(0);
    expect(state.solved).toBe(false);
  });
});
