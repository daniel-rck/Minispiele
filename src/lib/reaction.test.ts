import { describe, expect, it } from 'vitest';
import { computeBest, pickWaitDelay, REACTION_MAX_WAIT_MS, REACTION_MIN_WAIT_MS } from './reaction';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('reaction', () => {
  it('pickWaitDelay returns the minimum on rng=0', () => {
    expect(pickWaitDelay(undefined, undefined, seededRng([0]))).toBe(REACTION_MIN_WAIT_MS);
  });

  it('pickWaitDelay returns exactly the maximum on rng=1', () => {
    expect(pickWaitDelay(undefined, undefined, seededRng([1]))).toBe(REACTION_MAX_WAIT_MS);
  });

  it('pickWaitDelay stays within [min, max] for arbitrary rng values', () => {
    const rng = seededRng([0.1, 0.4, 0.6, 0.9, 0.5]);
    for (let i = 0; i < 5; i++) {
      const v = pickWaitDelay(undefined, undefined, rng);
      expect(v).toBeGreaterThanOrEqual(REACTION_MIN_WAIT_MS);
      expect(v).toBeLessThanOrEqual(REACTION_MAX_WAIT_MS);
    }
  });

  it('pickWaitDelay honours custom min/max', () => {
    expect(pickWaitDelay(100, 200, seededRng([0.5]))).toBe(150);
  });

  it('computeBest sets the value when best is null', () => {
    expect(computeBest(300, null)).toBe(300);
  });

  it('computeBest sets the value when current is faster', () => {
    expect(computeBest(220, 300)).toBe(220);
  });

  it('computeBest returns null when current is slower or equal', () => {
    expect(computeBest(400, 300)).toBeNull();
    expect(computeBest(300, 300)).toBeNull();
  });
});
