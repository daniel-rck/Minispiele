import { describe, expect, it } from 'vitest';
import {
  BLOCKS_COLS,
  BLOCKS_ROWS,
  cellsOf,
  clearLines,
  emptyBoard,
  fits,
  fullRowIndices,
  intervalForLevel,
  merge,
  PIECES,
  type Piece,
  randomType,
  spawnPiece,
  tryRotate,
} from './blocks';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('blocks', () => {
  it('emptyBoard has COLS*ROWS empty cells', () => {
    const board = emptyBoard();
    expect(board).toHaveLength(BLOCKS_COLS * BLOCKS_ROWS);
    expect(board.every((v) => v === 0)).toBe(true);
  });

  it('defines seven tetrominoes, each rotation made of four cells', () => {
    expect(PIECES).toHaveLength(7);
    for (const piece of PIECES) {
      for (const rotation of piece.rotations) {
        expect(rotation).toHaveLength(4);
      }
    }
  });

  it('randomType maps rng into the piece range', () => {
    expect(randomType(seededRng([0]))).toBe(0);
    expect(randomType(seededRng([0.99]))).toBe(6);
  });

  it('spawnPiece places a new piece at the top spawn position', () => {
    const piece = spawnPiece(2);
    expect(piece).toEqual({ type: 2, rot: 0, x: 3, y: 0 });
  });

  it('cellsOf wraps the rotation index modulo the available rotations', () => {
    const oPiece: Piece = { type: 1, rot: 5, x: 0, y: 0 }; // O piece has a single rotation
    expect(cellsOf(oPiece)).toEqual(cellsOf({ ...oPiece, rot: 0 }));
  });

  it('fits accepts a freshly spawned piece on an empty board', () => {
    expect(fits(emptyBoard(), spawnPiece(0))).toBe(true);
  });

  it('fits rejects a piece below the floor', () => {
    expect(fits(emptyBoard(), { type: 0, rot: 0, x: 3, y: BLOCKS_ROWS })).toBe(false);
  });

  it('fits rejects a piece past the left wall', () => {
    expect(fits(emptyBoard(), { type: 0, rot: 0, x: -1, y: 0 })).toBe(false);
  });

  it('fits rejects a piece overlapping an occupied cell', () => {
    const piece: Piece = { type: 1, rot: 0, x: 0, y: 0 };
    const board = merge(emptyBoard(), piece);
    expect(fits(board, piece)).toBe(false);
  });

  it('merge stamps the piece color into the board', () => {
    const piece: Piece = { type: 1, rot: 0, x: 0, y: 0 }; // O piece, color 4
    const board = merge(emptyBoard(), piece);
    // O piece cells at (1,0),(2,0),(1,1),(2,1)
    expect(board[0 * BLOCKS_COLS + 1]).toBe(4);
    expect(board[0 * BLOCKS_COLS + 2]).toBe(4);
    expect(board[1 * BLOCKS_COLS + 1]).toBe(4);
    expect(board[1 * BLOCKS_COLS + 2]).toBe(4);
  });

  it('fullRowIndices detects a completely filled row', () => {
    const board = emptyBoard();
    const lastRow = BLOCKS_ROWS - 1;
    for (let c = 0; c < BLOCKS_COLS; c++) board[lastRow * BLOCKS_COLS + c] = 3;
    expect(fullRowIndices(board)).toEqual([lastRow]);
  });

  it('clearLines removes full rows and drops the blocks above down', () => {
    const board = emptyBoard();
    const lastRow = BLOCKS_ROWS - 1;
    for (let c = 0; c < BLOCKS_COLS; c++) board[lastRow * BLOCKS_COLS + c] = 3;
    board[(lastRow - 1) * BLOCKS_COLS + 0] = 5; // one block resting above the full row

    const { board: cleared, cleared: count } = clearLines(board);
    expect(count).toBe(1);
    expect(cleared).toHaveLength(BLOCKS_COLS * BLOCKS_ROWS);
    // The lone block falls into the previously full (now removed) bottom row.
    expect(cleared[lastRow * BLOCKS_COLS + 0]).toBe(5);
    // The top row is empty after the shift.
    expect(cleared.slice(0, BLOCKS_COLS).every((v) => v === 0)).toBe(true);
  });

  it('intervalForLevel decreases with level but never below 120ms', () => {
    expect(intervalForLevel(0)).toBe(700);
    expect(intervalForLevel(1)).toBe(640);
    expect(intervalForLevel(100)).toBe(120);
  });

  it('tryRotate advances the rotation index when there is room', () => {
    const rotated = tryRotate(emptyBoard(), spawnPiece(0));
    expect(rotated).not.toBeNull();
    expect(rotated!.rot).toBe(1);
  });
});
