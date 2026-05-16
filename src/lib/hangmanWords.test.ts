import { describe, it, expect } from 'vitest';
import { pickRandomHangmanWord } from './hangmanWords';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('hangmanWords', () => {
  it('pickRandomHangmanWord returns an uppercase A-Z word', () => {
    for (const seed of [0, 0.25, 0.5, 0.75, 0.9999]) {
      const word = pickRandomHangmanWord(seededRng([seed]));
      expect(word).toMatch(/^[A-Z]+$/);
      expect(word.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('pickRandomHangmanWord is deterministic for a fixed rng', () => {
    const a = pickRandomHangmanWord(seededRng([0.123]));
    const b = pickRandomHangmanWord(seededRng([0.123]));
    expect(a).toBe(b);
  });

  it('pickRandomHangmanWord covers different parts of the bank', () => {
    const low = pickRandomHangmanWord(seededRng([0]));
    const high = pickRandomHangmanWord(seededRng([0.9999]));
    expect(low).not.toBe(high);
  });
});
