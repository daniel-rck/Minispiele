import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  extendSequence,
  flashDurationMs,
  pressColor,
  startInput,
  type SimonColor,
} from './simon';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('simon', () => {
  it('createInitialState returns an empty idle state', () => {
    const s = createInitialState();
    expect(s.phase).toBe('idle');
    expect(s.sequence).toEqual([]);
    expect(s.level).toBe(0);
    expect(s.inputIdx).toBe(0);
  });

  it('extendSequence appends one color and bumps the level', () => {
    const rng = seededRng([0.05, 0.3, 0.6, 0.9]);
    let s = createInitialState();
    s = extendSequence(s, rng);
    expect(s.level).toBe(1);
    expect(s.sequence).toEqual([0]);
    expect(s.phase).toBe('showing');
    s = extendSequence(s, rng);
    expect(s.level).toBe(2);
    expect(s.sequence).toEqual([0, 1]);
  });

  it('extendSequence produces colors in 0..3', () => {
    const rng = seededRng([0, 0.249, 0.25, 0.499, 0.5, 0.749, 0.75, 0.999]);
    const colors: SimonColor[] = [];
    let s = createInitialState();
    for (let i = 0; i < 8; i++) {
      s = extendSequence(s, rng);
      colors.push(s.sequence[s.sequence.length - 1]!);
    }
    expect(colors).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('startInput flips to the input phase and resets the cursor', () => {
    const rng = seededRng([0.3]);
    let s = extendSequence(createInitialState(), rng);
    s = startInput(s);
    expect(s.phase).toBe('input');
    expect(s.inputIdx).toBe(0);
  });

  it('pressColor advances on a correct press and reports completion at the end', () => {
    const rng = seededRng([0.0, 0.3, 0.6]);
    let s = createInitialState();
    s = extendSequence(s, rng); // [0]
    s = extendSequence(s, rng); // [0, 1]
    s = extendSequence(s, rng); // [0, 1, 2]
    s = startInput(s);

    const p1 = pressColor(s, 0);
    expect(p1.correct).toBe(true);
    expect(p1.completed).toBe(false);
    expect(p1.state.inputIdx).toBe(1);

    const p2 = pressColor(p1.state, 1);
    expect(p2.correct).toBe(true);
    expect(p2.completed).toBe(false);

    const p3 = pressColor(p2.state, 2);
    expect(p3.correct).toBe(true);
    expect(p3.completed).toBe(true);
  });

  it('pressColor with the wrong color moves to the lost phase', () => {
    const rng = seededRng([0.0]);
    const s = startInput(extendSequence(createInitialState(), rng));
    const p = pressColor(s, 2);
    expect(p.correct).toBe(false);
    expect(p.completed).toBe(false);
    expect(p.state.phase).toBe('lost');
  });

  it('pressColor outside input phase is a no-op', () => {
    const rng = seededRng([0.0]);
    const showing = extendSequence(createInitialState(), rng);
    const r = pressColor(showing, 0);
    expect(r.state).toBe(showing);
    expect(r.correct).toBe(false);
  });

  it('flashDurationMs shortens with each level and clamps at the minimum', () => {
    expect(flashDurationMs(1)).toBe(600);
    expect(flashDurationMs(2)).toBe(570);
    expect(flashDurationMs(11)).toBe(300);
    expect(flashDurationMs(20)).toBe(250);
    expect(flashDurationMs(100)).toBe(250);
  });
});
