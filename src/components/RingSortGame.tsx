import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  pegCapacity,
  selectPeg,
  tryMove,
  type Difficulty,
  type GameState,
} from '../lib/ringSort';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import Peg from './Peg';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import { DifficultySchema, MixSchema } from '../lib/persistedSchemas';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

export default function RingSortGame() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>(
    STORAGE_KEYS.RING_DIFFICULTY,
    DifficultySchema,
    'medium',
  );
  const [allowColorMix, setAllowColorMix] = useLocalStorage<boolean>(
    STORAGE_KEYS.RING_MIX,
    MixSchema,
    false,
  );
  const [state, setState] = useState<GameState>(() =>
    createInitialState(difficulty, allowColorMix),
  );
  const timer = useGameTimer();
  const prevMovesRef = useRef(state.moves);
  const prevWonRef = useRef(state.won);

  useEffect(() => {
    if (state.moves > prevMovesRef.current) timer.start();
    if (state.won && !prevWonRef.current) timer.stop();
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, timer]);

  const handlePegClick = useCallback((index: number) => {
    setState((s) => {
      if (s.won) return s;
      if (s.selectedPegIndex === null) return selectPeg(s, index);
      if (s.selectedPegIndex === index) return { ...s, selectedPegIndex: null };
      return tryMove(s, s.selectedPegIndex, index);
    });
  }, []);

  const restart = useCallback(
    (nextDifficulty: Difficulty = difficulty, nextMix: boolean = allowColorMix) => {
      timer.reset();
      prevMovesRef.current = 0;
      prevWonRef.current = false;
      setState(createInitialState(nextDifficulty, nextMix));
    },
    [difficulty, allowColorMix, timer],
  );

  const onDifficultyChange = (next: Difficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(next, allowColorMix);
  };

  const onMixToggle = (next: boolean) => {
    if (next === allowColorMix) return;
    setAllowColorMix(next);
    restart(difficulty, next);
  };

  const capacity = pegCapacity(state.difficulty);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.allowColorMix}
            onChange={(e) => onMixToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
          />
          <span className="text-slate-600 dark:text-slate-300">Farbmix erlaubt</span>
        </label>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Zeit:{' '}
          <span className="font-semibold tabular-nums" aria-label="Spielzeit">
            {formatDuration(timer.elapsedSeconds)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => restart()}
          className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Neu starten
        </button>
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {state.pegs.map((peg, i) => (
            <Peg
              key={i}
              peg={peg}
              index={i}
              capacity={capacity}
              selected={state.selectedPegIndex === i}
              onClick={handlePegClick}
            />
          ))}
        </div>

        {state.won && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm">
            <div className="max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-slate-900">
              <div className="mb-2 text-3xl" aria-hidden>
                🎉
              </div>
              <div className="mb-1 text-lg font-semibold">Gewonnen!</div>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                Sortiert in {state.moves} Zügen, Zeit {formatDuration(timer.elapsedSeconds)}.
              </div>
              <button
                type="button"
                onClick={() => restart()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Nochmal spielen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
