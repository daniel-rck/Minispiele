import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  moveByArrow,
  SLIDING_SIZE,
  tryMove,
  type ArrowDirection,
  type SlidingDifficulty,
  type SlidingState,
} from '../lib/slidingPuzzle';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import GameStats from './ui/GameStats';
import GameFooter from './ui/GameFooter';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  EMPTY_SLIDING_HIGHSCORES,
  SlidingDifficultySchema,
  SlidingHighscoresSchema,
  type HighscoreEntry,
} from '../lib/persistedSchemas';
import { isBetter } from '../lib/highscores';
import { useWakeLock } from '../hooks/useWakeLock';

const difficultyLabels: Record<SlidingDifficulty, string> = {
  easy: 'Leicht (3×3)',
  medium: 'Mittel (4×4)',
  hard: 'Schwer (5×5)',
};

export default function SlidingPuzzleGame() {
  const [difficulty, setDifficulty] = useLocalStorage<SlidingDifficulty>(
    STORAGE_KEYS.SLIDING_DIFFICULTY,
    SlidingDifficultySchema,
    'medium',
  );
  const [highscores, setHighscores] = useLocalStorage(
    STORAGE_KEYS.SLIDING_HIGHSCORES,
    SlidingHighscoresSchema,
    EMPTY_SLIDING_HIGHSCORES,
  );

  const [state, setState] = useState<SlidingState>(() => createInitialState(difficulty));
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const timer = useGameTimer();
  useWakeLock(timer.status === 'running');
  const prevMovesRef = useRef(0);
  const prevWonRef = useRef(false);

  const handleTile = useCallback((tileIndex: number) => {
    setState((s) => tryMove(s, tileIndex));
  }, []);

  useEffect(() => {
    if (state.moves > prevMovesRef.current) timer.start();
    if (state.won && !prevWonRef.current) {
      timer.stop();
      const entry: HighscoreEntry = {
        moves: state.moves,
        seconds: timer.elapsedSeconds,
        at: Date.now(),
      };
      const existing = highscores[state.difficulty];
      if (isBetter(entry, existing)) {
        setHighscores({ ...highscores, [state.difficulty]: entry });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
    }
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, state.difficulty, timer, highscores, setHighscores]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let dir: ArrowDirection | null = null;
      switch (e.key) {
        case 'ArrowUp':
          dir = 'up';
          break;
        case 'ArrowDown':
          dir = 'down';
          break;
        case 'ArrowLeft':
          dir = 'left';
          break;
        case 'ArrowRight':
          dir = 'right';
          break;
      }
      if (dir) {
        e.preventDefault();
        setState((s) => moveByArrow(s, dir));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = useCallback(
    (nextDifficulty: SlidingDifficulty = difficulty) => {
      timer.reset();
      prevMovesRef.current = 0;
      prevWonRef.current = false;
      setScoreIsNew(false);
      setWinOpen(false);
      setState(createInitialState(nextDifficulty));
    },
    [difficulty, timer],
  );

  const onDifficultyChange = (next: SlidingDifficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(next);
  };

  const size = SLIDING_SIZE[state.difficulty];
  const best = highscores[state.difficulty];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as SlidingDifficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as SlidingDifficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <GameStats
        items={[
          { label: 'Züge', value: state.moves },
          {
            label: 'Zeit',
            value: formatDuration(timer.elapsedSeconds),
            valueAriaLabel: 'Spielzeit',
          },
          {
            label: 'Best',
            value: best ? (
              <>
                {best.moves}Z · {formatDuration(best.seconds)}
              </>
            ) : (
              <span className="font-normal text-slate-400">noch keine Bestzeit</span>
            ),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <div
          className="grid gap-2 rounded-2xl border-2 border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {state.board.map((value, i) => {
            if (value === 0) {
              return (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-900"
                  aria-hidden
                />
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleTile(i)}
                aria-label={`Plättchen ${value}`}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-brand-300 bg-white text-2xl font-bold tabular-nums text-brand-800 transition hover:border-brand-500 hover:bg-brand-50 sm:text-3xl md:text-4xl dark:border-brand-700 dark:bg-slate-900 dark:text-brand-200"
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Klick auf ein Plättchen neben der Lücke oder Pfeiltasten verwenden.
      </p>

      <GameFooter>
        <Button variant="primary" className="flex-1" onClick={() => restart()}>
          Neu mischen
        </Button>
      </GameFooter>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🎉
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Gelöst in {state.moves} Zügen, Zeit {formatDuration(timer.elapsedSeconds)}.
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
