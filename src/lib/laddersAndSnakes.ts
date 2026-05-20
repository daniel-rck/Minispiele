export const BOARD_SIZE = 10;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
export const FINISH = BOARD_CELLS;
export const PLAYER_COUNT = 4;

/** Ladders go UP. Keys are start cells, values are destination cells. */
export const LADDERS: Readonly<Record<number, number>> = {
  2: 38,
  7: 14,
  8: 31,
  15: 26,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  78: 98,
  87: 94,
};

/** Snakes go DOWN. */
export const SNAKES: Readonly<Record<number, number>> = {
  16: 6,
  46: 25,
  49: 11,
  62: 19,
  64: 60,
  74: 53,
  89: 68,
  92: 88,
  95: 75,
  99: 80,
};

export type Player = 'human' | 'ai';

export interface GameState {
  positions: number[];
  current: number;
  /** Roll currently displayed in the die UI (0 when none rolled yet this turn). */
  lastRoll: number;
  status: 'rolling' | 'idle' | 'won';
  /** Index of the winner once status === 'won'. */
  winner: number | null;
  /** Total turns the human player has taken. */
  humanTurns: number;
}

export function createInitialState(): GameState {
  return {
    positions: new Array(PLAYER_COUNT).fill(0),
    current: 0,
    lastRoll: 0,
    status: 'idle',
    winner: null,
    humanTurns: 0,
  };
}

export function rollDie(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 6);
}

/** Compute the cell-after-bouncing-off-100 destination. */
export function applyDieRoll(position: number, roll: number): number {
  const candidate = position + roll;
  if (candidate > FINISH) return position;
  return candidate;
}

export function resolveSpecial(cell: number): { dest: number; via: 'ladder' | 'snake' | null } {
  const ladder = LADDERS[cell];
  if (ladder !== undefined) return { dest: ladder, via: 'ladder' };
  const snake = SNAKES[cell];
  if (snake !== undefined) return { dest: snake, via: 'snake' };
  return { dest: cell, via: null };
}

/** Map a 1..100 cell number to its (col, row) on the 10×10 boustrophedon board (row 0 = bottom). */
export function cellToCoords(cell: number): { col: number; row: number } {
  if (cell <= 0) return { col: -1, row: -1 };
  const idx = cell - 1;
  const row = Math.floor(idx / BOARD_SIZE);
  const col = row % 2 === 0 ? idx % BOARD_SIZE : BOARD_SIZE - 1 - (idx % BOARD_SIZE);
  return { col, row };
}
