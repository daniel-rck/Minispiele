export const WORD_BANK = [
  'BAUM',
  'BUCH',
  'BLUME',
  'BIENE',
  'BRIEF',
  'FISCH',
  'FENSTER',
  'FERIEN',
  'FEUER',
  'FREUND',
  'GARTEN',
  'GELD',
  'GLAS',
  'HUND',
  'HAUS',
  'HERZ',
  'INSEL',
  'KATZE',
  'KIND',
  'KOPF',
  'LAMPE',
  'LICHT',
  'MOND',
  'MUSIK',
  'NEBEL',
  'PAPIER',
  'PILZ',
  'REGEN',
  'ROSE',
  'SAFT',
  'SCHIFF',
  'SOMMER',
  'SONNE',
  'STADT',
  'STERN',
  'TISCH',
  'TURM',
  'UHR',
  'VOGEL',
  'WALD',
  'WASSER',
  'WIND',
  'WOLKE',
  'WURM',
  'ZAHN',
];

export type Direction = 'right' | 'down' | 'down-right' | 'down-left';

export interface PlacedWord {
  word: string;
  start: number;
  end: number;
  dir: Direction;
  cells: number[];
}

export interface WordsearchPuzzle {
  size: number;
  grid: string[];
  words: PlacedWord[];
}

const DIRS: Record<Direction, { dr: number; dc: number }> = {
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  'down-right': { dr: 1, dc: 1 },
  'down-left': { dr: 1, dc: -1 },
};

function tryPlace(
  grid: string[],
  size: number,
  word: string,
  rng: () => number,
): PlacedWord | null {
  const dirs: Direction[] = ['right', 'down', 'down-right', 'down-left'];
  for (let attempt = 0; attempt < 60; attempt++) {
    const dir = dirs[Math.floor(rng() * dirs.length)]!;
    const { dr, dc } = DIRS[dir];
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    const endR = r + dr * (word.length - 1);
    const endC = c + dc * (word.length - 1);
    if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
    let ok = true;
    const cells: number[] = [];
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const idx = rr * size + cc;
      const existing = grid[idx];
      if (existing && existing !== '' && existing !== word[i]) {
        ok = false;
        break;
      }
      cells.push(idx);
    }
    if (!ok) continue;
    for (let i = 0; i < word.length; i++) {
      grid[cells[i]!] = word[i]!;
    }
    return { word, start: cells[0]!, end: cells[cells.length - 1]!, dir, cells };
  }
  return null;
}

export function generate(
  size: number,
  wordCount: number,
  rng: () => number = Math.random,
): WordsearchPuzzle {
  const grid: string[] = new Array(size * size).fill('');
  const words: PlacedWord[] = [];
  const pool = WORD_BANK.filter((w) => w.length <= size).slice();
  // shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  for (const w of pool) {
    if (words.length >= wordCount) break;
    const placed = tryPlace(grid, size, w, rng);
    if (placed) words.push(placed);
  }
  // fill empty cells
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) grid[i] = letters[Math.floor(rng() * letters.length)]!;
  }
  return { size, grid, words };
}

export function lineBetween(start: number, end: number, size: number): number[] | null {
  const sr = Math.floor(start / size);
  const sc = start % size;
  const er = Math.floor(end / size);
  const ec = end % size;
  const dr = er - sr;
  const dc = ec - sc;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  if (len === 0) return [start];
  const stepR = dr / len;
  const stepC = dc / len;
  if (stepR !== 0 && stepC !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  if (stepR !== Math.round(stepR) || stepC !== Math.round(stepC)) return null;
  const cells: number[] = [];
  for (let i = 0; i <= len; i++) {
    const r = sr + stepR * i;
    const c = sc + stepC * i;
    cells.push(r * size + c);
  }
  return cells;
}

export function matchWord(puzzle: WordsearchPuzzle, cells: number[]): PlacedWord | null {
  const text = cells.map((i) => puzzle.grid[i]).join('');
  for (const w of puzzle.words) {
    if (w.cells.length !== cells.length) continue;
    const forward = w.cells.every((c, i) => c === cells[i]);
    const backward = w.cells.every((c, i) => c === cells[cells.length - 1 - i]);
    if (forward || backward) return w;
    if (text === w.word) return w;
  }
  return null;
}
