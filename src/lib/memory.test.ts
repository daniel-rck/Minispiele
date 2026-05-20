import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  flipCard,
  MEMORY_PAIRS,
  type MemoryState,
  resolvePicks,
} from './memory';

describe('memory.createInitialState', () => {
  it('creates 2× pairs cards for the difficulty', () => {
    const easy = createInitialState('easy', 1);
    const medium = createInitialState('medium', 1);
    const hard = createInitialState('hard', 1);
    expect(easy.cards).toHaveLength(MEMORY_PAIRS.easy * 2);
    expect(medium.cards).toHaveLength(MEMORY_PAIRS.medium * 2);
    expect(hard.cards).toHaveLength(MEMORY_PAIRS.hard * 2);
  });

  it('places each symbol exactly twice', () => {
    const state = createInitialState('medium', 42);
    const counts = new Map<string, number>();
    state.cards.forEach((c) => counts.set(c.symbol, (counts.get(c.symbol) ?? 0) + 1));
    counts.forEach((n) => expect(n).toBe(2));
  });

  it('is deterministic with a seed', () => {
    const a = createInitialState('medium', 1234);
    const b = createInitialState('medium', 1234);
    expect(a.cards.map((c) => c.symbol)).toEqual(b.cards.map((c) => c.symbol));
  });

  it('starts with no flipped or matched cards', () => {
    const state = createInitialState('easy', 1);
    expect(state.cards.every((c) => !c.flipped && !c.matched)).toBe(true);
    expect(state.moves).toBe(0);
    expect(state.matched).toBe(0);
    expect(state.won).toBe(false);
  });
});

describe('memory.flipCard', () => {
  it('records the first pick without incrementing moves', () => {
    const s = createInitialState('easy', 1);
    const next = flipCard(s, 0);
    expect(next.firstPick).toBe(0);
    expect(next.moves).toBe(0);
    expect(next.cards[0]?.flipped).toBe(true);
  });

  it('records the second pick and increments moves', () => {
    const s = createInitialState('easy', 1);
    const a = flipCard(s, 0);
    const b = flipCard(a, 1);
    expect(b.secondPick).toBe(1);
    expect(b.moves).toBe(1);
  });

  it('ignores clicks on already-flipped or matched cards', () => {
    let s = createInitialState('easy', 1);
    s = flipCard(s, 0);
    const noop = flipCard(s, 0);
    expect(noop).toBe(s);
  });

  it('ignores a third flip while two are pending resolution', () => {
    let s = createInitialState('easy', 1);
    s = flipCard(s, 0);
    s = flipCard(s, 1);
    const noop = flipCard(s, 2);
    expect(noop).toBe(s);
  });
});

describe('memory.resolvePicks', () => {
  function indicesByPair(state: MemoryState): [number, number] {
    const groups = new Map<string, number[]>();
    state.cards.forEach((c, i) => {
      const list = groups.get(c.symbol) ?? [];
      list.push(i);
      groups.set(c.symbol, list);
    });
    const pair = Array.from(groups.values()).find((v) => v.length === 2);
    if (!pair || pair[0] === undefined || pair[1] === undefined) throw new Error('no pair');
    return [pair[0], pair[1]];
  }

  it('marks both as matched when symbols match', () => {
    let s = createInitialState('easy', 1);
    const [i, j] = indicesByPair(s);
    s = flipCard(s, i);
    s = flipCard(s, j);
    const resolved = resolvePicks(s);
    expect(resolved.cards[i]?.matched).toBe(true);
    expect(resolved.cards[j]?.matched).toBe(true);
    expect(resolved.matched).toBe(1);
  });

  it('flips both back when symbols differ', () => {
    let s = createInitialState('easy', 1);
    // find two cards with different symbols
    const firstIdx = 0;
    const firstSymbol = s.cards[firstIdx]?.symbol;
    const secondIdx = s.cards.findIndex((c, i) => i !== firstIdx && c.symbol !== firstSymbol);
    expect(secondIdx).toBeGreaterThan(-1);
    s = flipCard(s, firstIdx);
    s = flipCard(s, secondIdx);
    const resolved = resolvePicks(s);
    expect(resolved.cards[firstIdx]?.flipped).toBe(false);
    expect(resolved.cards[secondIdx]?.flipped).toBe(false);
    expect(resolved.matched).toBe(0);
  });

  it('wins after all pairs are matched', () => {
    let s = createInitialState('easy', 7);
    const groups = new Map<string, number[]>();
    s.cards.forEach((c, i) => {
      const list = groups.get(c.symbol) ?? [];
      list.push(i);
      groups.set(c.symbol, list);
    });
    for (const indices of groups.values()) {
      const [a, b] = indices;
      if (a === undefined || b === undefined) continue;
      s = flipCard(s, a);
      s = flipCard(s, b);
      s = resolvePicks(s);
    }
    expect(s.won).toBe(true);
    expect(s.matched).toBe(MEMORY_PAIRS.easy);
  });
});
