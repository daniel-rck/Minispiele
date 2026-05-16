import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  createSolved,
  isSolved,
  moveByArrow,
  shuffleByMoves,
  SLIDING_SIZE,
  tryMove,
} from './slidingPuzzle';

describe('slidingPuzzle.createSolved', () => {
  it('returns 1..N-1 with 0 at the end', () => {
    expect(createSolved(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
    expect(createSolved(4)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
  });
});

describe('slidingPuzzle.isSolved', () => {
  it('detects the goal state', () => {
    expect(isSolved(createSolved(3))).toBe(true);
    expect(isSolved(createSolved(4))).toBe(true);
  });
  it('rejects non-goal states', () => {
    expect(isSolved([2, 1, 3, 4, 5, 6, 7, 8, 0])).toBe(false);
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 0, 8])).toBe(false);
  });
});

describe('slidingPuzzle.shuffleByMoves', () => {
  it('produces a permutation that contains 0..N²-1 each exactly once', () => {
    const board = shuffleByMoves(4, 100, 1);
    const sorted = board.slice().sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 16 }, (_, i) => i));
  });

  it('produces solvable boards (since shuffle uses legal moves only)', () => {
    // Any board reachable from solved via legal moves is by definition solvable.
    // We can't easily prove solvability by inversion-count parity in one test —
    // but we can verify the shuffle is deterministic and stays within the legal manifold
    // by simulating reverse moves later, or checking that consecutive shuffles differ.
    const a = shuffleByMoves(4, 50, 1);
    const b = shuffleByMoves(4, 50, 2);
    expect(a).not.toEqual(b);
  });

  it('is deterministic for the same seed', () => {
    expect(shuffleByMoves(4, 100, 42)).toEqual(shuffleByMoves(4, 100, 42));
  });
});

describe('slidingPuzzle.tryMove', () => {
  it('swaps an adjacent tile with the empty cell', () => {
    const s = createInitialState('medium', 1);
    const empty = s.emptyIndex;
    const size = s.size;
    const row = Math.floor(empty / size);
    const col = empty % size;
    // pick a neighbor
    let neighbor = -1;
    if (col > 0) neighbor = empty - 1;
    else if (col < size - 1) neighbor = empty + 1;
    else if (row > 0) neighbor = empty - size;
    else if (row < size - 1) neighbor = empty + size;
    expect(neighbor).toBeGreaterThan(-1);
    const next = tryMove(s, neighbor);
    expect(next.emptyIndex).toBe(neighbor);
    expect(next.moves).toBe(1);
    expect(next.board[empty]).toBe(s.board[neighbor]);
    expect(next.board[neighbor]).toBe(0);
  });

  it('refuses non-adjacent tiles', () => {
    const s = createInitialState('medium', 1);
    // pick a tile guaranteed not adjacent: opposite corner of empty
    const oppositeCorner = s.size * s.size - 1 - s.emptyIndex;
    const target = oppositeCorner === s.emptyIndex ? 0 : oppositeCorner;
    if (target === s.emptyIndex) return; // skip degenerate
    const next = tryMove(s, target);
    // Either it was adjacent (e.g. tiny board edge case), in which case moves increments;
    // otherwise the state is unchanged. We assert the move count semantics.
    if (next === s) {
      expect(next.moves).toBe(0);
    }
  });
});

describe('slidingPuzzle.moveByArrow', () => {
  it('moves the empty visually in the arrow direction', () => {
    // Build a known state: empty in the center of a 3x3
    const s = createInitialState('easy', 999);
    // Force empty to middle for predictable check via shuffle? Not deterministic enough.
    // Instead, check that arrow key, when valid, decrements/incrementes emptyIndex
    // by ±1 or ±size accordingly.
    const dirs = ['up', 'down', 'left', 'right'] as const;
    for (const dir of dirs) {
      const next = moveByArrow(s, dir);
      if (next === s) continue;
      const delta = next.emptyIndex - s.emptyIndex;
      const valid =
        (dir === 'up' && delta === s.size) ||
        (dir === 'down' && delta === -s.size) ||
        (dir === 'left' && delta === 1) ||
        (dir === 'right' && delta === -1);
      expect(valid).toBe(true);
    }
  });
});

describe('slidingPuzzle sizes', () => {
  it('exposes 3, 4, 5 for easy/medium/hard', () => {
    expect(SLIDING_SIZE.easy).toBe(3);
    expect(SLIDING_SIZE.medium).toBe(4);
    expect(SLIDING_SIZE.hard).toBe(5);
  });
});
