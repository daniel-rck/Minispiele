import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import {
  BLOCKS_COLORS as COLORS,
  BLOCKS_COLS as COLS,
  cellsOf,
  clearLines,
  emptyBoard,
  fits,
  fullRowIndices,
  intervalForLevel,
  merge,
  PIECES,
  type Piece,
  BLOCKS_ROWS as ROWS,
  randomType,
  spawnPiece,
  tryRotate,
} from '../lib/blocks';
import { STORAGE_KEYS } from '../lib/constants';
import { BlocksBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

interface GameState {
  board: number[];
  piece: Piece | null;
  nextType: number;
  score: number;
  level: number;
  lines: number;
  status: 'idle' | 'playing' | 'over';
  flashingRows: number[];
}

export default function BlocksGame() {
  const [state, setState] = useState<GameState>({
    board: emptyBoard(),
    piece: null,
    nextType: randomType(),
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
  const sfx = useGameSfx();

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
      const nextPiece = spawnPiece(s.nextType);
      const newNextType = randomType();
      if (!fits(cleared, nextPiece)) {
        return {
          ...s,
          board: cleared,
          piece: null,
          nextType: newNextType,
          status: 'over',
          flashingRows: [],
        };
      }
      return {
        ...s,
        board: cleared,
        piece: nextPiece,
        nextType: newNextType,
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
        sfx.clear();
        if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => finalizeClear(merged), 180);
        return { ...s, board: merged, piece: null, flashingRows: rows };
      }
      const nextPiece = spawnPiece(s.nextType);
      const newNextType = randomType();
      if (!fits(merged, nextPiece)) {
        return { ...s, board: merged, piece: null, nextType: newNextType, status: 'over' };
      }
      return { ...s, board: merged, piece: nextPiece, nextType: newNextType };
    });
  }, [vibrate, finalizeClear, sfx]);

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
      sfx.lose();
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.status, state.score, best, setBest, vibrate, sfx]);

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
      nextType: randomType(),
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
      const candidate = tryRotate(s.board, s.piece);
      return candidate ? { ...s, piece: candidate } : s;
    });
  }, []);

  const softDrop = useCallback(() => tick(), [tick]);

  const hardDrop = useCallback(() => {
    setState((s) => {
      if (!s.piece || s.status !== 'playing' || s.flashingRows.length > 0) return s;
      let p = s.piece;
      let dropDistance = 0;
      while (fits(s.board, { ...p, y: p.y + 1 })) {
        p = { ...p, y: p.y + 1 };
        dropDistance += 1;
      }
      const merged = merge(s.board, p);
      const rows = fullRowIndices(merged);
      const scoreAdd = dropDistance * 2;
      if (rows.length > 0) {
        if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => finalizeClear(merged), 180);
        return {
          ...s,
          board: merged,
          piece: null,
          flashingRows: rows,
          score: s.score + scoreAdd,
        };
      }
      const next = spawnPiece(s.nextType);
      const newNextType = randomType();
      const status = fits(merged, next) ? 'playing' : 'over';
      return {
        ...s,
        board: merged,
        piece: status === 'playing' ? next : null,
        nextType: newNextType,
        status,
        score: s.score + scoreAdd,
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

  const nextDef = PIECES[state.nextType]!;
  const nextCells = nextDef.rotations[0]!;
  const nextMaxX = Math.max(...nextCells.map(([x]) => x));
  const nextMaxY = Math.max(...nextCells.map(([, y]) => y));
  const nextGrid = Array.from({ length: (nextMaxY + 1) * (nextMaxX + 1) }, () => 0);
  for (const [x, y] of nextCells) {
    nextGrid[y * (nextMaxX + 1) + x] = nextDef.color;
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex w-full max-w-xs items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="grid flex-1 grid-cols-3 gap-2">
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
          className="flex flex-col items-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800"
          role="img"
          aria-label="Nächster Block"
        >
          <span className="mb-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Nächster
          </span>
          <div
            className="grid gap-px"
            style={{ gridTemplateColumns: `repeat(${nextMaxX + 1}, 0.6rem)` }}
            aria-hidden
          >
            {nextGrid.map((v, i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: v === 0 ? 'transparent' : COLORS[v] }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fit-area w-full">
        <div
          className="relative fit-box max-w-xs overflow-hidden rounded-2xl bg-slate-900 p-1 dark:bg-slate-950"
          style={{ '--fit-ar': COLS / ROWS } as CSSProperties}
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
              <Button variant="primary" onClick={start}>
                Starten
              </Button>
            </div>
          )}
        </div>
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

      <Sheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🧱
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du erreichst {state.score} Punkte ({state.lines} Reihen).
          </p>
          <Button variant="primary" block onClick={start}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
