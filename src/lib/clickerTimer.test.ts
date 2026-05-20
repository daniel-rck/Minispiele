import { describe, expect, it } from 'vitest';
import {
  clampSeconds,
  formatHundredths,
  formatRemaining,
  joinSeconds,
  MAX_TIMER_SECONDS,
  MIN_TIMER_SECONDS,
  pauseTimer,
  resumeTimer,
  splitSeconds,
} from './clickerTimer';

describe('clampSeconds', () => {
  it('clamps below minimum', () => {
    expect(clampSeconds(0)).toBe(MIN_TIMER_SECONDS);
    expect(clampSeconds(-5)).toBe(MIN_TIMER_SECONDS);
  });

  it('clamps above maximum', () => {
    expect(clampSeconds(MAX_TIMER_SECONDS + 1)).toBe(MAX_TIMER_SECONDS);
    expect(clampSeconds(1_000_000)).toBe(MAX_TIMER_SECONDS);
  });

  it('floors fractional input', () => {
    expect(clampSeconds(12.9)).toBe(12);
  });

  it('passes valid values through', () => {
    expect(clampSeconds(45)).toBe(45);
    expect(clampSeconds(60)).toBe(60);
  });

  it('returns the minimum for NaN', () => {
    expect(clampSeconds(Number.NaN)).toBe(MIN_TIMER_SECONDS);
  });
});

describe('formatRemaining', () => {
  it('formats zero', () => {
    expect(formatRemaining(0)).toBe('00:00');
  });

  it('formats sub-second values to the next second', () => {
    expect(formatRemaining(1)).toBe('00:01');
    expect(formatRemaining(999)).toBe('00:01');
    expect(formatRemaining(1000)).toBe('00:01');
    expect(formatRemaining(1001)).toBe('00:02');
  });

  it('formats minutes', () => {
    expect(formatRemaining(60_000)).toBe('01:00');
    expect(formatRemaining(125_000)).toBe('02:05');
  });

  it('clamps negative input to zero', () => {
    expect(formatRemaining(-1000)).toBe('00:00');
  });
});

describe('formatHundredths', () => {
  it('formats zero', () => {
    expect(formatHundredths(0)).toBe('00:00.00');
  });

  it('formats sub-second values with hundredths', () => {
    expect(formatHundredths(10)).toBe('00:00.01');
    expect(formatHundredths(990)).toBe('00:00.99');
    expect(formatHundredths(1000)).toBe('00:01.00');
    expect(formatHundredths(1234)).toBe('00:01.23');
  });

  it('formats minutes and hundredths together', () => {
    expect(formatHundredths(60_000)).toBe('01:00.00');
    expect(formatHundredths(125_450)).toBe('02:05.45');
  });

  it('floors hundredths (does not round up)', () => {
    expect(formatHundredths(1239)).toBe('00:01.23');
    expect(formatHundredths(9_999)).toBe('00:09.99');
  });

  it('clamps negative input to zero', () => {
    expect(formatHundredths(-1234)).toBe('00:00.00');
  });
});

describe('splitSeconds / joinSeconds', () => {
  it('round-trips minute/second pairs', () => {
    expect(splitSeconds(125)).toEqual({ minutes: 2, seconds: 5 });
    expect(joinSeconds(2, 5)).toBe(125);
  });

  it('clamps join inputs', () => {
    expect(joinSeconds(-3, 5)).toBe(5);
    expect(joinSeconds(0, 0)).toBe(MIN_TIMER_SECONDS);
    expect(joinSeconds(200, 0)).toBe(MAX_TIMER_SECONDS);
  });
});

describe('pauseTimer / resumeTimer', () => {
  it('pauseTimer returns remaining ms', () => {
    expect(pauseTimer(1_500, 1_000)).toBe(500);
    expect(pauseTimer(1_000, 1_500)).toBe(0);
  });

  it('resumeTimer rolls remaining ms into a new endAt', () => {
    expect(resumeTimer(500, 2_000)).toBe(2_500);
    expect(resumeTimer(-100, 1_000)).toBe(1_000);
  });

  it('round-trips through pause + resume', () => {
    const start = 10_000;
    const endAt = 15_000;
    const remaining = pauseTimer(endAt, start);
    const resumed = resumeTimer(remaining, start + 1_000);
    expect(resumed - (start + 1_000)).toBe(remaining);
  });
});
