import { describe, it, expect } from 'vitest';
import {
  MAX_TIMER_SECONDS,
  MIN_TIMER_SECONDS,
  clampSeconds,
  formatRemaining,
  joinSeconds,
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
