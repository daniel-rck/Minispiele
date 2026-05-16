import { describe, it, expect } from 'vitest';
import { createInitialState, isSolved, minimumMoves, selectPeg, tryMove } from './hanoi';

describe('hanoi', () => {
  it('createInitialState stacks all disks largest first on peg 0', () => {
    const s = createInitialState(4);
    expect(s.disks).toBe(4);
    expect(s.pegs[0]).toEqual([4, 3, 2, 1]);
    expect(s.pegs[1]).toEqual([]);
    expect(s.pegs[2]).toEqual([]);
    expect(s.moves).toBe(0);
    expect(s.selected).toBeNull();
  });

  it('tryMove rejects placing a larger disk on a smaller one', () => {
    const s = createInitialState(3);
    const move1 = tryMove(s, 0, 1); // 1 on empty
    expect(move1.pegs[1]).toEqual([1]);
    const move2 = tryMove(move1, 0, 1); // 2 on 1 → blocked
    expect(move2).toBe(move1);
  });

  it('tryMove from an empty peg is a no-op', () => {
    const s = createInitialState(3);
    expect(tryMove(s, 1, 2)).toBe(s);
  });

  it('tryMove from === to is a no-op', () => {
    const s = createInitialState(3);
    expect(tryMove(s, 0, 0)).toBe(s);
  });

  it('selectPeg toggles selection and resolves into a move', () => {
    let s = createInitialState(3);
    s = selectPeg(s, 0);
    expect(s.selected).toBe(0);
    s = selectPeg(s, 0); // deselect
    expect(s.selected).toBeNull();
    s = selectPeg(s, 0);
    s = selectPeg(s, 2); // moves 1 → peg 2
    expect(s.selected).toBeNull();
    expect(s.pegs[2]).toEqual([1]);
    expect(s.moves).toBe(1);
  });

  it('selectPeg ignores empty source pegs', () => {
    const s = createInitialState(3);
    expect(selectPeg(s, 1).selected).toBeNull();
  });

  it('isSolved becomes true once all disks land on peg 2', () => {
    const start = createInitialState(2);
    const solved = { ...start, pegs: [[], [], [2, 1]] };
    expect(isSolved(solved)).toBe(true);
    expect(isSolved(start)).toBe(false);
  });

  it('minimumMoves is 2^n - 1', () => {
    expect(minimumMoves(1)).toBe(1);
    expect(minimumMoves(3)).toBe(7);
    expect(minimumMoves(6)).toBe(63);
  });
});
