import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  flipCard,
  resolvePicks,
  MEMORY_COLS,
  type MemoryDifficulty,
  type MemoryState,
} from '../lib/memory';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import BottomSheet from './BottomSheet';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  EMPTY_MEMORY_HIGHSCORES,
  MemoryDifficultySchema,
  MemoryHighscoresSchema,
  type HighscoreEntry,
} from '../lib/persistedSchemas';
import { isBetter } from '../lib/highscores';
import { useWakeLock } from '../hooks/useWakeLock';

const difficultyLabels: Record<MemoryDifficulty, string> = {
  easy: 'Leicht (6 Paare)',
  medium: 'Mittel (8 Paare)',
  hard: 'Schwer (18 Paare)',
};

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useLocalStorage<MemoryDifficulty>(
    STORAGE_KEYS.MEMORY_DIFFICULTY,
    MemoryDifficultySchema,
    'medium',
  );
  const [highscores, setHighscores] = useLocalStorage(
    STORAGE_KEYS.MEMORY_HIGHSCORES,
    MemoryHighscoresSchema,
    EMPTY_MEMORY_HIGHSCORES,
  );

  const [state, setState] = useState<MemoryState>(() => createInitialState(difficulty));
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const timer = useGameTimer();
  useWakeLock(timer.status === 'running');
  const peekTimeoutRef = useRef<number | null>(null);
  const prevWonRef = useRef(false);

  const handleFlip = useCallback((index: number) => {
    setState((s) => flipCard(s, index));
  }, []);

  useEffect(() => {
    if (state.firstPick !== null && state.secondPick === null) timer.start();
  }, [state.firstPick, state.secondPick, timer]);

  useEffect(() => {
    if (state.secondPick === null) return;
    if (peekTimeoutRef.current !== null) window.clearTimeout(peekTimeoutRef.current);
    peekTimeoutRef.current = window.setTimeout(() => {
      setState((s) => resolvePicks(s));
    }, ANIMATION.MEMORY_PEEK_MS);
    return () => {
      if (peekTimeoutRef.current !== null) window.clearTimeout(peekTimeoutRef.current);
    };
  }, [state.secondPick]);

  useEffect(() => {
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
    prevWonRef.current = state.won;
  }, [state.won, state.moves, state.difficulty, timer, highscores, setHighscores]);

  const restart = useCallback(
    (nextDifficulty: MemoryDifficulty = difficulty) => {
      timer.reset();
      prevWonRef.current = false;
      setScoreIsNew(false);
      setWinOpen(false);
      setState(createInitialState(nextDifficulty));
    },
    [difficulty, timer],
  );

  const onDifficultyChange = (next: MemoryDifficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(next);
  };

  const cols = MEMORY_COLS[state.difficulty];
  const best = highscores[state.difficulty];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as MemoryDifficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as MemoryDifficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div>
          Zeit:{' '}
          <span className="font-semibold tabular-nums" aria-label="Spielzeit">
            {formatDuration(timer.elapsedSeconds)}
          </span>
        </div>
        <div className="text-right">
          {best ? (
            <>
              Best:{' '}
              <span className="font-semibold tabular-nums">
                {best.moves}Z · {formatDuration(best.seconds)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">noch keine Bestzeit</span>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl">
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {state.cards.map((card, i) => {
            const revealed = card.flipped || card.matched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleFlip(i)}
                aria-label={`Karte ${i + 1}${card.matched ? ', gefunden' : revealed ? `, ${card.symbol}` : ''}`}
                aria-pressed={revealed}
                disabled={card.matched}
                className={`relative flex aspect-square items-center justify-center rounded-xl border-2 text-3xl transition select-none sm:text-4xl md:text-5xl ${
                  card.matched
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                    : revealed
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                      : 'border-slate-300 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <span aria-hidden className={revealed ? 'opacity-100' : 'opacity-0'}>
                  {card.symbol}
                </span>
                {!revealed && (
                  <span aria-hidden className="text-2xl text-slate-400 dark:text-slate-600">
                    ?
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => restart()}
            className="min-h-12 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Neu
          </button>
        </div>
      </div>

      <BottomSheet open={winOpen} onClose={() => setWinOpen(false)} title="Gewonnen!">
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
          <button
            type="button"
            onClick={() => restart()}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
