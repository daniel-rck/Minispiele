export type MemoryDifficulty = 'easy' | 'medium' | 'hard';

export interface MemoryCard {
  id: string;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

export interface MemoryState {
  cards: MemoryCard[];
  firstPick: number | null;
  secondPick: number | null;
  moves: number;
  matched: number;
  won: boolean;
  difficulty: MemoryDifficulty;
}

export const MEMORY_PAIRS: Record<MemoryDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 18,
};

export const MEMORY_COLS: Record<MemoryDifficulty, number> = {
  easy: 4,
  medium: 4,
  hard: 6,
};

export const SYMBOL_POOL: readonly string[] = [
  '🍎',
  '🍌',
  '🍇',
  '🍒',
  '🥑',
  '🥕',
  '🌽',
  '🍓',
  '🍍',
  '🥥',
  '🥝',
  '🍑',
  '🌶️',
  '🍄',
  '🌻',
  '🌸',
  '🌵',
  '🍀',
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

export function createInitialState(
  difficulty: MemoryDifficulty,
  seed: number = Date.now(),
): MemoryState {
  const pairs = MEMORY_PAIRS[difficulty];
  const rng = mulberry32(seed);
  const symbols = shuffle(SYMBOL_POOL.slice(), rng).slice(0, pairs);
  const deck: MemoryCard[] = [];
  symbols.forEach((symbol, i) => {
    deck.push({ id: `c-${i}-a`, symbol, flipped: false, matched: false });
    deck.push({ id: `c-${i}-b`, symbol, flipped: false, matched: false });
  });
  const shuffled = shuffle(deck, rng);
  return {
    cards: shuffled,
    firstPick: null,
    secondPick: null,
    moves: 0,
    matched: 0,
    won: false,
    difficulty,
  };
}

export function flipCard(state: MemoryState, index: number): MemoryState {
  if (state.won) return state;
  if (state.secondPick !== null) return state;
  const card = state.cards[index];
  if (!card || card.matched || card.flipped) return state;
  const cards = state.cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
  if (state.firstPick === null) {
    return { ...state, cards, firstPick: index };
  }
  return { ...state, cards, secondPick: index, moves: state.moves + 1 };
}

export function resolvePicks(state: MemoryState): MemoryState {
  if (state.firstPick === null || state.secondPick === null) return state;
  const a = state.cards[state.firstPick];
  const b = state.cards[state.secondPick];
  if (!a || !b) return state;
  if (a.symbol === b.symbol) {
    const cards = state.cards.map((c, i) =>
      i === state.firstPick || i === state.secondPick ? { ...c, matched: true } : c,
    );
    const matched = state.matched + 1;
    return {
      ...state,
      cards,
      firstPick: null,
      secondPick: null,
      matched,
      won: matched === MEMORY_PAIRS[state.difficulty],
    };
  }
  const cards = state.cards.map((c, i) =>
    i === state.firstPick || i === state.secondPick ? { ...c, flipped: false } : c,
  );
  return { ...state, cards, firstPick: null, secondPick: null };
}
