import { describe, expect, it } from 'vitest';
import {
  clampBet,
  evaluatePayout,
  pickSymbol,
  SLOT_MAX_BET,
  SLOT_MIN_BET,
  SLOT_SYMBOLS,
  type SlotSymbol,
} from './slotMachine';

describe('slotMachine', () => {
  it('pickSymbol always returns one of the defined symbols', () => {
    for (const r of [0, 0.05, 0.25, 0.5, 0.75, 0.9, 0.999]) {
      const sym = pickSymbol(() => r);
      expect(SLOT_SYMBOLS).toContain(sym);
    }
  });

  it('evaluatePayout pays the 3-of-a-kind multiplier for matching triples', () => {
    const result = evaluatePayout(['💎', '💎', '💎']);
    expect(result.multiplier).toBe(50);
    expect(result.winningReels).toEqual([0, 1, 2]);
  });

  it('evaluatePayout pays for two-of-a-kind diamonds even when not adjacent', () => {
    const result = evaluatePayout(['💎', '🍊', '💎']);
    expect(result.multiplier).toBe(5);
    expect(result.winningReels).toEqual([0, 2]);
  });

  it('evaluatePayout pays double-cherry from any two reels', () => {
    const result = evaluatePayout(['🍒', '🍋', '🍒']);
    expect(result.multiplier).toBe(2);
    expect(result.winningReels).toEqual([0, 2]);
  });

  it('evaluatePayout returns zero for losing combos', () => {
    const result = evaluatePayout(['🍋', '🍊', '🔔']);
    expect(result.multiplier).toBe(0);
    expect(result.winningReels).toEqual([]);
  });

  it('clampBet keeps the bet within min/balance bounds', () => {
    expect(clampBet(0, 100)).toBe(SLOT_MIN_BET);
    expect(clampBet(SLOT_MAX_BET + 50, 1000)).toBe(SLOT_MAX_BET);
    expect(clampBet(50, 20)).toBe(20);
    const sym: SlotSymbol = '🍒';
    expect(SLOT_SYMBOLS).toContain(sym);
  });
});
