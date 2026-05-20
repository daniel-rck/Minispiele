import { describe, expect, it } from 'vitest';
import {
  autoMoveToFoundation,
  type Card,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  deal,
  type FreecellState,
  isWon,
  makeMove,
  rankLabel,
  SUITS,
  undo,
} from './freecell';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

function emptyState(): FreecellState {
  return {
    tableau: Array.from({ length: 8 }, () => [] as Card[]),
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves: 0,
    history: [],
  };
}

describe('freecell', () => {
  it('rankLabel maps ranks to German shorthand', () => {
    expect(rankLabel(1)).toBe('A');
    expect(rankLabel(2)).toBe('2');
    expect(rankLabel(10)).toBe('10');
    expect(rankLabel(11)).toBe('B');
    expect(rankLabel(12)).toBe('D');
    expect(rankLabel(13)).toBe('K');
  });

  it('deal lays out 52 cards across 8 columns', () => {
    const s = deal(seededRng([0.1, 0.4, 0.2, 0.7, 0.5, 0.9]));
    const total = s.tableau.reduce((n, st) => n + st.length, 0);
    expect(total).toBe(52);
    // 8 stacks, first 4 columns get 7 cards, last 4 get 6 — order-independent check:
    const counts = s.tableau.map((st) => st.length).sort();
    expect(counts).toEqual([6, 6, 6, 6, 7, 7, 7, 7]);
    expect(s.freeCells).toEqual([null, null, null, null]);
    expect(s.foundations).toEqual([[], [], [], []]);
    expect(s.moves).toBe(0);
  });

  it('canPlaceOnFoundation requires an Ace first, then ascending of the same suit', () => {
    const state = emptyState();
    const aceHearts: Card = { suit: '♥', rank: 1, red: true };
    expect(canPlaceOnFoundation(state, aceHearts)).toBe(SUITS.indexOf('♥'));
    // After placing the ace, a 2 of hearts should fit on the same foundation
    state.foundations[SUITS.indexOf('♥')]!.push(aceHearts);
    expect(canPlaceOnFoundation(state, { suit: '♥', rank: 2, red: true })).toBe(SUITS.indexOf('♥'));
    // Wrong rank
    expect(canPlaceOnFoundation(state, { suit: '♥', rank: 5, red: true })).toBeNull();
  });

  it('canPlaceOnTableau enforces alternating colour and descending rank', () => {
    const redSeven: Card = { suit: '♥', rank: 7, red: true };
    const blackSix: Card = { suit: '♠', rank: 6, red: false };
    const redSix: Card = { suit: '♦', rank: 6, red: true };
    expect(canPlaceOnTableau([redSeven], blackSix)).toBe(true);
    expect(canPlaceOnTableau([redSeven], redSix)).toBe(false);
    // Empty tableau column accepts anything
    expect(canPlaceOnTableau([], redSeven)).toBe(true);
  });

  it('makeMove transfers a card to a free cell and undo reverts it', () => {
    const state = emptyState();
    const card: Card = { suit: '♠', rank: 5, red: false };
    state.tableau[0]!.push(card);
    const moved = makeMove(state, { type: 'tableau', index: 0 }, { type: 'free', index: 0 });
    expect(moved).not.toBeNull();
    expect(moved!.freeCells[0]).toEqual(card);
    expect(moved!.tableau[0]).toEqual([]);
    expect(moved!.moves).toBe(1);
    const reverted = undo(moved!);
    expect(reverted.tableau[0]).toEqual([card]);
    expect(reverted.freeCells[0]).toBeNull();
    // Undo without history is a no-op
    expect(undo(state)).toBe(state);
  });

  it('makeMove rejects an invalid foundation target', () => {
    const state = emptyState();
    state.tableau[0]!.push({ suit: '♠', rank: 5, red: false });
    expect(
      makeMove(state, { type: 'tableau', index: 0 }, { type: 'foundation', index: 0 }),
    ).toBeNull();
  });

  it('autoMoveToFoundation moves a legal card onto its foundation', () => {
    const state = emptyState();
    state.tableau[0]!.push({ suit: '♥', rank: 1, red: true });
    const moved = autoMoveToFoundation(state, { type: 'tableau', index: 0 });
    expect(moved).not.toBeNull();
    const idx = SUITS.indexOf('♥');
    expect(moved!.foundations[idx]!.length).toBe(1);
    // Nothing to move when source is empty
    const empty = emptyState();
    expect(autoMoveToFoundation(empty, { type: 'tableau', index: 0 })).toBeNull();
  });

  it('isWon detects all four foundations filled to 13', () => {
    const won = emptyState();
    for (let i = 0; i < 4; i++) {
      won.foundations[i] = Array.from({ length: 13 }, (_, r) => ({
        suit: SUITS[i]!,
        rank: r + 1,
        red: SUITS[i] === '♥' || SUITS[i] === '♦',
      }));
    }
    expect(isWon(won)).toBe(true);
    expect(isWon(emptyState())).toBe(false);
  });
});
