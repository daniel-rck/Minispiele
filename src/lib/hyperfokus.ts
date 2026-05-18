import type { HyperfokusSave, HyperfokusTheme, HyperfokusUpgrades } from './persistedSchemas';

export type UpgradeId = keyof HyperfokusUpgrades;
export type EventKind = 'goldrausch' | 'frenzy' | 'boss' | 'zeitlupe';
export type CoinKind = 'normal' | 'bonus' | 'mega';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  describe: (level: number) => string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  tapPower: {
    id: 'tapPower',
    name: 'Tipp-Kraft',
    describe: (lvl) => `+${tapPowerValue(lvl) - 1} pro Tipp`,
    maxLevel: 14,
    baseCost: 25,
    costGrowth: 1.7,
  },
  autoTapper: {
    id: 'autoTapper',
    name: 'Auto-Tapper',
    describe: (lvl) => `${autoTapperRate(lvl).toFixed(1)} Tipps/s passiv`,
    maxLevel: 10,
    baseCost: 100,
    costGrowth: 2.0,
  },
  critChance: {
    id: 'critChance',
    name: 'Crit-Chance',
    describe: (lvl) => `${Math.round(critChance(lvl) * 100)}% pro Tipp`,
    maxLevel: 20,
    baseCost: 60,
    costGrowth: 1.55,
  },
  critMulti: {
    id: 'critMulti',
    name: 'Crit-Multi',
    describe: (lvl) => `×${critMultiplier(lvl)} bei Crit`,
    maxLevel: 10,
    baseCost: 200,
    costGrowth: 1.85,
  },
  comboDecay: {
    id: 'comboDecay',
    name: 'Combo-Atem',
    describe: (lvl) => `Combo-Decay ${comboDecaySec(lvl).toFixed(2)}s`,
    maxLevel: 6,
    baseCost: 400,
    costGrowth: 2.2,
  },
  eventRate: {
    id: 'eventRate',
    name: 'Ereignis-Drang',
    describe: (lvl) => `×${eventRateMultiplier(lvl).toFixed(2)} Ereignis-Frequenz`,
    maxLevel: 4,
    baseCost: 1500,
    costGrowth: 3.0,
  },
};

export const UPGRADE_ORDER: readonly UpgradeId[] = [
  'tapPower',
  'autoTapper',
  'critChance',
  'critMulti',
  'comboDecay',
  'eventRate',
];

export const DEFAULT_SAVE: HyperfokusSave = {
  version: 1,
  coins: 0,
  totalTaps: 0,
  allTimeBest: 0,
  prestigeCrystals: 0,
  prestigeCount: 0,
  upgrades: {
    tapPower: 0,
    autoTapper: 0,
    critChance: 0,
    critMulti: 0,
    comboDecay: 0,
    eventRate: 0,
  },
  unlockedAchievements: [],
  currentTheme: 'default',
  lastSavedAt: 0,
};

export const PRESTIGE_THRESHOLD = 1_000_000;
export const PRESTIGE_CRYSTAL_PER_MILLION = 1;
export const PRESTIGE_BONUS_PER_CRYSTAL = 0.1;
export const MAX_OFFLINE_SEC = 3600;

export function tapPowerValue(level: number): number {
  return 1 + level;
}

export function autoTapperRate(level: number): number {
  if (level <= 0) return 0;
  return level * 1.5;
}

export function critChance(level: number): number {
  const chance = 0.02 + level * 0.015;
  return Math.min(0.45, chance);
}

export function critMultiplier(level: number): number {
  return 10 + level * 2;
}

export function comboDecaySec(level: number): number {
  return 1.5 + level * 0.4;
}

export function eventRateMultiplier(level: number): number {
  return 1 + level * 0.35;
}

export function comboMultiplier(combo: number): number {
  if (combo <= 0) return 1;
  return 1 + Math.min(combo / 12, 9);
}

export function prestigeBonus(crystals: number): number {
  return 1 + crystals * PRESTIGE_BONUS_PER_CRYSTAL;
}

export function upgradeCost(id: UpgradeId, currentLevel: number): number {
  const def = UPGRADES[id];
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export function maxLevel(id: UpgradeId): number {
  return UPGRADES[id].maxLevel;
}

export function canAfford(save: HyperfokusSave, id: UpgradeId): boolean {
  const lvl = save.upgrades[id];
  if (lvl >= UPGRADES[id].maxLevel) return false;
  return save.coins >= upgradeCost(id, lvl);
}

export function applyUpgrade(save: HyperfokusSave, id: UpgradeId): HyperfokusSave {
  if (!canAfford(save, id)) return save;
  const lvl = save.upgrades[id];
  const cost = upgradeCost(id, lvl);
  return {
    ...save,
    coins: save.coins - cost,
    upgrades: { ...save.upgrades, [id]: lvl + 1 },
  };
}

export interface TapReward {
  base: number;
  isCrit: boolean;
  coinKind: CoinKind;
  total: number;
}

export interface TapContext {
  save: HyperfokusSave;
  combo: number;
  eventMulti: number;
  rng?: () => number;
}

export function rollTapReward(ctx: TapContext): TapReward {
  const rng = ctx.rng ?? Math.random;
  const power = tapPowerValue(ctx.save.upgrades.tapPower);
  const cmult = comboMultiplier(ctx.combo);
  const pmult = prestigeBonus(ctx.save.prestigeCrystals);

  let coinKind: CoinKind = 'normal';
  let coinMulti = 1;
  const coinRoll = rng();
  if (coinRoll < 0.005) {
    coinKind = 'mega';
    coinMulti = 50;
  } else if (coinRoll < 0.08) {
    coinKind = 'bonus';
    coinMulti = 5;
  }

  const isCrit = rng() < critChance(ctx.save.upgrades.critChance);
  const critMulti = isCrit ? critMultiplier(ctx.save.upgrades.critMulti) : 1;

  const total = power * cmult * pmult * ctx.eventMulti * coinMulti * critMulti;
  return { base: power, isCrit, coinKind, total };
}

export interface EventDef {
  kind: EventKind;
  name: string;
  durationMs: number;
  rewardMultiplier: number;
  bossTaps?: number;
  comboDecayFactor?: number;
  autoTapsPerSec?: number;
}

export const EVENTS: Record<EventKind, EventDef> = {
  goldrausch: {
    kind: 'goldrausch',
    name: 'GOLDRAUSCH',
    durationMs: 10_000,
    rewardMultiplier: 3,
  },
  frenzy: {
    kind: 'frenzy',
    name: 'FRENZY',
    durationMs: 5_000,
    rewardMultiplier: 1,
    autoTapsPerSec: 8,
  },
  boss: {
    kind: 'boss',
    name: 'BOSS-KERN',
    durationMs: 6_000,
    rewardMultiplier: 1,
    bossTaps: 25,
  },
  zeitlupe: {
    kind: 'zeitlupe',
    name: 'ZEITLUPE',
    durationMs: 6_000,
    rewardMultiplier: 1,
    comboDecayFactor: 0.2,
  },
};

const EVENT_POOL: readonly EventKind[] = ['goldrausch', 'frenzy', 'boss', 'zeitlupe'];

export function pickRandomEvent(rng: () => number = Math.random): EventKind {
  const i = Math.floor(rng() * EVENT_POOL.length);
  return EVENT_POOL[Math.min(EVENT_POOL.length - 1, Math.max(0, i))] ?? 'goldrausch';
}

export function nextEventDelayMs(upgradeLevel: number, rng: () => number = Math.random): number {
  const min = 25_000;
  const max = 70_000;
  const base = min + rng() * (max - min);
  return Math.max(8_000, base / eventRateMultiplier(upgradeLevel));
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  satisfied: (state: AchievementState) => boolean;
}

export interface AchievementState {
  coins: number;
  totalTaps: number;
  combo: number;
  critsInRow: number;
  crystals: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'firstTap',
    name: 'Erster Funke',
    description: 'Tippe den Kern zum ersten Mal',
    satisfied: (s) => s.totalTaps >= 1,
  },
  {
    id: 'coins100',
    name: 'Hundert',
    description: 'Sammle 100 Coins',
    satisfied: (s) => s.coins >= 100 || s.totalTaps >= 100,
  },
  {
    id: 'coins1k',
    name: 'Tausender',
    description: 'Sammle 1.000 Coins',
    satisfied: (s) => s.coins >= 1_000,
  },
  {
    id: 'coins10k',
    name: 'Zehntausender',
    description: 'Sammle 10.000 Coins',
    satisfied: (s) => s.coins >= 10_000,
  },
  {
    id: 'coins100k',
    name: 'Hunderttausender',
    description: 'Sammle 100.000 Coins',
    satisfied: (s) => s.coins >= 100_000,
  },
  {
    id: 'coins1M',
    name: 'Millionär',
    description: 'Sammle 1.000.000 Coins',
    satisfied: (s) => s.coins >= 1_000_000,
  },
  {
    id: 'combo20',
    name: 'Im Flow',
    description: 'Erreiche Combo 20',
    satisfied: (s) => s.combo >= 20,
  },
  {
    id: 'combo50',
    name: 'Hyperfokus',
    description: 'Erreiche Combo 50',
    satisfied: (s) => s.combo >= 50,
  },
  {
    id: 'combo100',
    name: 'Tunnelblick',
    description: 'Erreiche Combo 100',
    satisfied: (s) => s.combo >= 100,
  },
  {
    id: 'critStreak3',
    name: 'Glückssträhne',
    description: '3 Crits in Folge',
    satisfied: (s) => s.critsInRow >= 3,
  },
  {
    id: 'critStreak5',
    name: 'Dopamin-Sturm',
    description: '5 Crits in Folge',
    satisfied: (s) => s.critsInRow >= 5,
  },
  {
    id: 'taps500',
    name: 'Fingerübung',
    description: '500 Tipps insgesamt',
    satisfied: (s) => s.totalTaps >= 500,
  },
  {
    id: 'taps5k',
    name: 'Trommelfeuer',
    description: '5.000 Tipps insgesamt',
    satisfied: (s) => s.totalTaps >= 5_000,
  },
  {
    id: 'firstPrestige',
    name: 'Neugeboren',
    description: 'Erstes Prestige',
    satisfied: (s) => s.crystals >= 1,
  },
];

export function newlyUnlockedAchievements(
  prev: readonly string[],
  state: AchievementState,
): string[] {
  const out: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (prev.includes(a.id)) continue;
    if (a.satisfied(state)) out.push(a.id);
  }
  return out;
}

export interface ThemeDef {
  id: HyperfokusTheme;
  name: string;
  crystalsToUnlock: number;
  /** Tailwind / inline gradient endpoints */
  from: string;
  to: string;
  /** Core button gradient endpoints */
  coreFrom: string;
  coreTo: string;
  /** Particle palette */
  particles: readonly string[];
}

export const THEMES: Record<HyperfokusTheme, ThemeDef> = {
  default: {
    id: 'default',
    name: 'Standard',
    crystalsToUnlock: 0,
    from: 'oklch(0.18 0.04 220)',
    to: 'oklch(0.06 0.025 220)',
    coreFrom: 'oklch(0.78 0.18 195)',
    coreTo: 'oklch(0.5 0.18 195)',
    particles: ['#22d3ee', '#7dd3fc', '#fbbf24', '#f472b6'],
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    crystalsToUnlock: 1,
    from: 'oklch(0.16 0.08 320)',
    to: 'oklch(0.05 0.05 280)',
    coreFrom: 'oklch(0.78 0.22 320)',
    coreTo: 'oklch(0.5 0.22 280)',
    particles: ['#f0abfc', '#22d3ee', '#fde047', '#fb7185'],
  },
  kosmos: {
    id: 'kosmos',
    name: 'Kosmos',
    crystalsToUnlock: 5,
    from: 'oklch(0.14 0.06 270)',
    to: 'oklch(0.04 0.03 250)',
    coreFrom: 'oklch(0.7 0.2 260)',
    coreTo: 'oklch(0.42 0.18 280)',
    particles: ['#a78bfa', '#22d3ee', '#fef3c7', '#fb923c'],
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    crystalsToUnlock: 15,
    from: 'oklch(0.18 0.07 165)',
    to: 'oklch(0.05 0.05 250)',
    coreFrom: 'oklch(0.82 0.2 165)',
    coreTo: 'oklch(0.4 0.18 260)',
    particles: ['#5eead4', '#a7f3d0', '#f0abfc', '#fef08a'],
  },
};

export const THEME_ORDER: readonly HyperfokusTheme[] = ['default', 'neon', 'kosmos', 'aurora'];

export function isThemeUnlocked(theme: HyperfokusTheme, crystals: number): boolean {
  return crystals >= THEMES[theme].crystalsToUnlock;
}

export function prestigeReward(coins: number): number {
  if (coins < PRESTIGE_THRESHOLD) return 0;
  return Math.floor(coins / PRESTIGE_THRESHOLD) * PRESTIGE_CRYSTAL_PER_MILLION;
}

export function applyPrestige(save: HyperfokusSave): HyperfokusSave {
  const gained = prestigeReward(save.coins);
  if (gained <= 0) return save;
  return {
    ...DEFAULT_SAVE,
    prestigeCrystals: save.prestigeCrystals + gained,
    prestigeCount: save.prestigeCount + 1,
    allTimeBest: Math.max(save.allTimeBest, save.coins),
    unlockedAchievements: save.unlockedAchievements,
    currentTheme: save.currentTheme,
    lastSavedAt: Date.now(),
  };
}

export function computeOfflineIncome(save: HyperfokusSave, nowMs: number): number {
  if (!save.lastSavedAt) return 0;
  const elapsedSec = Math.max(0, (nowMs - save.lastSavedAt) / 1000);
  const cappedSec = Math.min(elapsedSec, MAX_OFFLINE_SEC);
  const rate = autoTapperRate(save.upgrades.autoTapper);
  if (rate <= 0) return 0;
  const power = tapPowerValue(save.upgrades.tapPower);
  const bonus = prestigeBonus(save.prestigeCrystals);
  return rate * cappedSec * power * bonus * 0.5;
}

export function formatNumber(n: number): string {
  if (!isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 1_000) return Math.floor(n).toString();
  if (abs < 1_000_000) return (n / 1_000).toFixed(n < 10_000 ? 2 : 1) + 'k';
  if (abs < 1_000_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (abs < 1_000_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  return (n / 1_000_000_000_000).toFixed(2) + 'T';
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
