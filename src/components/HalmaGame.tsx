import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const BOARD = 10;
const TARGET_COUNT = 10;

type Cell = 0 | 1 | 2; // 0 empty, 1 player blue, 2 AI red

function corner(side: 'player' | 'ai'): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < BOARD; r++) {
    for (let c = 0; c < BOARD; c++) {
      if (side === 'player') {
        if (r >= BOARD - 4 && c >= BOARD - 4 && r + c >= 2 * BOARD - 5) cells.push([r, c]);
      } else if (r < 4 && c < 4 && r + c <= 3) cells.push([r, c]);
    }
  }
  return cells.slice(0, TARGET_COUNT);
}

const PLAYER_HOME = corner('player');
const AI_HOME = corner('ai');

function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD }, () => Array<Cell>(BOARD).fill(0));
}

function startBoard(): Cell[][] {
  const b = emptyBoard();
  for (const [r, c] of PLAYER_HOME) {
    const row = b[r];
    if (row) row[c] = 1;
  }
  for (const [r, c] of AI_HOME) {
    const row = b[r];
    if (row) row[c] = 2;
  }
  return b;
}

const DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function validMovesFrom(board: Cell[][], r: number, c: number): [number, number][] {
  const moves: [number, number][] = [];
  const row = board[r];
  if (!row) return moves;
  const orig: Cell = row[c] ?? 0;
  row[c] = 0;
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < BOARD && nc >= 0 && nc < BOARD && !board[nr]?.[nc]) {
      moves.push([nr, nc]);
    }
  }
  const visited = new Set<number>();
  visited.add(r * BOARD + c);
  const queue: [number, number][] = [[r, c]];
  while (queue.length) {
    const head = queue.shift();
    if (!head) break;
    const [cr, cc] = head;
    for (const [dr, dc] of DIRS) {
      const mr = cr + dr;
      const mc = cc + dc;
      const jr = cr + 2 * dr;
      const jc = cc + 2 * dc;
      if (jr < 0 || jr >= BOARD || jc < 0 || jc >= BOARD) continue;
      const key = jr * BOARD + jc;
      if (!board[mr]?.[mc] || board[jr]?.[jc] || visited.has(key)) continue;
      visited.add(key);
      moves.push([jr, jc]);
      queue.push([jr, jc]);
    }
  }
  row[c] = orig;
  return moves;
}

function hasWon(board: Cell[][], player: Cell): boolean {
  const target = player === 1 ? AI_HOME : PLAYER_HOME;
  return target.every(([r, c]) => board[r]?.[c] === player);
}

interface AiMove {
  from: [number, number];
  to: [number, number];
}

function aiPickMove(board: Cell[][]): AiMove | null {
  let best: AiMove | null = null;
  let bestScore = -Infinity;
  for (let r = 0; r < BOARD; r++) {
    for (let c = 0; c < BOARD; c++) {
      if (board[r]?.[c] !== 2) continue;
      const moves = validMovesFrom(board, r, c);
      for (const [nr, nc] of moves) {
        // AI wants to move toward bottom-right (higher r+c)
        const score = nr + nc - (r + c) + (Math.abs(nr - r) > 1 ? 0.5 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { from: [r, c], to: [nr, nc] };
        }
      }
    }
  }
  return best;
}

export default function HalmaGame() {
  const [board, setBoard] = useState<Cell[][]>(() => startBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState<[number, number][]>([]);
  const [playerMoves, setPlayerMoves] = useState(0);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [over, setOver] = useState<'player' | 'ai' | null>(null);
  const [announcement, setAnnouncement] = useState('Dein Zug. Wähle einen blauen Stein.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setBoard(startBoard());
    setSelected(null);
    setMoves([]);
    setPlayerMoves(0);
    setTurn('player');
    setOver(null);
    setAnnouncement('Dein Zug. Wähle einen blauen Stein.');
  }, []);

  const handleCell = useCallback(
    (r: number, c: number) => {
      if (over || turn !== 'player') return;
      if (selected) {
        const isValid = moves.some(([vr, vc]) => vr === r && vc === c);
        if (isValid) {
          const newBoard = board.map((row) => [...row] as Cell[]);
          const [sr, sc] = selected;
          const srcRow = newBoard[sr];
          const dstRow = newBoard[r];
          if (srcRow && dstRow) {
            srcRow[sc] = 0;
            dstRow[c] = 1;
          }
          setBoard(newBoard);
          setSelected(null);
          setMoves([]);
          setPlayerMoves((m) => m + 1);
          sfx.pop();
          vibrate(15);
          if (hasWon(newBoard, 1)) {
            setOver('player');
            setAnnouncement('Du hast gewonnen!');
            sfx.win();
            vibrate([60, 40, 120]);
            return;
          }
          setTurn('ai');
          setAnnouncement('KI denkt nach …');
          return;
        }
      }
      if (board[r]?.[c] === 1) {
        setSelected([r, c]);
        setMoves(validMovesFrom(board, r, c));
      } else {
        setSelected(null);
        setMoves([]);
      }
    },
    [over, turn, selected, moves, board, sfx, vibrate],
  );

  useEffect(() => {
    if (turn !== 'ai' || over) return;
    const id = window.setTimeout(() => {
      const move = aiPickMove(board);
      if (!move) {
        setTurn('player');
        return;
      }
      const newBoard = board.map((row) => [...row] as Cell[]);
      const [fr, fc] = move.from;
      const [tr, tc] = move.to;
      const fromRow = newBoard[fr];
      const toRow = newBoard[tr];
      if (fromRow && toRow) {
        fromRow[fc] = 0;
        toRow[tc] = 2;
      }
      setBoard(newBoard);
      sfx.pop();
      if (hasWon(newBoard, 2)) {
        setOver('ai');
        setAnnouncement('KI hat gewonnen.');
        sfx.lose();
        vibrate([120, 60, 60]);
      } else {
        setTurn('player');
        setAnnouncement('Dein Zug.');
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [turn, board, over, sfx, vibrate]);

  const isInHome = (r: number, c: number, side: 'player' | 'ai') =>
    (side === 'player' ? PLAYER_HOME : AI_HOME).some(([rr, cc]) => rr === r && cc === c);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="flex w-full max-w-md items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Züge: <span className="font-semibold tabular-nums">{playerMoves}</span>
        </div>
        <div>
          {over === 'player'
            ? '🎉 Sieg!'
            : over === 'ai'
              ? '💥 Verloren'
              : turn === 'player'
                ? 'Du am Zug'
                : 'KI am Zug'}
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[380px]">
        <div
          className="grid fit-box gap-[2px] rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
          role="group"
          aria-label="Halma-Spielfeld"
          style={{ gridTemplateColumns: `repeat(${BOARD}, minmax(0, 1fr))` }}
        >
          {board.flatMap((row, r) =>
            row.map((value, c) => {
              const inPlayer = isInHome(r, c, 'player');
              const inAi = isInHome(r, c, 'ai');
              const isMove = moves.some(([vr, vc]) => vr === r && vc === c);
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const bg = inPlayer ? 'bg-rose-900/30' : inAi ? 'bg-sky-900/30' : 'bg-slate-800/60';
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCell(r, c)}
                  disabled={!!over || turn !== 'player'}
                  aria-label={`Feld ${r + 1},${c + 1}${value === 1 ? ' Blau' : value === 2 ? ' Rot' : ''}${isMove ? ' Zielfeld' : ''}`}
                  className={`relative aspect-square ${bg} disabled:cursor-not-allowed`}
                >
                  {isMove && (
                    <span aria-hidden className="absolute inset-1/4 rounded-full bg-amber-300/60" />
                  )}
                  {value !== 0 && (
                    <span
                      aria-hidden
                      className={`absolute inset-1 rounded-full ${value === 1 ? 'bg-sky-500' : 'bg-rose-500'} ${
                        isSelected ? 'ring-4 ring-amber-300' : ''
                      }`}
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <Button variant="primary" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Bring alle blauen Steine in die obere linke Ecke. Springe über eigene oder gegnerische
        Steine; Kettensprünge möglich.
      </p>
    </div>
  );
}
