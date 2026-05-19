import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  DEFAULT_SAVE,
  EVENTS,
  THEMES,
  UPGRADES,
  applyPrestige,
  applyUpgrade,
  autoTapperRate,
  canAfford,
  comboDecaySec,
  comboMultiplier,
  computeOfflineIncome,
  critChance,
  critMultiplier,
  eventRateMultiplier,
  findCheapestAffordable,
  formatNumber,
  isThemeUnlocked,
  newlyUnlockedAchievements,
  nextEventDelayMs,
  pickRandomEvent,
  prestigeBonus,
  prestigeReward,
  rollTapReward,
  tapPowerValue,
  upgradeCost,
} from './hyperfokus';
import type { HyperfokusSave } from './persistedSchemas';

describe('hyperfokus pure logic', () => {
  describe('upgrade value functions', () => {
    it('tapPower grows linearly from 1', () => {
      expect(tapPowerValue(0)).toBe(1);
      expect(tapPowerValue(5)).toBe(6);
    });
    it('autoTapperRate is 0 at level 0', () => {
      expect(autoTapperRate(0)).toBe(0);
      expect(autoTapperRate(1)).toBeGreaterThan(0);
    });
    it('critChance is bounded', () => {
      expect(critChance(0)).toBeGreaterThan(0);
      expect(critChance(100)).toBeLessThanOrEqual(0.45);
    });
    it('critMultiplier scales', () => {
      expect(critMultiplier(0)).toBe(10);
      expect(critMultiplier(3)).toBe(16);
    });
    it('comboDecaySec grows', () => {
      expect(comboDecaySec(1)).toBeGreaterThan(comboDecaySec(0));
    });
    it('eventRateMultiplier grows', () => {
      expect(eventRateMultiplier(0)).toBe(1);
      expect(eventRateMultiplier(2)).toBeGreaterThan(1);
    });
  });

  describe('combo multiplier', () => {
    it('returns 1 at combo 0', () => {
      expect(comboMultiplier(0)).toBe(1);
    });
    it('grows with combo but caps', () => {
      expect(comboMultiplier(12)).toBeCloseTo(2);
      expect(comboMultiplier(1000)).toBeLessThanOrEqual(10);
    });
  });

  describe('prestige', () => {
    it('bonus starts at 1', () => {
      expect(prestigeBonus(0)).toBe(1);
      expect(prestigeBonus(10)).toBeCloseTo(2);
    });
    it('reward requires threshold', () => {
      expect(prestigeReward(500_000)).toBe(0);
      expect(prestigeReward(1_000_000)).toBe(1);
      expect(prestigeReward(3_500_000)).toBe(3);
    });
    it('applyPrestige preserves crystals and unlocks', () => {
      const save: HyperfokusSave = {
        ...DEFAULT_SAVE,
        coins: 2_000_000,
        unlockedAchievements: ['firstTap'],
      };
      const after = applyPrestige(save);
      expect(after.prestigeCrystals).toBe(2);
      expect(after.coins).toBe(0);
      expect(after.upgrades.tapPower).toBe(0);
      expect(after.unlockedAchievements).toContain('firstTap');
      expect(after.prestigeCount).toBe(1);
    });
    it('applyPrestige is noop under threshold', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, coins: 100 };
      expect(applyPrestige(save)).toEqual(save);
    });
  });

  describe('upgrade economy', () => {
    it('cost grows with level', () => {
      const c0 = upgradeCost('tapPower', 0);
      const c5 = upgradeCost('tapPower', 5);
      expect(c5).toBeGreaterThan(c0);
    });
    it('canAfford respects coins and max level', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, coins: 1_000_000 };
      expect(canAfford(save, 'tapPower')).toBe(true);
      const maxed: HyperfokusSave = {
        ...save,
        upgrades: { ...save.upgrades, tapPower: UPGRADES.tapPower.maxLevel },
      };
      expect(canAfford(maxed, 'tapPower')).toBe(false);
    });
    it('applyUpgrade deducts cost and bumps level', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, coins: 9999 };
      const after = applyUpgrade(save, 'tapPower');
      expect(after.upgrades.tapPower).toBe(1);
      expect(after.coins).toBeLessThan(save.coins);
    });
    it('applyUpgrade is noop if unaffordable', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, coins: 1 };
      expect(applyUpgrade(save, 'tapPower')).toBe(save);
    });
    it('findCheapestAffordable returns null when broke', () => {
      expect(findCheapestAffordable({ ...DEFAULT_SAVE, coins: 0 })).toBeNull();
    });
    it('findCheapestAffordable returns tapPower at fresh start with 25 coins', () => {
      expect(findCheapestAffordable({ ...DEFAULT_SAVE, coins: 25 })).toBe('tapPower');
    });
    it('findCheapestAffordable skips maxed-out upgrades', () => {
      const save: HyperfokusSave = {
        ...DEFAULT_SAVE,
        coins: 1_000_000,
        upgrades: { ...DEFAULT_SAVE.upgrades, tapPower: UPGRADES.tapPower.maxLevel },
      };
      expect(findCheapestAffordable(save)).not.toBe('tapPower');
    });
    it('findCheapestAffordable picks lowest cost when several affordable', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, coins: 100 };
      const picked = findCheapestAffordable(save);
      expect(picked).not.toBeNull();
      if (picked) {
        const lvl = save.upgrades[picked];
        const cost = upgradeCost(picked, lvl);
        for (const id of ['tapPower', 'autoTapper', 'critChance'] as const) {
          if (id === picked) continue;
          const cmp = upgradeCost(id, save.upgrades[id]);
          expect(cost).toBeLessThanOrEqual(cmp);
        }
      }
    });
  });

  describe('rollTapReward', () => {
    it('produces normal coin without crit when rolls are high', () => {
      const rng = () => 0.9;
      const r = rollTapReward({ save: DEFAULT_SAVE, combo: 0, eventMulti: 1, rng });
      expect(r.coinKind).toBe('normal');
      expect(r.isCrit).toBe(false);
      expect(r.total).toBe(1);
    });
    it('triggers crit when crit roll is low', () => {
      const rolls = [0.5, 0.0];
      let i = 0;
      const rng = () => rolls[i++] ?? 1;
      const r = rollTapReward({ save: DEFAULT_SAVE, combo: 0, eventMulti: 1, rng });
      expect(r.isCrit).toBe(true);
      expect(r.total).toBeGreaterThanOrEqual(10);
    });
    it('produces mega coin on extreme low roll', () => {
      const rng = () => 0.001;
      const r = rollTapReward({ save: DEFAULT_SAVE, combo: 0, eventMulti: 1, rng });
      expect(r.coinKind).toBe('mega');
    });
    it('applies event multiplier', () => {
      const rng = () => 0.9;
      const r = rollTapReward({ save: DEFAULT_SAVE, combo: 0, eventMulti: 3, rng });
      expect(r.total).toBe(3);
    });
  });

  describe('events', () => {
    it('pickRandomEvent returns a valid kind', () => {
      const ev = pickRandomEvent(() => 0.5);
      expect(EVENTS[ev]).toBeDefined();
    });
    it('nextEventDelayMs returns positive number, scaled by upgrade', () => {
      const slow = nextEventDelayMs(0, () => 0.5);
      const fast = nextEventDelayMs(4, () => 0.5);
      expect(slow).toBeGreaterThan(fast);
    });
  });

  describe('achievements', () => {
    it('newlyUnlockedAchievements returns only new ones', () => {
      const state = {
        coins: 200,
        totalTaps: 10,
        combo: 5,
        critsInRow: 0,
        crystals: 0,
      };
      const out = newlyUnlockedAchievements([], state);
      expect(out).toContain('firstTap');
      expect(out).toContain('coins100');
      expect(out).not.toContain('coins1k');
    });
    it('does not re-emit already unlocked', () => {
      const state = {
        coins: 200,
        totalTaps: 10,
        combo: 5,
        critsInRow: 0,
        crystals: 0,
      };
      const out = newlyUnlockedAchievements(['firstTap', 'coins100'], state);
      expect(out).not.toContain('firstTap');
    });
    it('all achievements have ids and descriptions', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.id).toBeTruthy();
        expect(a.description).toBeTruthy();
      }
    });
  });

  describe('themes', () => {
    it('default is always unlocked', () => {
      expect(isThemeUnlocked('default', 0)).toBe(true);
    });
    it('aurora requires crystals', () => {
      expect(isThemeUnlocked('aurora', 0)).toBe(false);
      expect(isThemeUnlocked('aurora', THEMES.aurora.crystalsToUnlock)).toBe(true);
    });
  });

  describe('offline income', () => {
    it('returns 0 without auto-tapper', () => {
      const save: HyperfokusSave = { ...DEFAULT_SAVE, lastSavedAt: 0 };
      expect(computeOfflineIncome(save, Date.now())).toBe(0);
    });
    it('caps at max offline duration', () => {
      const save: HyperfokusSave = {
        ...DEFAULT_SAVE,
        upgrades: { ...DEFAULT_SAVE.upgrades, autoTapper: 1 },
        lastSavedAt: 1000,
      };
      const huge = computeOfflineIncome(save, 1000 + 1000 * 1000 * 60 * 60 * 24);
      const capped = computeOfflineIncome(save, 1000 + 3600 * 1000);
      expect(huge).toBeCloseTo(capped);
    });
  });

  describe('formatNumber', () => {
    it('shows small numbers as integers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });
    it('uses k/M/B/T suffixes', () => {
      expect(formatNumber(1500)).toMatch(/k/);
      expect(formatNumber(2_500_000)).toMatch(/M/);
      expect(formatNumber(2_500_000_000)).toMatch(/B/);
    });
  });
});
