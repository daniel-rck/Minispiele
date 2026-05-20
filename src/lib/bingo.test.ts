import { describe, expect, it } from 'vitest';
import {
  BINGO_FREE_INDEX,
  BINGO_NUMBERS_PER_COLUMN,
  BINGO_SIZE,
  BINGO_TOTAL_NUMBERS,
  cardHasBingo,
  columnFor,
  createInitialState,
  drawNumber,
  generateCard,
  generatePool,
} from './bingo';

function seededRng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('bingo', () => {
  it('generateCard places each column number in its correct value range', () => {
    const card = generateCard(seededRng(7));
    expect(card.numbers.length).toBe(BINGO_SIZE * BINGO_SIZE);
    for (let row = 0; row < BINGO_SIZE; row++) {
      for (let col = 0; col < BINGO_SIZE; col++) {
        const idx = row * BINGO_SIZE + col;
        if (idx === BINGO_FREE_INDEX) {
          expect(card.numbers[idx]).toBe(0);
          continue;
        }
        const min = col * BINGO_NUMBERS_PER_COLUMN + 1;
        const max = min + BINGO_NUMBERS_PER_COLUMN - 1;
        expect(card.numbers[idx]).toBeGreaterThanOrEqual(min);
        expect(card.numbers[idx]).toBeLessThanOrEqual(max);
      }
    }
  });

  it('generateCard marks the centre free cell', () => {
    const card = generateCard(seededRng(3));
    expect(card.marked[BINGO_FREE_INDEX]).toBe(true);
  });

  it('generatePool contains each of 1..75 exactly once', () => {
    const pool = generatePool(seededRng(11));
    expect(pool.length).toBe(BINGO_TOTAL_NUMBERS);
    const set = new Set(pool);
    expect(set.size).toBe(BINGO_TOTAL_NUMBERS);
  });

  it('columnFor maps numbers to their BINGO column index', () => {
    expect(columnFor(1)).toBe(0);
    expect(columnFor(15)).toBe(0);
    expect(columnFor(16)).toBe(1);
    expect(columnFor(30)).toBe(1);
    expect(columnFor(75)).toBe(4);
  });

  it('cardHasBingo detects full rows, columns and diagonals', () => {
    const blank = { numbers: new Array(25).fill(0), marked: new Array(25).fill(false) };
    expect(cardHasBingo(blank)).toBe(false);
    const row = { ...blank, marked: blank.marked.slice() };
    for (let c = 0; c < BINGO_SIZE; c++) row.marked[2 * BINGO_SIZE + c] = true;
    expect(cardHasBingo(row)).toBe(true);
    const col = { ...blank, marked: blank.marked.slice() };
    for (let r = 0; r < BINGO_SIZE; r++) col.marked[r * BINGO_SIZE + 1] = true;
    expect(cardHasBingo(col)).toBe(true);
    const diag = { ...blank, marked: blank.marked.slice() };
    for (let i = 0; i < BINGO_SIZE; i++) diag.marked[i * BINGO_SIZE + i] = true;
    expect(cardHasBingo(diag)).toBe(true);
  });

  it('drawNumber marks numbers on every card and flags a win once a line is complete', () => {
    let state = createInitialState(1, seededRng(5));
    const card = state.cards[0];
    if (!card) throw new Error('expected at least one card');
    // Find the first card's full middle row (row 2, which already has FREI in col 2).
    const targets = [
      card.numbers[2 * BINGO_SIZE + 0],
      card.numbers[2 * BINGO_SIZE + 1],
      card.numbers[2 * BINGO_SIZE + 3],
      card.numbers[2 * BINGO_SIZE + 4],
    ].filter((n): n is number => typeof n === 'number' && n > 0);
    for (const t of targets) {
      const idx = state.pool.indexOf(t);
      // Move target to the top of the stack so the next pop returns it.
      if (idx === -1) continue;
      const without = state.pool.filter((p) => p !== t);
      without.push(t);
      state = { ...state, pool: without };
      state = drawNumber(state);
    }
    expect(state.won).toBe(true);
    expect(state.winningCard).toBe(0);
  });
});
