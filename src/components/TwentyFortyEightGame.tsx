import { useCallback, useEffect, useRef, useState } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  GRID_SIZE,
  createInitialGrid,
  hasWinningTile,
  isGameOver,
  slide,
  spawnRandom,
  type Direction,
} from '../lib/twentyFortyEight';
import Sheet from './ui/Sheet';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  TwentyFortyEightBestSchema,
  TwentyFortyEightStateSchema,
  type TwentyFortyEightState,
} from '../lib/persistedSchemas';

const TILE_COLORS: Record<number, string> = {
  0: 'bg-slate-200 dark:bg-slate-800',
  2: 'bg-amber-50 text-slate-800 dark:bg-amber-100 dark:text-slate-900',
  4: 'bg-amber-100 text-slate-800 dark:bg-amber-200 dark:text-slate-900',
  8: 'bg-orange-300 text-white',
  16: 'bg-orange-400 text-white',
  32: 'bg-orange-500 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-yellow-300 text-slate-900',
  256: 'bg-yellow-400 text-slate-900',
  512: 'bg-yellow-500 text-white',
  1024: 'bg-emerald-500 text-white',
  2048: 'bg-brand-600 text-white',
};

function tileClass(value: number): string {
  if (value === 0) return TILE_COLORS[0] ?? '';
  return TILE_COLORS[value] ?? 'bg-brand-700 text-white';
}

function fontSizeClass(value: number): string {
  if (value < 100) return 'text-3xl sm:text-4xl';
  if (value < 1000) return 'text-2xl sm:text-3xl';
  return 'text-xl sm:text-2xl';
}

const initialState: TwentyFortyEightState = {
  grid: createInitialGrid(),
  score: 0,
  won: false,
};

export default function TwentyFortyEightGame() {
  const [state, setState] = useLocalStorage<TwentyFortyEightState>(
    STORAGE_KEYS.TFE_STATE,
    TwentyFortyEightStateSchema,
    initialState,
  );
  const [bestScore, setBestScore] = useLocalStorage<number>(
    STORAGE_KEYS.TFE_BEST,
    TwentyFortyEightBestSchema,
    0,
  );
  const [gameOver, setGameOver] = useState(false);
  const [winShown, setWinShown] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useWakeLock(state.score > 0 && !gameOver);

  useEffect(() => {
    if (state.score > bestScore) setBestScore(state.score);
  }, [state.score, bestScore, setBestScore]);

  useEffect(() => {
    setGameOver(isGameOver(state.grid));
  }, [state.grid]);

  const move = useCallback(
    (direction: Direction) => {
      setState((current) => {
        const { grid: after, moved, gained } = slide(current.grid, direction);
        if (!moved) return current;
        const withSpawn = spawnRandom(after);
        const justWon = !current.won && hasWinningTile(withSpawn);
        if (justWon) setWinShown(true);
        return {
          grid: withSpawn,
          score: current.score + gained,
          won: current.won || justWon,
        };
      });
    },
    [setState],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 'right';
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 'down';
          break;
      }
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (Math.max(adx, ady) < 30) return;
    if (adx > ady) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  };

  const restart = useCallback(() => {
    setState({ grid: createInitialGrid(), score: 0, won: false });
    setGameOver(false);
    setWinShown(false);
  }, [setState]);

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="grid grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Score: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div>
          Best: <span className="font-semibold tabular-nums">{bestScore}</span>
        </div>
        <div className="text-right">
          {state.won && <span className="text-emerald-600 dark:text-emerald-400">2048 ✓</span>}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <div
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="rounded-2xl border-2 border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
          style={{ touchAction: 'none' }}
        >
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {state.grid.map((v, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-xl font-bold tabular-nums transition ${tileClass(v)} ${fontSizeClass(v)}`}
                aria-label={v === 0 ? `Feld ${i + 1} leer` : `Feld ${i + 1}: ${v}`}
              >
                {v === 0 ? '' : v}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Pfeiltasten oder Wischen, um Kacheln zu bewegen.
      </p>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={restart}
            className="min-h-12 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </div>

      <Sheet open={winShown} onClose={() => setWinShown(false)} title="2048 erreicht!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🏆
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du hast die 2048-Kachel erreicht! Du kannst weiter spielen oder neu starten.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWinShown(false)}
              className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-medium hover:border-brand-300 dark:border-slate-700"
            >
              Weiterspielen
            </button>
            <button
              type="button"
              onClick={restart}
              className="min-h-12 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
            >
              Nochmal spielen
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet open={gameOver && !state.won} onClose={restart} title="Spiel vorbei">
        <div className="text-center">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Keine Züge mehr möglich. Score: {state.score}.
          </p>
          <button
            type="button"
            onClick={restart}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </Sheet>
    </div>
  );
}
