import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { useWakeLock } from '../hooks/useWakeLock';
import { STORAGE_KEYS } from '../lib/constants';
import {
  TwentyFortyEightBestSchema,
  type TwentyFortyEightState,
  TwentyFortyEightStateSchema,
} from '../lib/persistedSchemas';
import {
  createInitialGrid,
  type Direction,
  GRID_SIZE,
  hasWinningTile,
  isGameOver,
  slide,
  spawnRandom,
} from '../lib/twentyFortyEight';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import Button from './ui/Button';
import GameFooter from './ui/GameFooter';
import GameStats from './ui/GameStats';
import Sheet from './ui/Sheet';

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

/** Returns the largest tile value whose count grew between before and after — i.e. the biggest tile this turn produced. */
function highestMergedTile(before: readonly number[], after: readonly number[]): number {
  const counts = new Map<number, number>();
  for (const v of after) if (v > 0) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const v of before) if (v > 0) counts.set(v, (counts.get(v) ?? 0) - 1);
  let max = 0;
  for (const [v, delta] of counts) if (delta > 0 && v > max) max = v;
  return max;
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
  const prevGameOverRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const sfx = useGameSfx();
  useWakeLock(state.score > 0 && !gameOver);

  useEffect(() => {
    if (state.score > bestScore) setBestScore(state.score);
  }, [state.score, bestScore, setBestScore]);

  useEffect(() => {
    const over = isGameOver(state.grid);
    setGameOver(over);
    if (over && !prevGameOverRef.current && !state.won) sfx.lose();
    prevGameOverRef.current = over;
  }, [state.grid, state.won, sfx]);

  const move = useCallback(
    (direction: Direction) => {
      // Außerhalb des setState-Updaters rechnen: Updater müssen pur bleiben,
      // sonst feuern sfx.merge/sfx.win unter StrictMode doppelt
      const current = stateRef.current;
      const { grid: after, moved, gained } = slide(current.grid, direction);
      if (!moved) return;
      const withSpawn = spawnRandom(after);
      const justWon = !current.won && hasWinningTile(withSpawn);
      if (gained > 0) {
        const mergedValue = highestMergedTile(current.grid, after);
        if (mergedValue > 0) sfx.merge(Math.log2(mergedValue));
      }
      if (justWon) {
        setWinShown(true);
        sfx.win();
      }
      setState({
        grid: withSpawn,
        score: current.score + gained,
        won: current.won || justWon,
      });
    },
    [setState, sfx],
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

  const { onTouchStart, onTouchEnd, onTouchCancel } = useSwipeDetection({
    threshold: 30,
    onSwipe: move,
  });

  const restart = useCallback(() => {
    setState({ grid: createInitialGrid(), score: 0, won: false });
    setGameOver(false);
    setWinShown(false);
  }, [setState]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-2">
      <GameStats
        items={[
          { label: 'Score', value: state.score },
          { label: 'Best', value: bestScore },
          {
            label: '',
            value: state.won ? (
              <span className="text-emerald-600 dark:text-emerald-400">2048 ✓</span>
            ) : null,
          },
        ]}
      />

      <div className="fit-area mx-auto w-full max-w-md sm:max-w-lg">
        <div
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          className="fit-box rounded-2xl border-2 border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
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
                role="img"
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

      <GameFooter>
        <Button variant="primary" className="flex-1" onClick={restart}>
          Nochmal spielen
        </Button>
      </GameFooter>

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
            <Button variant="primary" className="flex-1" onClick={restart}>
              Nochmal spielen
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={gameOver && !state.won} onClose={restart} title="Spiel vorbei">
        <div className="text-center">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Keine Züge mehr möglich. Score: {state.score}.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
