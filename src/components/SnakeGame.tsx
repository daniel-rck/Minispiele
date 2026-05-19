import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import { STORAGE_KEYS } from '../lib/constants';
import { SnakeBestSchema } from '../lib/persistedSchemas';
import {
  createInitialState,
  type Direction,
  queueDirection,
  type SnakeState,
  tick,
  tickIntervalMs,
} from '../lib/snake';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import GameFooter from './ui/GameFooter';
import GameOverSheet from './ui/GameOverSheet';
import GameStats from './ui/GameStats';

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

export default function SnakeGame() {
  const [state, setState] = useState<SnakeState>(() => createInitialState(COLS, ROWS));
  const [phase, setPhase] = useState<Phase>('idle');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.SNAKE_BEST, SnakeBestSchema, 0);
  const [overOpen, setOverOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const stateRef = useRef(state);
  stateRef.current = state;
  const { vibrate } = useVibration();
  useWakeLock(phase === 'playing');

  const handleDirection = useCallback((dir: Direction) => {
    setState((s) => queueDirection(s, dir));
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipeDetection({ onSwipe: handleDirection });

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

  const cellW = 100 / state.cols;
  const cellH = 100 / state.rows;
  const tickMs = tickIntervalMs(state.score);

  return (
    <div className="flex flex-col items-center gap-3 pb-24">
      <AriaLive message={announcement} />

      <GameStats
        className="w-full"
        items={[
          { label: 'Punkte', value: state.score },
          {
            label: '',
            value:
              phase === 'idle'
                ? 'Bereit'
                : phase === 'playing'
                  ? 'läuft'
                  : phase === 'paused'
                    ? 'Pause'
                    : 'Spiel vorbei',
          },
          { label: 'Best', value: best },
        ]}
      />

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

      <GameFooter>
        {phase === 'idle' || phase === 'over' ? (
          <Button variant="primary" className="flex-1" onClick={start}>
            {phase === 'over' ? 'Nochmal spielen' : 'Starten'}
          </Button>
        ) : (
          <Button variant="primary" className="flex-1" onClick={togglePause}>
            {phase === 'playing' ? 'Pause' : 'Fortsetzen'}
          </Button>
        )}
      </GameFooter>

      <GameOverSheet
        open={overOpen}
        onClose={() => setOverOpen(false)}
        title="Spiel vorbei"
        emoji="🐍"
        isNewRecord={scoreIsNew}
        message={`Du hast ${state.score} Punkte erreicht.`}
        primaryAction={{ label: 'Nochmal spielen', onClick: start }}
      />
    </div>
  );
}
