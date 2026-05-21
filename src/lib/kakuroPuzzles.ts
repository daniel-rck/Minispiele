export type HintCell = { d?: number; r?: number };
export type Cell = 'B' | 'W' | HintCell;

export interface KakuroPuzzle {
  size: number;
  grid: Cell[][];
  solution: number[][];
}

export const KAKURO_PUZZLES: readonly KakuroPuzzle[] = [
  {
    size: 6,
    grid: [
      ['B', 'B', { d: 4 }, { d: 16 }, 'B', 'B'],
      ['B', { d: 17, r: 3 }, 'W', 'W', { d: 6 }, 'B'],
      [{ r: 12 }, 'W', 'W', 'W', 'W', { d: 3 }],
      [{ r: 21 }, 'W', 'W', 'W', 'W', 'W'],
      ['B', { r: 5 }, 'W', 'W', 'W', 'W'],
      ['B', 'B', { r: 3 }, 'W', 'W', 'B'],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 2, 0, 0],
      [0, 3, 1, 4, 4, 2],
      [0, 5, 2, 9, 3, 2],
      [0, 0, 3, 1, 5, 1],
      [0, 0, 0, 2, 1, 0],
    ],
  },
  {
    size: 7,
    grid: [
      ['B', { d: 23 }, { d: 11 }, 'B', { d: 16 }, { d: 7 }, 'B'],
      [{ r: 16 }, 'W', 'W', { d: 24, r: 17 }, 'W', 'W', { d: 4 }],
      [{ r: 6 }, 'W', 'W', 'W', 'W', 'W', 'W'],
      ['B', { r: 23 }, 'W', 'W', 'W', 'W', 'W'],
      [{ d: 4 }, { r: 10 }, 'W', 'W', 'W', { d: 11 }, 'B'],
      [{ r: 3 }, 'W', 'W', { d: 7, r: 16 }, 'W', 'W', { d: 3 }],
      ['B', { r: 3 }, 'W', 'W', 'W', 'W', 'W'],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 9, 7, 0, 9, 8, 0],
      [0, 5, 1, 8, 2, 6, 3],
      [0, 0, 3, 9, 5, 4, 2],
      [0, 0, 8, 2, 4, 0, 0],
      [0, 1, 3, 0, 7, 9, 0],
      [0, 0, 2, 1, 3, 6, 5],
    ],
  },
  {
    size: 8,
    grid: [
      ['B', 'B', { d: 16 }, { d: 3 }, 'B', { d: 17 }, { d: 24 }, 'B'],
      ['B', { d: 6, r: 4 }, 'W', 'W', { d: 10, r: 10 }, 'W', 'W', { d: 3 }],
      [{ r: 6 }, 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      [{ r: 4 }, 'W', 'W', { d: 17, r: 11 }, 'W', 'W', 'W', 'W'],
      ['B', { r: 3 }, 'W', 'W', 'W', { d: 12 }, { d: 9 }, 'B'],
      [{ d: 8 }, { r: 16 }, 'W', 'W', 'W', 'W', 'W', { d: 7 }],
      [{ r: 9 }, 'W', 'W', 'W', { r: 4 }, 'W', 'W', 'W'],
      ['B', { r: 3 }, 'W', 'W', 'B', { r: 6 }, 'W', 'W'],
    ],
    solution: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 3, 0, 9, 1, 0],
      [0, 2, 4, 1, 7, 8, 9, 3],
      [0, 1, 3, 0, 2, 3, 8, 6],
      [0, 0, 1, 9, 8, 0, 0, 0],
      [0, 0, 7, 3, 1, 3, 2, 0],
      [0, 5, 2, 1, 0, 1, 7, 3],
      [0, 0, 2, 1, 0, 0, 4, 2],
    ],
  },
];

export function isWhiteCell(cell: Cell): boolean {
  return cell === 'W';
}

export function isHintCell(cell: Cell): cell is HintCell {
  return typeof cell === 'object';
}
