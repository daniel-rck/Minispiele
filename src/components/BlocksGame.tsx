import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { BlocksBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import BottomSheet from './BottomSheet';
import AriaLive from './AriaLive';

const COLS = 10;
const ROWS = 18;
const COLORS = ['', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// pieces as rotation arrays of (col, row) offsets, color index 1..7
const PIECES: { color: number; rotations: [number, number][][] }[] = [
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

interface Piece {
  type: number;
  rot: number;
  x: number;
  y: number;
}

interface GameState {
  board: number[];
  piece: Piece | null;
  score: number;
  level: number;
  lines: number;
  status: 'idle' | 'playing' | 'over';
  flashingRows: number[];
}

function fullRowIndices(board: number[]): number[] {
  const rows: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    let full = true;
    for (let c = 0; c < COLS; c++) {
      if (board[r * COLS + c] === 0) {
        full = false;
        break;
      }
    }
    if (full) rows.push(r);
  }
  return rows;
}

function emptyBoard(): number[] {
  return new Array(COLS * ROWS).fill(0);
}

function spawnPiece(): Piece {
  const type = Math.floor(Math.random() * PIECES.length);
  return { type, rot: 0, x: 3, y: 0 };
}

function cellsOf(piece: Piece): [number, number][] {
  const def = PIECES[piece.type]!;
  const rot = def.rotations[piece.rot % def.rotations.length]!;
  return rot.map(([dx, dy]) => [piece.x + dx, piece.y + dy]);
}

function fits(board: number[], piece: Piece): boolean {
  for (const [x, y] of cellsOf(piece)) {
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y >= 0 && board[y * COLS + x] !== 0) return false;
  }
  return true;
}

function merge(board: number[], piece: Piece): number[] {
  const next = board.slice();
  const def = PIECES[piece.type]!;
  for (const [x, y] of cellsOf(piece)) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) next[y * COLS + x] = def.color;
  }
  return next;
}

function clearLines(board: number[]): { board: number[]; cleared: number } {
  const kept: number[] = [];
  let cleared = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = board.slice(r * COLS, (r + 1) * COLS);
    if (row.every((v) => v !== 0)) cleared++;
    else kept.push(...row);
  }
  const empties = new Array(cleared * COLS).fill(0);
  return { board: [...empties, ...kept], cleared };
}

function intervalForLevel(level: number): number {
  return Math.max(120, 700 - level * 60);
}

export default function BlocksGame() {
  const [state, setState] = useState<GameState>({
    board: emptyBoard(),
    piece: null,
    score: 0,
    level: 0,
    lines: 0,
    status: 'idle',
    flashingRows: [],
  });
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.BLOCKS_BEST, BlocksBestSchema, 0);
  const [doneOpen, setDoneOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const tickRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, []);

  const finalizeClear = useCallback((merged: number[]) => {
    clearTimerRef.current = null;
    setState((s) => {
      const { board: cleared, cleared: lineCount } = clearLines(merged);
      const newLines = s.lines + lineCount;
      const newLevel = Math.floor(newLines / 10);
      const scoreAdd = [0, 100, 300, 500, 800][lineCount] ?? 0;
      const nextPiece = spawnPiece();
      if (!fits(cleared, nextPiece)) {
        return { ...s, board: cleared, piece: null, status: 'over', flashingRows: [] };
      }
      return {
        ...s,
        board: cleared,
        piece: nextPiece,
        score: s.score + scoreAdd,
        lines: newLines,
        level: newLevel,
        flashingRows: [],
      };
    });
  }, []);

  const tick = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing' || !s.piece) return s;
      if (s.flashingRows.length > 0) return s; // hold while line-sweep plays
      const moved: Piece = { ...s.piece, y: s.piece.y + 1 };
      if (fits(s.board, moved)) return { ...s, piece: moved };
      // lock
      const merged = merge(s.board, s.piece);
      const rows = fullRowIndices(merged);
      if (rows.length > 0) {
        vibrate(25);
        if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => finalizeClear(merged), 180);
        return { ...s, board: merged, piece: null, flashingRows: rows };
      }
      const nextPiece = spawnPiece();
      if (!fits(merged, nextPiece)) {
        return { ...s, board: merged, piece: null, status: 'over' };
      }
      return { ...s, board: merged, piece: nextPiece };
    });
  }, [vibrate, finalizeClear]);

  useEffect(() => {
    if (state.status !== 'playing') return;
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(tick, intervalForLevel(state.level));
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [state.status, state.level, tick]);

  useEffect(() => {
    if (state.status === 'over' && !finishedRef.current) {
      finishedRef.current = true;
      if (state.score > best) setBest(state.score);
      setAnnounce(`Spiel vorbei. ${state.score} Punkte`);
      vibrate([80, 60, 80]);
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.status, state.score, best, setBest, vibrate]);

  const start = () => {
    finishedRef.current = false;
    setDoneOpen(false);
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setState({
      board: emptyBoard(),
      piece: spawnPiece(),
      score: 0,
      level: 0,
      lines: 0,
      status: 'playing',
      flashingRows: [],
    });
  };

  const move = useCallback((dx: number) => {
    setState((s) => {
      if (!s.piece || s.status !== 'playing') return s;
      const moved: Piece = { ...s.piece, x: s.piece.x + dx };
      return fits(s.board, moved) ? { ...s, piece: moved } : s;
    });
  }, []);

  const rotate = useCallback(() => {
    setState((s) => {
      if (!s.piece || s.status !== 'playing') return s;
      const moved: Piece = { ...s.piece, rot: s.piece.rot + 1 };
      return fits(s.board, moved) ? { ...s, piece: moved } : s;
    });
  }, []);

  const softDrop = useCallback(() => tick(), [tick]);

  const hardDrop = useCallback(() => {
    setState((s) => {
      if (!s.piece || s.status !== 'playing' || s.flashingRows.length > 0) return s;
      let p = s.piece;
      while (fits(s.board, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 };
      const merged = merge(s.board, p);
      const rows = fullRowIndices(merged);
      if (rows.length > 0) {
        if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => finalizeClear(merged), 180);
        return { ...s, board: merged, piece: null, flashingRows: rows };
      }
      const next = spawnPiece();
      const status = fits(merged, next) ? 'playing' : 'over';
      return {
        ...s,
        board: merged,
        piece: status === 'playing' ? next : null,
        status,
      };
    });
    vibrate(20);
  }, [vibrate, finalizeClear]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.status !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          rotate();
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.status, move, rotate, softDrop, hardDrop]);

  const displayBoard = state.board.slice();
  if (state.piece) {
    const def = PIECES[state.piece.type]!;
    for (const [x, y] of cellsOf(state.piece)) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) displayBoard[y * COLS + x] = def.color;
    }
  }
  const flashSet = new Set(state.flashingRows);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-center">
          Lv: <span className="font-semibold tabular-nums">{state.level}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-slate-900 p-1 dark:bg-slate-950"
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
      >
        <div
          className="grid h-full w-full gap-px"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          role="grid"
          aria-label="Blockstapler-Feld"
        >
          {displayBoard.map((v, i) => {
            const row = Math.floor(i / COLS);
            const flashing = flashSet.has(row);
            return (
              <div
                key={i}
                className={`rounded-[2px] ${flashing ? 'blocks-line-sweep' : ''}`}
                style={{ background: v === 0 ? 'rgba(255,255,255,0.04)' : COLORS[v] }}
                aria-hidden
              />
            );
          })}
        </div>
        {state.status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button
              type="button"
              onClick={start}
              className="min-h-12 rounded-xl bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
            >
              Starten
            </button>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-md grid-cols-5 gap-2" role="group" aria-label="Steuerung">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Links"
          className="min-h-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
        >
          ←
        </button>
        <button
          type="button"
          onClick={rotate}
          aria-label="Drehen"
          className="min-h-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
        >
          ⟳
        </button>
        <button
          type="button"
          onClick={softDrop}
          aria-label="Runter"
          className="min-h-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={hardDrop}
          aria-label="Sofort fallen"
          className="min-h-12 rounded-xl bg-slate-100 text-sm dark:bg-slate-800"
        >
          ⇩⇩
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Rechts"
          className="min-h-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
        >
          →
        </button>
      </div>

      <BottomSheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🧱
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du erreichst {state.score} Punkte ({state.lines} Reihen).
          </p>
          <button
            type="button"
            onClick={start}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
