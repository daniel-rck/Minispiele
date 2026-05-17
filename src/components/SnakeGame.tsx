import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  queueDirection,
  tick,
  tickIntervalMs,
  type Direction,
  type SnakeState,
} from '../lib/snake';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { SnakeBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import AriaLive from './AriaLive';

const COLS = 20;
const ROWS = 20;

type Phase = 'idle' | 'playing' | 'paused' | 'over';

const KEY_TO_DIR: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const SWIPE_THRESHOLD = 24;

export default function SnakeGame() {
  const [state, setState] = useState<SnakeState>(() => createInitialState(COLS, ROWS));
  const [phase, setPhase] = useState<Phase>('idle');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.SNAKE_BEST, SnakeBestSchema, 0);
  const [overOpen, setOverOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const { vibrate } = useVibration();
  useWakeLock(phase === 'playing');

  const handleDirection = useCallback((dir: Direction) => {
    setState((s) => queueDirection(s, dir));
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = tickIntervalMs(state.score);
    const id = window.setInterval(() => {
      setState((s) => tick(s));
    }, interval);
    return () => window.clearInterval(id);
  }, [phase, state.score]);

  useEffect(() => {
    if (!state.alive && phase === 'playing') {
      setPhase('over');
      vibrate([80, 60, 80]);
      if (state.score > best) {
        setBest(state.score);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setAnnouncement(`Verloren mit ${state.score} Punkten`);
      setOverOpen(true);
    }
  }, [state.alive, state.score, phase, best, setBest, vibrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        handleDirection(dir);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setPhase((p) => (p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDirection]);

  const start = useCallback(() => {
    setState(createInitialState(COLS, ROWS));
    setOverOpen(false);
    setScoreIsNew(false);
    setPhase('playing');
    setAnnouncement('Spiel gestartet');
  }, []);

  const togglePause = useCallback(() => {
    setPhase((p) => (p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p));
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleDirection(dx > 0 ? 'right' : 'left');
    } else {
      handleDirection(dy > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  const cellW = 100 / state.cols;
  const cellH = 100 / state.rows;
  const tickMs = tickIntervalMs(state.score);

  return (
    <div className="flex flex-col items-center gap-3 pb-24">
      <AriaLive message={announcement} />

      <div className="grid w-full grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-center">
          {phase === 'idle'
            ? 'Bereit'
            : phase === 'playing'
              ? 'läuft'
              : phase === 'paused'
                ? 'Pause'
                : 'Spiel vorbei'}
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="relative w-full max-w-md select-none sm:max-w-lg"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative aspect-square overflow-hidden rounded-lg bg-slate-50 p-[2px] dark:bg-slate-900"
          role="grid"
          aria-label={`Snake-Spielfeld ${state.cols}×${state.rows}`}
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
            backgroundSize: `${cellW}% ${cellH}%`,
          }}
        >
          {state.snake.map((s, i) => {
            const isHead = i === 0;
            return (
              <div
                key={i}
                aria-hidden
                className={
                  isHead
                    ? 'absolute rounded-md bg-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.6)] dark:bg-emerald-400'
                    : 'absolute rounded-[3px] bg-emerald-500 dark:bg-emerald-600'
                }
                style={{
                  width: `${cellW}%`,
                  height: `${cellH}%`,
                  left: 0,
                  top: 0,
                  transform: `translate3d(${s.x * 100}%, ${s.y * 100}%, 0)`,
                  transition:
                    phase === 'playing'
                      ? `transform ${Math.max(60, tickMs - 20)}ms linear`
                      : 'none',
                }}
              />
            );
          })}
          <div
            aria-hidden
            className="absolute rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]"
            style={{
              width: `${cellW * 0.8}%`,
              height: `${cellH * 0.8}%`,
              left: `${cellW * 0.1}%`,
              top: `${cellH * 0.1}%`,
              transform: `translate3d(${state.food.x * 100}%, ${state.food.y * 100}%, 0)`,
            }}
          />
        </div>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-1 sm:hidden">
        <span aria-hidden />
        <button
          type="button"
          aria-label="Nach oben"
          onClick={() => handleDirection('up')}
          className="min-h-12 rounded-lg border border-slate-300 bg-white py-2 text-lg dark:border-slate-700 dark:bg-slate-900"
        >
          ↑
        </button>
        <span aria-hidden />
        <button
          type="button"
          aria-label="Nach links"
          onClick={() => handleDirection('left')}
          className="min-h-12 rounded-lg border border-slate-300 bg-white py-2 text-lg dark:border-slate-700 dark:bg-slate-900"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Nach unten"
          onClick={() => handleDirection('down')}
          className="min-h-12 rounded-lg border border-slate-300 bg-white py-2 text-lg dark:border-slate-700 dark:bg-slate-900"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Nach rechts"
          onClick={() => handleDirection('right')}
          className="min-h-12 rounded-lg border border-slate-300 bg-white py-2 text-lg dark:border-slate-700 dark:bg-slate-900"
        >
          →
        </button>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          {phase === 'idle' || phase === 'over' ? (
            <Button variant="primary" className="flex-1" onClick={start}>
              {phase === 'over' ? 'Nochmal spielen' : 'Starten'}
            </Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={togglePause}>
              {phase === 'playing' ? 'Pause' : 'Fortsetzen'}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={overOpen} onClose={() => setOverOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🐍
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du hast {state.score} Punkte erreicht.
          </p>
          <Button variant="primary" block onClick={start}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
