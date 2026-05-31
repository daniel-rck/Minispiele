import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import { isBetter } from '../lib/highscores';
import {
  createInitialState,
  flipCard,
  MEMORY_COLS,
  type MemoryDifficulty,
  type MemoryState,
  resolvePicks,
} from '../lib/memory';
import {
  EMPTY_MEMORY_HIGHSCORES,
  type HighscoreEntry,
  MemoryDifficultySchema,
  MemoryHighscoresSchema,
} from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import Button from './ui/Button';
import DifficultySelector from './ui/DifficultySelector';
import GameFooter from './ui/GameFooter';
import GameOverSheet from './ui/GameOverSheet';
import GameStats from './ui/GameStats';

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
  const prevMatchedRef = useRef(0);
  const sfx = useGameSfx();

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
    const matched = state.cards.filter((c) => c.matched).length;
    if (matched > prevMatchedRef.current && !state.won) sfx.match();
    prevMatchedRef.current = matched;
  }, [state.cards, state.won, sfx]);

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
      sfx.win();
    }
    prevWonRef.current = state.won;
  }, [state.won, state.moves, state.difficulty, timer, highscores, setHighscores, sfx]);

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
  const rows = Math.ceil(state.cards.length / cols);
  const best = highscores[state.difficulty];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-2">
      <div className="flex flex-wrap items-center gap-3">
        <DifficultySelector<MemoryDifficulty>
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
              <span className="font-normal text-surface-400">noch keine Bestzeit</span>
            ),
          },
        ]}
      />

      <div className="fit-area w-full">
        <div
          className="grid max-w-md gap-2 fit-box sm:max-w-lg sm:gap-3 md:max-w-xl"
          style={
            {
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              '--fit-ar': cols / rows,
            } as CSSProperties
          }
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

      <GameFooter>
        <Button variant="primary" onClick={() => restart()} className="flex-1">
          Neu
        </Button>
      </GameFooter>

      <GameOverSheet
        open={winOpen}
        onClose={() => setWinOpen(false)}
        title="Gewonnen!"
        emoji="🎉"
        isNewRecord={scoreIsNew}
        recordLabel="Neue Bestzeit!"
        message={`Gelöst in ${state.moves} Zügen, Zeit ${formatDuration(timer.elapsedSeconds)}.`}
        primaryAction={{ label: 'Nochmal spielen', onClick: () => restart() }}
      />
    </div>
  );
}
