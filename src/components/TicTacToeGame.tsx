import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  type TicTacToeDifficulty,
  TicTacToeDifficultySchema,
  type TicTacToeScores,
  TicTacToeScoresSchema,
} from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

type Cell = 'X' | 'O' | '';

const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const DIFFICULTY_LABELS: Record<TicTacToeDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

const OPTIMAL_CHANCE: Record<TicTacToeDifficulty, number> = {
  easy: 0.2,
  medium: 0.6,
  hard: 1,
};

const EMPTY_SCORES: TicTacToeScores = { x: 0, o: 0, d: 0 };

function checkWinner(
  board: readonly Cell[],
): { winner: 'X' | 'O'; cells: readonly number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return { winner: v, cells: line };
  }
  return null;
}

function isDraw(board: readonly Cell[]): boolean {
  return board.every((c) => c !== '');
}

function minimax(b: Cell[], isMax: boolean, alpha: number, beta: number): number {
  const result = checkWinner(b);
  if (result) return result.winner === 'O' ? 10 : -10;
  if (isDraw(b)) return 0;

  if (isMax) {
    let best = -Infinity;
    let a = alpha;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'O';
      best = Math.max(best, minimax(b, false, a, beta));
      b[i] = '';
      a = Math.max(a, best);
      if (beta <= a) break;
    }
    return best;
  }
  let best = Infinity;
  let bt = beta;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = 'X';
    best = Math.min(best, minimax(b, true, alpha, bt));
    b[i] = '';
    bt = Math.min(bt, best);
    if (bt <= alpha) break;
  }
  return best;
}

function bestMove(board: readonly Cell[]): number {
  let score = -Infinity;
  let move = -1;
  const scratch = [...board];
  for (let i = 0; i < 9; i++) {
    if (scratch[i]) continue;
    scratch[i] = 'O';
    const s = minimax(scratch, false, -Infinity, Infinity);
    scratch[i] = '';
    if (s > score) {
      score = s;
      move = i;
    }
  }
  return move;
}

function randomMove(board: readonly Cell[]): number {
  const empty: number[] = [];
  for (let i = 0; i < 9; i++) if (!board[i]) empty.push(i);
  if (empty.length === 0) return -1;
  return empty[Math.floor(Math.random() * empty.length)] ?? -1;
}

function chooseMove(board: readonly Cell[], difficulty: TicTacToeDifficulty): number {
  return Math.random() < OPTIMAL_CHANCE[difficulty] ? bestMove(board) : randomMove(board);
}

const EMPTY_BOARD: Cell[] = ['', '', '', '', '', '', '', '', ''];

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Cell[]>(() => [...EMPTY_BOARD]);
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winCells, setWinCells] = useState<readonly number[]>([]);
  const [over, setOver] = useState(false);
  const [difficulty, setDifficulty] = useLocalStorage<TicTacToeDifficulty>(
    STORAGE_KEYS.TIC_TAC_TOE_DIFFICULTY,
    TicTacToeDifficultySchema,
    'medium',
  );
  const [scores, setScores] = useLocalStorage<TicTacToeScores>(
    STORAGE_KEYS.TIC_TAC_TOE_SCORES,
    TicTacToeScoresSchema,
    EMPTY_SCORES,
  );
  const [announcement, setAnnouncement] = useState('Du bist dran');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const finalize = useCallback(
    (nextBoard: readonly Cell[]) => {
      const result = checkWinner(nextBoard);
      if (result) {
        setWinCells(result.cells);
        setOver(true);
        if (result.winner === 'X') {
          setScores((s) => ({ ...s, x: s.x + 1 }));
          setAnnouncement('Du gewinnst!');
          sfx.win();
          vibrate([60, 40, 120]);
        } else {
          setScores((s) => ({ ...s, o: s.o + 1 }));
          setAnnouncement('Computer gewinnt!');
          sfx.lose();
          vibrate([120, 60, 60]);
        }
        return true;
      }
      if (isDraw(nextBoard)) {
        setOver(true);
        setScores((s) => ({ ...s, d: s.d + 1 }));
        setAnnouncement('Unentschieden!');
        sfx.match();
        return true;
      }
      return false;
    },
    [setScores, sfx, vibrate],
  );

  useEffect(() => {
    if (over || turn !== 'O') return;
    const id = window.setTimeout(() => {
      const idx = chooseMove(board, difficulty);
      if (idx < 0) return;
      const next = [...board];
      next[idx] = 'O';
      setBoard(next);
      if (!finalize(next)) {
        setTurn('X');
        setAnnouncement('Du bist dran');
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [board, turn, over, difficulty, finalize]);

  const handleCell = useCallback(
    (idx: number) => {
      if (over || board[idx] || turn !== 'X') return;
      sfx.match();
      vibrate(15);
      const next = [...board];
      next[idx] = 'X';
      setBoard(next);
      if (!finalize(next)) {
        setTurn('O');
        setAnnouncement('Computer denkt nach …');
      }
    },
    [board, turn, over, finalize, sfx, vibrate],
  );

  const handleNewGame = useCallback(() => {
    setBoard([...EMPTY_BOARD]);
    setWinCells([]);
    setOver(false);
    setTurn('X');
    setAnnouncement('Du bist dran');
  }, []);

  const handleResetScores = useCallback(() => {
    setScores(EMPTY_SCORES);
    handleNewGame();
  }, [handleNewGame, setScores]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-4 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2 flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200 sm:col-span-1">
          <span className="sr-only">Schwierigkeit</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as TicTacToeDifficulty)}
            className="min-h-11 w-full rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
            aria-label="Schwierigkeit"
          >
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={handleNewGame}>
          Neues Spiel
        </Button>
        <Button variant="ghost" size="sm" onClick={handleResetScores}>
          Punkte 0
        </Button>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3 text-center text-sm text-surface-700 dark:text-surface-200">
        <div>
          Du (X): <span className="font-semibold tabular-nums">{scores.x}</span>
        </div>
        <div>
          Unentschieden: <span className="font-semibold tabular-nums">{scores.d}</span>
        </div>
        <div>
          PC (O): <span className="font-semibold tabular-nums">{scores.o}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="grid fit-box grid-cols-3 gap-2"
          role="group"
          aria-label="Tic-Tac-Toe-Spielfeld"
        >
          {board.map((value, i) => {
            const isWin = winCells.includes(i);
            const baseColor = isWin
              ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40'
              : 'border-surface-300 bg-surface-100 hover:bg-surface-200 dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700';
            const valueColor =
              value === 'X'
                ? 'text-amber-600 dark:text-amber-400'
                : value === 'O'
                  ? 'text-rose-600 dark:text-rose-400'
                  : '';
            return (
              <button
                key={`cell-${i}`}
                type="button"
                onClick={() => handleCell(i)}
                disabled={over || value !== '' || turn !== 'X'}
                aria-label={
                  value === '' ? `Feld ${i + 1} leer` : `Feld ${i + 1} ${value === 'X' ? 'X' : 'O'}`
                }
                className={`aspect-square rounded-xl border-2 text-4xl font-extrabold transition-colors disabled:cursor-not-allowed ${baseColor} ${valueColor}`}
              >
                {value || ''}
              </button>
            );
          })}
        </div>
      </div>

      {over && (
        <Button variant="primary" block className="max-w-md" onClick={handleNewGame}>
          Nochmal spielen
        </Button>
      )}
    </div>
  );
}
