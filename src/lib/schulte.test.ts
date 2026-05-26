import { describe, expect, it } from 'vitest';
import { createInitialState, isComplete, pressNumber, shuffled } from './schulte';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('schulte', () => {
  it('shuffled contains every number from 1..n exactly once', () => {
    const arr = shuffled(25, seededRng([0.1, 0.5, 0.9, 0.3, 0.7]));
    expect(arr).toHaveLength(25);
    expect([...arr].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('shuffled is deterministic for a given rng', () => {
    const a = shuffled(16, seededRng([0.2, 0.4, 0.6, 0.8]));
    const b = shuffled(16, seededRng([0.2, 0.4, 0.6, 0.8]));
    expect(a).toEqual(b);
  });

  it('createInitialState starts at 1 and is not done', () => {
    const state = createInitialState(5, seededRng([0]));
    expect(state.next).toBe(1);
    expect(state.total).toBe(25);
    expect(state.done).toBe(false);
  });

  it('pressNumber advances next on the correct value', () => {
    const state = createInitialState(3, seededRng([0]));
    const after = pressNumber(state, 1);
    expect(after.next).toBe(2);
    expect(after.done).toBe(false);
  });

  it('pressNumber is a no-op on a wrong value', () => {
    const state = createInitialState(3, seededRng([0]));
    expect(pressNumber(state, 5)).toBe(state);
  });

  it('pressing 1..total in order completes the game', () => {
    let state = createInitialState(3, seededRng([0])); // total = 9
    for (let v = 1; v <= 9; v++) {
      state = pressNumber(state, v);
    }
    expect(isComplete(state)).toBe(true);
  });

  it('pressNumber is a no-op once done', () => {
    let state = createInitialState(2, seededRng([0])); // total = 4
    for (let v = 1; v <= 4; v++) state = pressNumber(state, v);
    expect(state.done).toBe(true);
    expect(pressNumber(state, 1)).toBe(state);
  });
});
