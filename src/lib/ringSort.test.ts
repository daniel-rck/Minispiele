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
  type Peg,
  type Ring,
  type RingColor,
} from './ringSort';

function r(color: RingColor, size = 0, id?: string): Ring {
  return { color, size, id: id ?? `${color}-${size}` };
}

function pegOf(...rings: Ring[]): Peg {
  return rings;
}

describe('createInitialState', () => {
  it('places all rings across the first three pegs and leaves one empty', () => {
    const state = createInitialState('medium', false, 42);
    expect(state.pegs).toHaveLength(NUM_PEGS);
    expect(state.pegs[3]).toEqual([]);

    const total = state.pegs.flat().length;
    expect(total).toBe(3 * RINGS_PER_COLOR.medium);
    expect(state.moves).toBe(0);
    expect(state.selectedPegIndex).toBeNull();
    expect(state.difficulty).toBe('medium');
    expect(state.allowColorMix).toBe(false);
  });

  it('uses the difficulty to size rings per color', () => {
    expect(createInitialState('easy', false, 1).pegs.flat()).toHaveLength(9);
    expect(createInitialState('medium', false, 1).pegs.flat()).toHaveLength(12);
    expect(createInitialState('hard', false, 1).pegs.flat()).toHaveLength(15);
  });

  it('is deterministic when a seed is provided', () => {
    const a = createInitialState('medium', false, 1234);
    const b = createInitialState('medium', false, 1234);
    expect(a.pegs).toEqual(b.pegs);
  });

  it('gives every ring a unique id and sizes 0..N-1 per color', () => {
    const state = createInitialState('hard', false, 99);
    const all = state.pegs.flat();

    const ids = new Set(all.map((r) => r.id));
    expect(ids.size).toBe(all.length);

    for (const color of ['red', 'blue', 'green'] as const) {
      const sizes = all
        .filter((r) => r.color === color)
        .map((r) => r.size)
        .sort();
      expect(sizes).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('stores allowColorMix on the state', () => {
    const state = createInitialState('easy', true, 7);
    expect(state.allowColorMix).toBe(true);
  });
});

describe('isSolved', () => {
  it('returns true when every color is consolidated on a unique peg', () => {
    expect(isSolved([[], [], [], []])).toBe(true);
    expect(
      isSolved([
        pegOf(r('red'), r('red', 1)),
        pegOf(r('blue'), r('blue', 1), r('blue', 2)),
        [],
        pegOf(r('green')),
      ]),
    ).toBe(true);
  });

  it('returns false when any peg has mixed colors', () => {
    expect(isSolved([pegOf(r('red'), r('blue')), [], [], []])).toBe(false);
  });

  it('returns false when a color is split across two pegs', () => {
    expect(
      isSolved([
        pegOf(r('red'), r('red', 1), r('red', 2)),
        pegOf(r('red', 3)),
        pegOf(r('blue')),
        pegOf(r('green')),
      ]),
    ).toBe(false);
  });
});

describe('selectPeg', () => {
  it('selects a non-empty peg', () => {
    const state = createInitialState('easy', false, 7);
    const next = selectPeg(state, 0);
    expect(next.selectedPegIndex).toBe(0);
  });

  it('ignores empty pegs', () => {
    const state = createInitialState('easy', false, 7);
    const next = selectPeg(state, 3);
    expect(next.selectedPegIndex).toBeNull();
  });
});

describe('canMove (color-strict)', () => {
  const empty: Peg = [];
  it('allows move onto empty peg', () => {
    expect(canMove([pegOf(r('red')), empty, empty, empty], 0, 1, 'medium', false)).toBe(true);
  });
  it('allows move onto matching top color when not full', () => {
    expect(
      canMove([pegOf(r('red')), pegOf(r('red', 1)), empty, empty], 0, 1, 'medium', false),
    ).toBe(true);
  });
  it('rejects move onto non-matching top color', () => {
    expect(canMove([pegOf(r('red')), pegOf(r('blue')), empty, empty], 0, 1, 'medium', false)).toBe(
      false,
    );
  });
  it('rejects move when destination is full', () => {
    const full = pegOf(r('red'), r('red', 1), r('red', 2), r('red', 3));
    expect(canMove([pegOf(r('red')), full, empty, empty], 0, 1, 'medium', false)).toBe(false);
  });
  it('rejects move from empty peg', () => {
    expect(canMove([empty, pegOf(r('red')), empty, empty], 0, 1, 'medium', false)).toBe(false);
  });
  it('rejects move to same peg', () => {
    expect(canMove([pegOf(r('red')), empty, empty, empty], 0, 0, 'medium', false)).toBe(false);
  });
});

describe('canMove (color-mix allowed)', () => {
  const empty: Peg = [];
  it('allows move onto non-matching color', () => {
    expect(canMove([pegOf(r('red')), pegOf(r('blue')), empty, empty], 0, 1, 'medium', true)).toBe(
      true,
    );
  });
  it('still rejects when destination is full', () => {
    const full = pegOf(r('blue'), r('blue', 1), r('blue', 2), r('blue', 3));
    expect(canMove([pegOf(r('red')), full, empty, empty], 0, 1, 'medium', true)).toBe(false);
  });
  it('still rejects move from empty peg', () => {
    expect(canMove([empty, pegOf(r('red')), empty, empty], 0, 1, 'medium', true)).toBe(false);
  });
});

describe('tryMove', () => {
  function stateOf(
    pegs: Peg[],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    allowColorMix = false,
  ): GameState {
    return { pegs, selectedPegIndex: 0, moves: 0, won: false, difficulty, allowColorMix };
  }

  it('moves the top ring and increments moves on success', () => {
    const s = stateOf([pegOf(r('red'), r('blue')), [], [], []]);
    const next = tryMove(s, 0, 1);
    expect(next.pegs[0]).toEqual([r('red')]);
    expect(next.pegs[1]).toEqual([r('blue')]);
    expect(next.moves).toBe(1);
    expect(next.selectedPegIndex).toBeNull();
  });

  it('does not change pegs or move count on illegal move, but clears selection', () => {
    const s = stateOf([pegOf(r('red')), pegOf(r('blue')), [], []]);
    const next = tryMove(s, 0, 1);
    expect(next.pegs).toEqual(s.pegs);
    expect(next.moves).toBe(0);
    expect(next.selectedPegIndex).toBeNull();
  });

  it('accepts cross-color moves when allowColorMix is true', () => {
    const s = stateOf([pegOf(r('red')), pegOf(r('blue')), [], []], 'medium', true);
    const next = tryMove(s, 0, 1);
    expect(next.pegs[0]).toEqual([]);
    expect(next.pegs[1]).toEqual([r('blue'), r('red')]);
    expect(next.moves).toBe(1);
  });

  it('sets won=true when the final move sorts everything', () => {
    expect(pegCapacity('easy')).toBe(3);
    const s = stateOf(
      [
        pegOf(r('red'), r('red', 1), r('red', 2)),
        pegOf(r('blue'), r('blue', 1), r('blue', 2)),
        pegOf(r('green'), r('green', 1)),
        pegOf(r('green', 2)),
      ],
      'easy',
    );
    const next = tryMove(s, 3, 2);
    expect(next.won).toBe(true);
    expect(next.pegs[3]).toEqual([]);
    expect(next.pegs[2]).toHaveLength(3);
    expect(next.pegs[2]?.every((x) => x.color === 'green')).toBe(true);
  });

  it('is a no-op after the game is won', () => {
    const s: GameState = {
      pegs: [pegOf(r('red'), r('red', 1)), pegOf(r('blue')), [], []],
      selectedPegIndex: null,
      moves: 5,
      won: true,
      difficulty: 'easy',
      allowColorMix: false,
    };
    const next = tryMove(s, 0, 2);
    expect(next).toBe(s);
  });
});
