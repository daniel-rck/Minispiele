import { describe, expect, it } from 'vitest';
import { parseNotation } from './diceNotation';

describe('parseNotation', () => {
  it('parses bare die notation as count=1', () => {
    expect(parseNotation('d20')).toEqual({ count: 1, type: 'd20', modifier: 0 });
  });

  it('parses count and faces', () => {
    expect(parseNotation('3d6')).toEqual({ count: 3, type: 'd6', modifier: 0 });
  });

  it('parses positive and negative modifiers', () => {
    expect(parseNotation('2d6+3')).toEqual({ count: 2, type: 'd6', modifier: 3 });
    expect(parseNotation('1d20-2')).toEqual({ count: 1, type: 'd20', modifier: -2 });
  });

  it('is case insensitive and ignores whitespace', () => {
    expect(parseNotation('  4D8 + 1 ')).toEqual({ count: 4, type: 'd8', modifier: 1 });
  });

  it('rejects non-standard face counts', () => {
    expect(parseNotation('1d7')).toBeNull();
    expect(parseNotation('1d50')).toBeNull();
  });

  it('rejects zero or negative counts', () => {
    expect(parseNotation('0d6')).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(parseNotation('')).toBeNull();
    expect(parseNotation('hello')).toBeNull();
    expect(parseNotation('d')).toBeNull();
    expect(parseNotation('3d')).toBeNull();
    expect(parseNotation('d6++2')).toBeNull();
  });

  it('caps count to a reasonable maximum', () => {
    expect(parseNotation('100d6')).toBeNull();
    expect(parseNotation('64d6')).toEqual({ count: 64, type: 'd6', modifier: 0 });
  });

  it('supports all standard dice', () => {
    for (const [faces, type] of [
      [4, 'd4'],
      [6, 'd6'],
      [8, 'd8'],
      [10, 'd10'],
      [12, 'd12'],
      [20, 'd20'],
      [100, 'd100'],
    ] as const) {
      expect(parseNotation(`d${faces}`)?.type).toBe(type);
    }
  });
});
