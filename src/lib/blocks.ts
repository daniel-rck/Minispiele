export const BLOCKS_COLS = 10;
export const BLOCKS_ROWS = 18;
export const BLOCKS_COLORS = [
  '',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
];

// SRS-style wall-kick offsets tried in order when a basic rotation does not fit.
export const BLOCKS_WALL_KICKS: number[] = [0, -1, 1, -2, 2];

export interface PieceDef {
  color: number;
  rotations: [number, number][][];
}

// pieces as rotation arrays of (col, row) offsets, color index 1..7
export const PIECES: PieceDef[] = [
  // I
  {
    color: 6,
    rotations: [
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ],
    ],
  },
  // O
  {
    color: 4,
    rotations: [
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  // T
  {
    color: 3,
    rotations: [
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
    ],
  },
  // S
  {
    color: 1,
    rotations: [
      [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
    ],
  },
  // Z
  {
    color: 5,
    rotations: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [2, 0],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
    ],
  },
  // L
  {
    color: 4,
    rotations: [
      [
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [0, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
    ],
  },
  // J
  {
    color: 2,
    rotations: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 2],
      ],
    ],
  },
];

export interface Piece {
  type: number;
  rot: number;
  x: number;
  y: number;
}

export function emptyBoard(): number[] {
  return new Array(BLOCKS_COLS * BLOCKS_ROWS).fill(0);
}

export function randomType(rng: () => number = Math.random): number {
  return Math.floor(rng() * PIECES.length);
}

export function spawnPiece(type?: number, rng: () => number = Math.random): Piece {
  const t = type ?? randomType(rng);
  return { type: t, rot: 0, x: 3, y: 0 };
}

export function cellsOf(piece: Piece): [number, number][] {
  const def = PIECES[piece.type]!;
  const rot = def.rotations[piece.rot % def.rotations.length]!;
  return rot.map(([dx, dy]) => [piece.x + dx, piece.y + dy]);
}

export function fits(board: number[], piece: Piece): boolean {
  for (const [x, y] of cellsOf(piece)) {
    if (x < 0 || x >= BLOCKS_COLS || y >= BLOCKS_ROWS) return false;
    if (y >= 0 && board[y * BLOCKS_COLS + x] !== 0) return false;
  }
  return true;
}

export function merge(board: number[], piece: Piece): number[] {
  const next = board.slice();
  const def = PIECES[piece.type]!;
  for (const [x, y] of cellsOf(piece)) {
    if (y >= 0 && y < BLOCKS_ROWS && x >= 0 && x < BLOCKS_COLS) {
      next[y * BLOCKS_COLS + x] = def.color;
    }
  }
  return next;
}

export function fullRowIndices(board: number[]): number[] {
  const rows: number[] = [];
  for (let r = 0; r < BLOCKS_ROWS; r++) {
    let full = true;
    for (let c = 0; c < BLOCKS_COLS; c++) {
      if (board[r * BLOCKS_COLS + c] === 0) {
        full = false;
        break;
      }
    }
    if (full) rows.push(r);
  }
  return rows;
}

export function clearLines(board: number[]): { board: number[]; cleared: number } {
  const kept: number[] = [];
  let cleared = 0;
  for (let r = 0; r < BLOCKS_ROWS; r++) {
    const row = board.slice(r * BLOCKS_COLS, (r + 1) * BLOCKS_COLS);
    if (row.every((v) => v !== 0)) cleared++;
    else kept.push(...row);
  }
  const empties = new Array(cleared * BLOCKS_COLS).fill(0);
  return { board: [...empties, ...kept], cleared };
}

export function intervalForLevel(level: number): number {
  return Math.max(120, 700 - level * 60);
}

export function tryRotate(board: number[], piece: Piece): Piece | null {
  const rotated: Piece = { ...piece, rot: piece.rot + 1 };
  for (const kick of BLOCKS_WALL_KICKS) {
    const candidate: Piece = { ...rotated, x: rotated.x + kick };
    if (fits(board, candidate)) return candidate;
  }
  return null;
}
