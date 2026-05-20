export interface IdleUpgrade {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  /** Passive points per second added per owned copy. */
  baseRate: number;
  /** Points added to a click per owned copy. */
  clickRate: number;
}

export const IDLE_UPGRADES: readonly IdleUpgrade[] = [
  {
    id: 'better-click',
    name: 'Besserer Klick',
    desc: '+1 pro Klick',
    baseCost: 10,
    baseRate: 0,
    clickRate: 1,
  },
  {
    id: 'auto-clicker',
    name: 'Auto-Klicker',
    desc: '+1/s',
    baseCost: 15,
    baseRate: 1,
    clickRate: 0,
  },
  {
    id: 'double-click',
    name: 'Doppelklick',
    desc: '+5/s',
    baseCost: 100,
    baseRate: 5,
    clickRate: 0,
  },
  {
    id: 'turbo-finger',
    name: 'Turbo-Finger',
    desc: '+20/s',
    baseCost: 500,
    baseRate: 20,
    clickRate: 0,
  },
  {
    id: 'click-robot',
    name: 'Klick-Roboter',
    desc: '+100/s',
    baseCost: 2500,
    baseRate: 100,
    clickRate: 0,
  },
  {
    id: 'click-factory',
    name: 'Klick-Fabrik',
    desc: '+500/s',
    baseCost: 10000,
    baseRate: 500,
    clickRate: 0,
  },
  {
    id: 'click-empire',
    name: 'Klick-Imperium',
    desc: '+2000/s',
    baseCost: 50000,
    baseRate: 2000,
    clickRate: 0,
  },
];

export const IDLE_PRESTIGE_THRESHOLD = 10000;
const COST_MULTIPLIER = 1.15;

export interface IdleState {
  points: number;
  totalEarned: number;
  multiplier: number;
  upgradeCounts: number[];
}

export function createInitialState(): IdleState {
  return {
    points: 0,
    totalEarned: 0,
    multiplier: 1,
    upgradeCounts: IDLE_UPGRADES.map(() => 0),
  };
}

export function upgradeCost(state: IdleState, idx: number): number {
  const upgrade = IDLE_UPGRADES[idx];
  if (!upgrade) return Number.POSITIVE_INFINITY;
  const count = state.upgradeCounts[idx] ?? 0;
  return Math.floor(upgrade.baseCost * COST_MULTIPLIER ** count);
}

export function clickPower(state: IdleState): number {
  let power = 1;
  IDLE_UPGRADES.forEach((u, i) => {
    power += (u.clickRate ?? 0) * (state.upgradeCounts[i] ?? 0);
  });
  return power * state.multiplier;
}

export function perSecond(state: IdleState): number {
  let total = 0;
  IDLE_UPGRADES.forEach((u, i) => {
    total += u.baseRate * (state.upgradeCounts[i] ?? 0);
  });
  return total * state.multiplier;
}

export function doClick(state: IdleState): IdleState {
  const gain = clickPower(state);
  return {
    ...state,
    points: state.points + gain,
    totalEarned: state.totalEarned + gain,
  };
}

export function buyUpgrade(state: IdleState, idx: number): IdleState {
  const cost = upgradeCost(state, idx);
  if (state.points < cost) return state;
  const counts = state.upgradeCounts.slice();
  counts[idx] = (counts[idx] ?? 0) + 1;
  return {
    ...state,
    points: state.points - cost,
    upgradeCounts: counts,
  };
}

export function tickState(state: IdleState, deltaSeconds: number): IdleState {
  const rate = perSecond(state);
  if (rate <= 0) return state;
  const gain = rate * deltaSeconds;
  return {
    ...state,
    points: state.points + gain,
    totalEarned: state.totalEarned + gain,
  };
}

export function canPrestige(state: IdleState): boolean {
  return state.totalEarned >= IDLE_PRESTIGE_THRESHOLD;
}

export function doPrestige(state: IdleState): IdleState {
  if (!canPrestige(state)) return state;
  const bonus = Math.floor(Math.log10(state.totalEarned));
  return {
    points: 0,
    totalEarned: 0,
    multiplier: state.multiplier + bonus,
    upgradeCounts: IDLE_UPGRADES.map(() => 0),
  };
}

export function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.floor(n).toString();
}
