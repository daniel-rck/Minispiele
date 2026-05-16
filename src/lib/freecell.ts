export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export type Suit = (typeof SUITS)[number];

export interface Card {
  suit: Suit;
  rank: number; // 1..13
  red: boolean;
}

export interface FreecellState {
  tableau: Card[][]; // 8 stacks
  freeCells: (Card | null)[]; // 4
  foundations: Card[][]; // 4, by suit (♠, ♥, ♦, ♣)
  moves: number;
  history: FreecellState[];
}

export function rankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'B';
  if (rank === 12) return 'D';
  if (rank === 13) return 'K';
  return String(rank);
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    const red = suit === '♥' || suit === '♦';
    for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, red });
  }
  return deck;
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function deal(rng: () => number = Math.random): FreecellState {
  const deck = shuffle(buildDeck(), rng);
  const tableau: Card[][] = Array.from({ length: 8 }, () => []);
  for (let i = 0; i < deck.length; i++) {
    tableau[i % 8]!.push(deck[i]!);
  }
  return {
    tableau,
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves: 0,
    history: [],
  };
}

export function canPlaceOnFoundation(state: FreecellState, card: Card): number | null {
  const suitIdx = SUITS.indexOf(card.suit);
  if (suitIdx < 0) return null;
  const found = state.foundations[suitIdx]!;
  const top = found[found.length - 1];
  if (!top && card.rank === 1) return suitIdx;
  if (top && top.rank === card.rank - 1) return suitIdx;
  return null;
}

export function canPlaceOnTableau(stack: Card[], card: Card): boolean {
  const top = stack[stack.length - 1];
  if (!top) return true;
  if (top.red === card.red) return false;
  return top.rank === card.rank + 1;
}

export interface MoveSource {
  type: 'tableau' | 'free';
  index: number;
}

export interface MoveTarget {
  type: 'tableau' | 'free' | 'foundation';
  index: number;
}

function topOf(state: FreecellState, src: MoveSource): Card | null {
  if (src.type === 'free') return state.freeCells[src.index] ?? null;
  const stack = state.tableau[src.index]!;
  return stack[stack.length - 1] ?? null;
}

function snapshot(state: FreecellState): FreecellState {
  return {
    tableau: state.tableau.map((s) => s.slice()),
    freeCells: state.freeCells.slice(),
    foundations: state.foundations.map((s) => s.slice()),
    moves: state.moves,
    history: state.history,
  };
}

export function makeMove(
  state: FreecellState,
  src: MoveSource,
  dst: MoveTarget,
): FreecellState | null {
  const card = topOf(state, src);
  if (!card) return null;

  // Validate target
  if (dst.type === 'free') {
    if (state.freeCells[dst.index] !== null) return null;
  } else if (dst.type === 'foundation') {
    if (canPlaceOnFoundation(state, card) !== dst.index) return null;
  } else {
    if (!canPlaceOnTableau(state.tableau[dst.index]!, card)) return null;
  }
  if (src.type === dst.type && src.index === dst.index) return null;

  const past = snapshot(state);
  const next = snapshot(state);
  // Remove from source
  if (src.type === 'free') next.freeCells[src.index] = null;
  else next.tableau[src.index]!.pop();
  // Add to target
  if (dst.type === 'free') next.freeCells[dst.index] = card;
  else if (dst.type === 'foundation') next.foundations[dst.index]!.push(card);
  else next.tableau[dst.index]!.push(card);

  next.moves = state.moves + 1;
  next.history = [...state.history.slice(-50), past];
  return next;
}

export function isWon(state: FreecellState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

export function autoMoveToFoundation(state: FreecellState, src: MoveSource): FreecellState | null {
  const card = topOf(state, src);
  if (!card) return null;
  const f = canPlaceOnFoundation(state, card);
  if (f === null) return null;
  return makeMove(state, src, { type: 'foundation', index: f });
}

export function undo(state: FreecellState): FreecellState {
  const prev = state.history[state.history.length - 1];
  if (!prev) return state;
  return { ...prev, history: state.history.slice(0, -1) };
}
