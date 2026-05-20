export const BINGO_COLUMNS = ['B', 'I', 'N', 'G', 'O'] as const;
export const BINGO_SIZE = 5;
export const BINGO_NUMBERS_PER_COLUMN = 15;
export const BINGO_TOTAL_NUMBERS = BINGO_NUMBERS_PER_COLUMN * BINGO_SIZE;
export const BINGO_FREE_INDEX = 2 * BINGO_SIZE + 2; // centre of the 5×5 card

export interface BingoCard {
  /** 25 numbers in row-major order; the centre cell is 0 (free space). */
  numbers: number[];
  /** Which cells are currently marked (row-major). The free centre starts marked. */
  marked: boolean[];
}

export interface BingoState {
  pool: number[];
  drawn: number[];
  cards: BingoCard[];
  won: boolean;
  /** Index of the winning card, if any. */
  winningCard: number | null;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const next = arr.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

export function generateCard(rng: () => number = Math.random): BingoCard {
  // Per column pick five distinct numbers from the column's range [col*15+1 .. col*15+15].
  const columnPicks: number[][] = [];
  for (let col = 0; col < BINGO_SIZE; col++) {
    const min = col * BINGO_NUMBERS_PER_COLUMN + 1;
    const range: number[] = [];
    for (let n = min; n < min + BINGO_NUMBERS_PER_COLUMN; n++) range.push(n);
    columnPicks.push(shuffle(range, rng).slice(0, BINGO_SIZE));
  }
  const numbers: number[] = new Array(BINGO_SIZE * BINGO_SIZE);
  const marked: boolean[] = new Array(BINGO_SIZE * BINGO_SIZE).fill(false);
  for (let row = 0; row < BINGO_SIZE; row++) {
    for (let col = 0; col < BINGO_SIZE; col++) {
      const idx = row * BINGO_SIZE + col;
      numbers[idx] = columnPicks[col]?.[row] ?? 0;
    }
  }
  numbers[BINGO_FREE_INDEX] = 0;
  marked[BINGO_FREE_INDEX] = true;
  return { numbers, marked };
}

export function generatePool(rng: () => number = Math.random): number[] {
  const all: number[] = [];
  for (let n = 1; n <= BINGO_TOTAL_NUMBERS; n++) all.push(n);
  return shuffle(all, rng);
}

export function createInitialState(cardCount = 2, rng: () => number = Math.random): BingoState {
  const cards: BingoCard[] = [];
  for (let i = 0; i < cardCount; i++) cards.push(generateCard(rng));
  return { pool: generatePool(rng), drawn: [], cards, won: false, winningCard: null };
}

export function columnFor(n: number): number {
  return Math.floor((n - 1) / BINGO_NUMBERS_PER_COLUMN);
}

export function cardHasBingo(card: BingoCard): boolean {
  const { marked } = card;
  // Rows + columns
  for (let i = 0; i < BINGO_SIZE; i++) {
    let row = true;
    let col = true;
    for (let j = 0; j < BINGO_SIZE; j++) {
      if (!marked[i * BINGO_SIZE + j]) row = false;
      if (!marked[j * BINGO_SIZE + i]) col = false;
    }
    if (row || col) return true;
  }
  // Diagonals
  let diag1 = true;
  let diag2 = true;
  for (let i = 0; i < BINGO_SIZE; i++) {
    if (!marked[i * BINGO_SIZE + i]) diag1 = false;
    if (!marked[i * BINGO_SIZE + (BINGO_SIZE - 1 - i)]) diag2 = false;
  }
  return diag1 || diag2;
}

function applyDraw(state: BingoState, num: number): BingoState {
  const cards = state.cards.map((card) => {
    const marked = card.marked.slice();
    for (let i = 0; i < card.numbers.length; i++) {
      if (card.numbers[i] === num) marked[i] = true;
    }
    return { numbers: card.numbers, marked };
  });
  let winningCard: number | null = null;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card && cardHasBingo(card)) {
      winningCard = i;
      break;
    }
  }
  return {
    pool: state.pool,
    drawn: [...state.drawn, num],
    cards,
    won: winningCard !== null,
    winningCard,
  };
}

export function drawNumber(state: BingoState): BingoState {
  if (state.won || state.pool.length === 0) return state;
  const pool = state.pool.slice();
  const num = pool.pop();
  if (num === undefined) return state;
  const next = applyDraw({ ...state, pool }, num);
  return { ...next, pool };
}
