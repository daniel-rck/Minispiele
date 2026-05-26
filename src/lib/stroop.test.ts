import { describe, expect, it } from 'vitest';
import { nextChallenge, STROOP_COLORS, type StroopChallenge, scoreAnswer } from './stroop';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('stroop', () => {
  it('exposes four distinct colors', () => {
    expect(STROOP_COLORS).toHaveLength(4);
    expect(new Set(STROOP_COLORS.map((c) => c.key)).size).toBe(4);
  });

  it('nextChallenge never produces matching word and ink (invariant)', () => {
    // Drive many combinations through a cycling rng.
    const rng = seededRng([0, 0.1, 0.26, 0.4, 0.5, 0.6, 0.76, 0.9, 0.99]);
    for (let i = 0; i < 30; i++) {
      const c = nextChallenge(undefined, rng);
      expect(c.word.key).not.toBe(c.ink.key);
    }
  });

  it('nextChallenge avoids repeating the previous identical challenge', () => {
    const prev: StroopChallenge = {
      word: STROOP_COLORS[0]!, // red
      ink: STROOP_COLORS[1]!, // green
    };
    // rng=0 would pick word=red, ink=red (rejected, same key), then advance.
    // Feed values so the first candidate equals prev, forcing the loop to skip it.
    const rng = seededRng([0, 0.26, 0.5, 0.99]);
    const c = nextChallenge(prev, rng);
    const isSameAsPrev = c.word.key === prev.word.key && c.ink.key === prev.ink.key;
    expect(isSameAsPrev).toBe(false);
  });

  it('scoreAnswer returns correct when the answer matches the ink color', () => {
    const challenge: StroopChallenge = {
      word: STROOP_COLORS[0]!, // red word
      ink: STROOP_COLORS[2]!, // blue ink
    };
    expect(scoreAnswer(challenge, 'blue')).toBe('correct');
  });

  it('scoreAnswer returns wrong when the answer matches the word, not the ink', () => {
    const challenge: StroopChallenge = {
      word: STROOP_COLORS[0]!, // red word
      ink: STROOP_COLORS[2]!, // blue ink
    };
    expect(scoreAnswer(challenge, 'red')).toBe('wrong');
  });
});
