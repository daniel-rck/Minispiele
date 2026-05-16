export type SlidingDifficulty = 'easy' | 'medium' | 'hard';

export const SLIDING_SIZE: Record<SlidingDifficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

export interface SlidingState {
  board: number[];
  size: number;
  difficulty: SlidingDifficulty;
  moves: number;
  emptyIndex: number;
  won: boolean;
}

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

export function createSolved(size: number): number[] {
  const cells = size * size;
  const board = Array.from({ length: cells }, (_, i) => i + 1);
  board[cells - 1] = 0;
  return board;
}

export function isSolved(board: readonly number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[board.length - 1] === 0;
}

function neighborsOf(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const out: number[] = [];
  if (row > 0) out.push(index - size);
  if (row < size - 1) out.push(index + size);
  if (col > 0) out.push(index - 1);
  if (col < size - 1) out.push(index + 1);
  return out;
}

export function shuffleByMoves(size: number, moves: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const board = createSolved(size);
  let empty = board.length - 1;
  let lastEmpty = -1;
  for (let i = 0; i < moves; i++) {
    const candidates = neighborsOf(empty, size).filter((n) => n !== lastEmpty);
    if (candidates.length === 0) continue;
    const pickIndex = Math.floor(rng() * candidates.length);
    const pick = candidates[pickIndex] ?? candidates[0];
    if (pick === undefined) continue;
    const tile = board[pick] as number;
    board[empty] = tile;
    board[pick] = 0;
    lastEmpty = empty;
    empty = pick;
  }
  return board;
}

export function createInitialState(
  difficulty: SlidingDifficulty,
  seed: number = Date.now(),
): SlidingState {
  const size = SLIDING_SIZE[difficulty];
  const moves = size * size * 20;
  let board = shuffleByMoves(size, moves, seed);
  if (isSolved(board)) {
    board = shuffleByMoves(size, moves + 1, seed + 1);
  }
  const emptyIndex = board.indexOf(0);
  return {
    board,
    size,
    difficulty,
    moves: 0,
    emptyIndex,
    won: false,
  };
}

export function tryMove(state: SlidingState, tileIndex: number): SlidingState {
  if (state.won) return state;
  const { emptyIndex, size, board } = state;
  if (tileIndex === emptyIndex) return state;
  const valid = neighborsOf(emptyIndex, size).includes(tileIndex);
  if (!valid) return state;
  const next = board.slice();
  const tile = next[tileIndex] as number;
  next[emptyIndex] = tile;
  next[tileIndex] = 0;
  return {
    ...state,
    board: next,
    emptyIndex: tileIndex,
    moves: state.moves + 1,
    won: isSolved(next),
  };
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Arrow keys describe which adjacent tile to slide *toward the empty cell*.
 * Pressing "Right" moves the tile to the LEFT of the empty into the empty
 * (the empty appears to move left, but the player slides a tile right).
 */
export function moveByArrow(state: SlidingState, dir: ArrowDirection): SlidingState {
  const { emptyIndex, size } = state;
  const row = Math.floor(emptyIndex / size);
  const col = emptyIndex % size;
  let tileIndex = -1;
  switch (dir) {
    case 'up':
      if (row < size - 1) tileIndex = emptyIndex + size;
      break;
    case 'down':
      if (row > 0) tileIndex = emptyIndex - size;
      break;
    case 'left':
      if (col < size - 1) tileIndex = emptyIndex + 1;
      break;
    case 'right':
      if (col > 0) tileIndex = emptyIndex - 1;
      break;
  }
  if (tileIndex === -1) return state;
  return tryMove(state, tileIndex);
}
