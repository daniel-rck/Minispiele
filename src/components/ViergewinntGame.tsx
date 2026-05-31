import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type ViergewinntDifficulty, ViergewinntDifficultySchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const ROWS = 6;
const COLS = 7;
const DEPTH: Record<ViergewinntDifficulty, number> = { easy: 2, medium: 5, hard: 7 };
const DIFF_LABEL: Record<ViergewinntDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

type Cell = 0 | 1 | 2;

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
}

function getRow(board: Cell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r]?.[col] === 0) return r;
  return -1;
}

function checkWinAt(b: Cell[][], r: number, c: number): [number, number][] | null {
  const p = b[r]?.[c];
  if (!p) return null;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr = 0, dc = 0] of dirs) {
    const cells: [number, number][] = [[r, c]];
    for (let d = -1; d <= 1; d += 2) {
      for (let i = 1; i < 4; i++) {
        const nr = r + dr * i * d;
        const nc = c + dc * i * d;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        if (b[nr]?.[nc] !== p) break;
        cells.push([nr, nc]);
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

function checkWinFull(b: Cell[][]): Cell {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r]?.[c] && checkWinAt(b, r, c)) return b[r]?.[c] ?? 0;
    }
  }
  return 0;
}

function evaluate(b: Cell[][]): number {
  let score = 0;
  const sw = (cells: number[]): number => {
    let p1 = 0;
    let p2 = 0;
    let empty = 0;
    for (const v of cells) {
      if (v === 1) p1++;
      else if (v === 2) p2++;
      else empty++;
    }
    if (p2 === 4) return -10000;
    if (p1 === 4) return 10000;
    if (p2 === 3 && empty === 1) return -50;
    if (p1 === 3 && empty === 1) return 50;
    if (p2 === 2 && empty === 2) return -5;
    if (p1 === 2 && empty === 2) return 5;
    return 0;
  };
  for (let r = 0; r < ROWS; r++) {
    const v = b[r]?.[3] ?? 0;
    if (v === 2) score -= 3;
    else if (v === 1) score += 3;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += sw([b[r]?.[c] ?? 0, b[r]?.[c + 1] ?? 0, b[r]?.[c + 2] ?? 0, b[r]?.[c + 3] ?? 0]);
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      score += sw([b[r]?.[c] ?? 0, b[r + 1]?.[c] ?? 0, b[r + 2]?.[c] ?? 0, b[r + 3]?.[c] ?? 0]);
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += sw([
        b[r]?.[c] ?? 0,
        b[r + 1]?.[c + 1] ?? 0,
        b[r + 2]?.[c + 2] ?? 0,
        b[r + 3]?.[c + 3] ?? 0,
      ]);
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += sw([
        b[r]?.[c] ?? 0,
        b[r - 1]?.[c + 1] ?? 0,
        b[r - 2]?.[c + 2] ?? 0,
        b[r - 3]?.[c + 3] ?? 0,
      ]);
    }
  }
  return score;
}

const COL_ORDER = [3, 2, 4, 1, 5, 0, 6];

function minimax(
  b: Cell[][],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const w = checkWinFull(b);
  if (w === 1) return 100000 + depth;
  if (w === 2) return -100000 - depth;
  if (depth === 0) return evaluate(b);
  let any = false;
  if (maximizing) {
    let max = -Infinity;
    for (const c of COL_ORDER) {
      const row = getRow(b, c);
      if (row === -1) continue;
      any = true;
      b[row]![c] = 1;
      const val = minimax(b, depth - 1, alpha, beta, false);
      b[row]![c] = 0;
      max = Math.max(max, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    if (!any) return evaluate(b);
    return max;
  }
  let min = Infinity;
  for (const c of COL_ORDER) {
    const row = getRow(b, c);
    if (row === -1) continue;
    any = true;
    b[row]![c] = 2;
    const val = minimax(b, depth - 1, alpha, beta, true);
    b[row]![c] = 0;
    min = Math.min(min, val);
    beta = Math.min(beta, val);
    if (beta <= alpha) break;
  }
  if (!any) return evaluate(b);
  return min;
}

export default function ViergewinntGame() {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [over, setOver] = useState(false);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [vsAi, setVsAi] = useState(true);
  const [difficulty, setDifficulty] = useLocalStorage<ViergewinntDifficulty>(
    STORAGE_KEYS.VIERGEWINNT_DIFFICULTY,
    ViergewinntDifficultySchema,
    'medium',
  );
  const [thinking, setThinking] = useState(false);
  const [announcement, setAnnouncement] = useState('Rot ist am Zug.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(1);
    setOver(false);
    setWinCells([]);
    setThinking(false);
    setAnnouncement('Rot ist am Zug.');
  }, []);

  const drop = useCallback(
    (col: number) => {
      if (over || thinking) return;
      const row = getRow(board, col);
      if (row === -1) return;
      vibrate(15);
      sfx.pop();
      const next: Cell[][] = board.map((r) => [...r] as Cell[]);
      next[row]![col] = turn;
      setBoard(next);
      const win = checkWinAt(next, row, col);
      if (win) {
        setWinCells(win);
        setOver(true);
        setAnnouncement(turn === 1 ? 'Rot gewinnt!' : 'Gelb gewinnt!');
        sfx.win();
        vibrate([60, 40, 120]);
        return;
      }
      const full = next[0]!.every((_, c) => getRow(next, c) === -1);
      if (full) {
        setOver(true);
        setAnnouncement('Unentschieden.');
        return;
      }
      const nextTurn: 1 | 2 = turn === 1 ? 2 : 1;
      setTurn(nextTurn);
      setAnnouncement(nextTurn === 1 ? 'Rot ist am Zug.' : 'Gelb ist am Zug.');
    },
    [over, thinking, board, turn, sfx, vibrate],
  );

  useEffect(() => {
    if (!vsAi || over || turn !== 2) return;
    setThinking(true);
    const id = window.setTimeout(() => {
      const depth = DEPTH[difficulty];
      let bestCol = -1;
      let bestVal = Infinity;
      const scratch: Cell[][] = board.map((r) => [...r] as Cell[]);
      for (const c of COL_ORDER) {
        const row = getRow(scratch, c);
        if (row === -1) continue;
        scratch[row]![c] = 2;
        const val = minimax(scratch, depth - 1, -Infinity, Infinity, true);
        scratch[row]![c] = 0;
        const fuzzed = difficulty === 'easy' ? val + (Math.random() - 0.5) * 200 : val;
        if (fuzzed < bestVal) {
          bestVal = fuzzed;
          bestCol = c;
        }
      }
      setThinking(false);
      if (bestCol >= 0) drop(bestCol);
    }, 100);
    return () => window.clearTimeout(id);
  }, [vsAi, over, turn, difficulty, board, drop]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={restart}>
          Neues Spiel
        </Button>
        <Button
          variant={vsAi ? 'highlight' : 'secondary'}
          size="sm"
          onClick={() => {
            setVsAi((v) => !v);
            restart();
          }}
        >
          {vsAi ? 'Gegen KI' : '2 Spieler'}
        </Button>
        {vsAi && (
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as ViergewinntDifficulty);
              restart();
            }}
            aria-label="KI-Schwierigkeit"
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <option key={d} value={d}>
                {DIFF_LABEL[d]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">
        {thinking ? 'Computer denkt …' : announcement}
      </div>

      <div className="fit-area mx-auto w-full max-w-[440px]">
        <div
          className="grid fit-box gap-1 rounded-2xl bg-sky-700 p-2"
          role="group"
          aria-label="4-Gewinnt-Spielbrett"
          style={
            {
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              '--fit-ar': COLS / ROWS,
            } as CSSProperties
          }
        >
          {board.flatMap((row, r) =>
            row.map((value, c) => {
              const isWin = winCells.some(([wr, wc]) => wr === r && wc === c);
              const color =
                value === 1 ? 'bg-rose-500' : value === 2 ? 'bg-amber-300' : 'bg-slate-900';
              const ring = isWin ? 'ring-4 ring-emerald-400' : '';
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => drop(c)}
                  disabled={over || thinking || (vsAi && turn === 2)}
                  aria-label={`Spalte ${c + 1}`}
                  className="aspect-square"
                >
                  <span
                    aria-hidden
                    className={`block h-full w-full rounded-full ${color} ${ring}`}
                  />
                </button>
              );
            }),
          )}
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Klicke in eine Spalte, um deinen Stein einzuwerfen. Vier in einer Reihe (waagrecht,
        senkrecht oder diagonal) gewinnt. Minimax-KI mit Alpha-Beta.
      </p>
    </div>
  );
}
