import { describe, expect, it } from 'vitest';
import {
  applyDieRoll,
  BOARD_SIZE,
  cellToCoords,
  createInitialState,
  FINISH,
  LADDERS,
  resolveSpecial,
  rollDie,
  SNAKES,
} from './laddersAndSnakes';

describe('laddersAndSnakes', () => {
  it('rollDie always returns 1..6', () => {
    for (const r of [0, 0.16, 0.34, 0.51, 0.68, 0.83, 0.99]) {
      const die = rollDie(() => r);
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    }
  });

  it('applyDieRoll advances within the board and refuses to overshoot 100', () => {
    expect(applyDieRoll(0, 4)).toBe(4);
    expect(applyDieRoll(95, 5)).toBe(FINISH);
    expect(applyDieRoll(95, 6)).toBe(95);
    expect(applyDieRoll(99, 1)).toBe(FINISH);
  });

  it('resolveSpecial detects ladders and snakes', () => {
    expect(resolveSpecial(2)).toEqual({ dest: LADDERS[2], via: 'ladder' });
    expect(resolveSpecial(16)).toEqual({ dest: SNAKES[16], via: 'snake' });
    expect(resolveSpecial(5)).toEqual({ dest: 5, via: null });
  });

  it('cellToCoords lays out cells in a boustrophedon order with row 0 at the bottom', () => {
    expect(cellToCoords(1)).toEqual({ col: 0, row: 0 });
    expect(cellToCoords(BOARD_SIZE)).toEqual({ col: BOARD_SIZE - 1, row: 0 });
    expect(cellToCoords(BOARD_SIZE + 1)).toEqual({ col: BOARD_SIZE - 1, row: 1 });
    expect(cellToCoords(BOARD_SIZE * 2)).toEqual({ col: 0, row: 1 });
    expect(cellToCoords(FINISH)).toEqual({ col: 0, row: BOARD_SIZE - 1 });
  });

  it('createInitialState has all players at 0 and human as current', () => {
    const s = createInitialState();
    expect(s.positions.every((p) => p === 0)).toBe(true);
    expect(s.current).toBe(0);
    expect(s.status).toBe('idle');
    expect(s.winner).toBeNull();
  });
});
