export const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🔔', '🍀', '7️⃣', '💎'] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];
const SLOT_WEIGHTS = [25, 20, 18, 15, 10, 8, 4] as const;
const TOTAL_WEIGHT = SLOT_WEIGHTS.reduce((a, b) => a + b, 0);

const PAYOUTS_3: Record<SlotSymbol, number> = {
  '🍒': 5,
  '🍋': 8,
  '🍊': 10,
  '🔔': 15,
  '🍀': 20,
  '7️⃣': 30,
  '💎': 50,
};

const PAYOUTS_2: Partial<Record<SlotSymbol, number>> = {
  '💎': 5,
  '7️⃣': 3,
};

export const SLOT_INITIAL_BALANCE = 500;
export const SLOT_MIN_BET = 5;
export const SLOT_MAX_BET = 100;
export const SLOT_BET_STEP = 5;

export function pickSymbol(rng: () => number = Math.random): SlotSymbol {
  let r = rng() * TOTAL_WEIGHT;
  for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
    r -= SLOT_WEIGHTS[i]!;
    if (r <= 0) return SLOT_SYMBOLS[i]!;
  }
  return SLOT_SYMBOLS[0];
}

export function spinReels(rng: () => number = Math.random): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [pickSymbol(rng), pickSymbol(rng), pickSymbol(rng)];
}

export interface SpinPayout {
  multiplier: number;
  /** Indices of the reels that participated in the winning combo. */
  winningReels: number[];
  label: string;
}

export function evaluatePayout(reels: readonly [SlotSymbol, SlotSymbol, SlotSymbol]): SpinPayout {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    return { multiplier: PAYOUTS_3[a], winningReels: [0, 1, 2], label: `3× ${a}` };
  }
  const two: { sym: SlotSymbol; reels: number[] } | null =
    a === b && PAYOUTS_2[a] !== undefined
      ? { sym: a, reels: [0, 1] }
      : b === c && PAYOUTS_2[b] !== undefined
        ? { sym: b, reels: [1, 2] }
        : a === c && PAYOUTS_2[a] !== undefined
          ? { sym: a, reels: [0, 2] }
          : null;
  if (two) {
    const m = PAYOUTS_2[two.sym] ?? 0;
    return { multiplier: m, winningReels: two.reels, label: `2× ${two.sym}` };
  }
  const cherryIndices: number[] = [];
  reels.forEach((s, i) => {
    if (s === '🍒') cherryIndices.push(i);
  });
  if (cherryIndices.length >= 2) {
    return { multiplier: 2, winningReels: cherryIndices, label: 'Doppelkirsche' };
  }
  return { multiplier: 0, winningReels: [], label: '' };
}

export function clampBet(bet: number, balance: number): number {
  const upper = Math.min(SLOT_MAX_BET, balance);
  if (upper < SLOT_MIN_BET) return SLOT_MIN_BET;
  return Math.max(SLOT_MIN_BET, Math.min(upper, bet));
}
