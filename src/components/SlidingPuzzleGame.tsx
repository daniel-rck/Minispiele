import { useCallback, useEffect, useRef, useState } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { STORAGE_KEYS } from '../lib/constants';
import { isBetter } from '../lib/highscores';
import {
  EMPTY_SLIDING_HIGHSCORES,
  type HighscoreEntry,
  SlidingDifficultySchema,
  SlidingHighscoresSchema,
} from '../lib/persistedSchemas';
import {
  type ArrowDirection,
  createInitialState,
  moveByArrow,
  SLIDING_SIZE,
  type SlidingDifficulty,
  type SlidingState,
  tryMove,
} from '../lib/slidingPuzzle';
import { useGameSfx } from '../lib/useGameSfx';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import Button from './ui/Button';
import DifficultySelector from './ui/DifficultySelector';
import GameFooter from './ui/GameFooter';
import GameStats from './ui/GameStats';
import Sheet from './ui/Sheet';

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
  const sfx = useGameSfx();

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
      sfx.win();
    }
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, state.difficulty, timer, highscores, setHighscores, sfx]);

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
    <div className="flex h-full min-h-0 flex-col gap-3 pb-2">
      <div className="flex flex-wrap items-center gap-3">
        <DifficultySelector<SlidingDifficulty>
          value={state.difficulty}
          options={difficultyLabels}
          onChange={onDifficultyChange}
        />
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

      <div className="fit-area mx-auto w-full max-w-md sm:max-w-lg">
        <div
          className="grid fit-box gap-2 rounded-2xl border-2 border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"
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
