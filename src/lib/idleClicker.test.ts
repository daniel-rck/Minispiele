import { describe, expect, it } from 'vitest';
import {
  buyUpgrade,
  canPrestige,
  clickPower,
  createInitialState,
  doClick,
  doPrestige,
  formatNumber,
  IDLE_PRESTIGE_THRESHOLD,
  IDLE_UPGRADES,
  perSecond,
  tickState,
  upgradeCost,
} from './idleClicker';

describe('idleClicker', () => {
  it('createInitialState starts with zero points and no upgrades', () => {
    const s = createInitialState();
    expect(s.points).toBe(0);
    expect(s.totalEarned).toBe(0);
    expect(s.multiplier).toBe(1);
    expect(s.upgradeCounts.every((c) => c === 0)).toBe(true);
  });

  it('upgradeCost grows by 15% per owned copy', () => {
    let s = createInitialState();
    const first = upgradeCost(s, 0);
    expect(first).toBe(IDLE_UPGRADES[0]?.baseCost);
    s = { ...s, upgradeCounts: s.upgradeCounts.slice() };
    s.upgradeCounts[0] = 1;
    const second = upgradeCost(s, 0);
    expect(second).toBe(Math.floor(first * 1.15));
  });

  it('doClick gains clickPower points', () => {
    const s = doClick(createInitialState());
    expect(s.points).toBe(1);
    expect(s.totalEarned).toBe(1);
  });

  it('buyUpgrade only succeeds when enough points are available', () => {
    const s = { ...createInitialState(), points: IDLE_UPGRADES[0]?.baseCost ?? 0 };
    const after = buyUpgrade(s, 0);
    expect(after.upgradeCounts[0]).toBe(1);
    expect(after.points).toBe(0);
    // Cannot buy without enough.
    const tooPoor = buyUpgrade(createInitialState(), 0);
    expect(tooPoor.upgradeCounts[0]).toBe(0);
  });

  it('clickPower scales with multiplier and click upgrades', () => {
    const s = createInitialState();
    expect(clickPower(s)).toBe(1);
    const withMult = { ...s, multiplier: 3 };
    expect(clickPower(withMult)).toBe(3);
    const counts = s.upgradeCounts.slice();
    counts[0] = 5;
    const withClickUpgrade = { ...s, upgradeCounts: counts };
    expect(clickPower(withClickUpgrade)).toBe(6);
  });

  it('perSecond aggregates baseRates across all owned upgrades', () => {
    const counts = createInitialState().upgradeCounts.slice();
    counts[1] = 2;
    counts[2] = 1;
    const s = { ...createInitialState(), upgradeCounts: counts };
    expect(perSecond(s)).toBe(2 + 5);
  });

  it('tickState adds rate * deltaSeconds points', () => {
    const counts = createInitialState().upgradeCounts.slice();
    counts[1] = 10;
    const s = { ...createInitialState(), upgradeCounts: counts };
    const after = tickState(s, 0.5);
    expect(after.points).toBeCloseTo(5);
  });

  it('canPrestige and doPrestige reset progress with a multiplier bump', () => {
    const s = { ...createInitialState(), totalEarned: IDLE_PRESTIGE_THRESHOLD * 10 };
    expect(canPrestige(s)).toBe(true);
    const after = doPrestige(s);
    expect(after.points).toBe(0);
    expect(after.totalEarned).toBe(0);
    expect(after.multiplier).toBeGreaterThan(1);
    expect(after.upgradeCounts.every((c) => c === 0)).toBe(true);
  });

  it('doPrestige is a no-op below the threshold', () => {
    const s = createInitialState();
    expect(doPrestige(s)).toBe(s);
  });

  it('formatNumber abbreviates large values', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(2_300_000)).toBe('2.3M');
    expect(formatNumber(7_800_000_000)).toBe('7.8B');
  });
});
