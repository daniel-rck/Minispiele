import { describe, expect, it } from 'vitest';
import {
  CODE_LENGTH,
  COLORS,
  createInitialState,
  evaluateGuess,
  generateCode,
  MAX_GUESSES,
  placePeg,
  removePeg,
  submit,
} from './mastermind';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('mastermind', () => {
  it('generateCode produces a code of the right length and range', () => {
    const code = generateCode(seededRng([0.0, 0.2, 0.5, 0.8]));
    expect(code.length).toBe(CODE_LENGTH);
    for (const c of code) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(COLORS);
    }
  });

  it('evaluateGuess: identical guess scores all black', () => {
    const code = [0, 1, 2, 3];
    expect(evaluateGuess(code, code.slice())).toEqual({ black: 4, white: 0 });
  });

  it('evaluateGuess: shuffled guess scores all white', () => {
    expect(evaluateGuess([0, 1, 2, 3], [3, 2, 1, 0])).toEqual({ black: 0, white: 4 });
  });

  it('evaluateGuess: handles duplicates correctly', () => {
    // code has two 1s; guess has three 1s — only two should count.
    expect(evaluateGuess([1, 1, 2, 3], [1, 1, 1, 4])).toEqual({ black: 2, white: 0 });
    expect(evaluateGuess([1, 2, 3, 4], [4, 1, 1, 1])).toEqual({ black: 0, white: 2 });
  });

  it('placePeg / removePeg manage the current row up to CODE_LENGTH', () => {
    let s = createInitialState(seededRng([0]));
    s = placePeg(s, 0);
    s = placePeg(s, 1);
    s = placePeg(s, 2);
    s = placePeg(s, 3);
    expect(s.current).toEqual([0, 1, 2, 3]);
    // Cannot exceed length
    s = placePeg(s, 4);
    expect(s.current).toEqual([0, 1, 2, 3]);
    s = removePeg(s);
    expect(s.current).toEqual([0, 1, 2]);
    // Empty removePeg is a no-op
    const empty = createInitialState(seededRng([0]));
    expect(removePeg(empty)).toBe(empty);
  });

  it('submit ignores an incomplete current row', () => {
    let s = createInitialState(seededRng([0]));
    s = placePeg(s, 0);
    expect(submit(s)).toBe(s);
  });

  it('submit records the guess, evaluates feedback, and wins when matching the code', () => {
    let s = createInitialState(seededRng([0]));
    const code = s.code.slice();
    for (const c of code) s = placePeg(s, c);
    s = submit(s);
    expect(s.guesses.length).toBe(1);
    expect(s.feedback[0]).toEqual({ black: 4, white: 0 });
    expect(s.done).toBe('won');
    expect(s.current).toEqual([]);
    // Further actions are blocked once done
    expect(placePeg(s, 0)).toBe(s);
    expect(removePeg(s)).toBe(s);
    expect(submit(s)).toBe(s);
  });

  it('submit transitions to "lost" after MAX_GUESSES wrong attempts', () => {
    let s = createInitialState(seededRng([0]));
    // Make a guess guaranteed to differ from the code.
    const wrong = s.code.map((c) => (c + 1) % COLORS);
    for (let i = 0; i < MAX_GUESSES; i++) {
      for (const c of wrong) s = placePeg(s, c);
      s = submit(s);
    }
    expect(s.done).toBe('lost');
    expect(s.guesses.length).toBe(MAX_GUESSES);
  });
});
