import { describe, it, expect } from 'vitest';
import {
  canMove,
  createInitialState,
  isSolved,
  NUM_PEGS,
  pegCapacity,
  RINGS_PER_COLOR,
  selectPeg,
  tryMove,
  type GameState,
  type RingColor,
} from './ringSort';

describe('createInitialState', () => {
  it('places all rings across the first three pegs and leaves one empty', () => {
    const state = createInitialState('medium', 42);
    expect(state.pegs).toHaveLength(NUM_PEGS);
    expect(state.pegs[3]).toEqual([]);

    const total = state.pegs.flat().length;
    expect(total).toBe(3 * RINGS_PER_COLOR.medium);
    expect(state.moves).toBe(0);
    expect(state.selectedPegIndex).toBeNull();
    expect(state.difficulty).toBe('medium');
  });

  it('uses the difficulty to size rings per color', () => {
    expect(createInitialState('easy', 1).pegs.flat()).toHaveLength(9);
    expect(createInitialState('medium', 1).pegs.flat()).toHaveLength(12);
    expect(createInitialState('hard', 1).pegs.flat()).toHaveLength(15);
  });

  it('is deterministic when a seed is provided', () => {
    const a = createInitialState('medium', 1234);
    const b = createInitialState('medium', 1234);
    expect(a.pegs).toEqual(b.pegs);
  });
});

describe('isSolved', () => {
  it('returns true when every color is consolidated on a unique peg', () => {
    expect(isSolved([[], [], [], []])).toBe(true);
    expect(
      isSolved([
        ['red', 'red'],
        ['blue', 'blue', 'blue'],
        [],
        ['green'],
      ]),
    ).toBe(true);
  });

  it('returns false when any peg has mixed colors', () => {
    expect(
      isSolved([
        ['red', 'blue'],
        [],
        [],
        [],
      ]),
    ).toBe(false);
  });

  it('returns false when a color is split across two pegs', () => {
    expect(
      isSolved([
        ['red', 'red', 'red'],
        ['red'],
        ['blue'],
        ['green'],
      ]),
    ).toBe(false);
  });
});

describe('selectPeg', () => {
  it('selects a non-empty peg', () => {
    const state = createInitialState('easy', 7);
    const next = selectPeg(state, 0);
    expect(next.selectedPegIndex).toBe(0);
  });

  it('ignores empty pegs', () => {
    const state = createInitialState('easy', 7);
    const next = selectPeg(state, 3);
    expect(next.selectedPegIndex).toBeNull();
  });
});

describe('canMove', () => {
  const empty: RingColor[] = [];
  it('allows move onto empty peg', () => {
    expect(canMove([['red'], empty, empty, empty], 0, 1, 'medium')).toBe(true);
  });
  it('allows move onto matching top color when not full', () => {
    expect(canMove([['red'], ['red'], empty, empty], 0, 1, 'medium')).toBe(true);
  });
  it('rejects move onto non-matching top color', () => {
    expect(canMove([['red'], ['blue'], empty, empty], 0, 1, 'medium')).toBe(false);
  });
  it('rejects move when destination is full', () => {
    const full: RingColor[] = ['red', 'red', 'red', 'red'];
    expect(canMove([['red'], full, empty, empty], 0, 1, 'medium')).toBe(false);
  });
  it('rejects move from empty peg', () => {
    expect(canMove([empty, ['red'], empty, empty], 0, 1, 'medium')).toBe(false);
  });
  it('rejects move to same peg', () => {
    expect(canMove([['red'], empty, empty, empty], 0, 0, 'medium')).toBe(false);
  });
});

describe('tryMove', () => {
  function stateOf(pegs: RingColor[][], difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameState {
    return { pegs, selectedPegIndex: 0, moves: 0, won: false, difficulty };
  }

  it('moves the top ring and increments moves on success', () => {
    const s = stateOf([['red', 'blue'], [], [], []]);
    const next = tryMove(s, 0, 1);
    expect(next.pegs[0]).toEqual(['red']);
    expect(next.pegs[1]).toEqual(['blue']);
    expect(next.moves).toBe(1);
    expect(next.selectedPegIndex).toBeNull();
  });

  it('does not change pegs or move count on illegal move, but clears selection', () => {
    const s = stateOf([['red'], ['blue'], [], []]);
    const next = tryMove(s, 0, 1);
    expect(next.pegs).toEqual(s.pegs);
    expect(next.moves).toBe(0);
    expect(next.selectedPegIndex).toBeNull();
  });

  it('sets won=true when the final move sorts everything', () => {
    expect(pegCapacity('easy')).toBe(3);
    const s = stateOf(
      [
        ['red', 'red', 'red'],
        ['blue', 'blue', 'blue'],
        ['green', 'green'],
        ['green'],
      ],
      'easy',
    );
    const next = tryMove(s, 3, 2);
    expect(next.won).toBe(true);
    expect(next.pegs[3]).toEqual([]);
    expect(next.pegs[2]).toEqual(['green', 'green', 'green']);
  });

  it('is a no-op after the game is won', () => {
    const s: GameState = {
      pegs: [['red', 'red'], ['blue'], [], []],
      selectedPegIndex: null,
      moves: 5,
      won: true,
      difficulty: 'easy',
    };
    const next = tryMove(s, 0, 2);
    expect(next).toBe(s);
  });
});
