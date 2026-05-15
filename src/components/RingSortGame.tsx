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

const DIFFICULTY_KEY = 'minispiele.ringSort.difficulty';
const MIX_KEY = 'minispiele.ringSort.allowColorMix';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

function loadDifficulty(): Difficulty {
  if (typeof window === 'undefined') return 'medium';
  const stored = window.localStorage.getItem(DIFFICULTY_KEY);
  if (stored === 'easy' || stored === 'medium' || stored === 'hard') return stored;
  return 'medium';
}

function loadAllowColorMix(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MIX_KEY) === 'true';
}

export default function RingSortGame() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(loadDifficulty(), loadAllowColorMix()),
  );
  const timer = useGameTimer();
  const prevMovesRef = useRef(state.moves);
  const prevWonRef = useRef(state.won);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DIFFICULTY_KEY, state.difficulty);
  }, [state.difficulty]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MIX_KEY, String(state.allowColorMix));
  }, [state.allowColorMix]);

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
    (difficulty: Difficulty = state.difficulty, allowColorMix: boolean = state.allowColorMix) => {
      timer.reset();
      prevMovesRef.current = 0;
      prevWonRef.current = false;
      setState(createInitialState(difficulty, allowColorMix));
    },
    [state.difficulty, state.allowColorMix, timer],
  );

  const onDifficultyChange = (next: Difficulty) => {
    if (next === state.difficulty) return;
    restart(next, state.allowColorMix);
  };

  const onMixToggle = (next: boolean) => {
    if (next === state.allowColorMix) return;
    restart(state.difficulty, next);
  };

  const capacity = pegCapacity(state.difficulty);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
          >
            {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-center gap-2 cursor-pointer">
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
          className="ml-auto rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5"
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
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl text-center max-w-xs">
              <div className="text-3xl mb-2" aria-hidden>
                🎉
              </div>
              <div className="text-lg font-semibold mb-1">Gewonnen!</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Sortiert in {state.moves} Zügen, Zeit {formatDuration(timer.elapsedSeconds)}.
              </div>
              <button
                type="button"
                onClick={() => restart()}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2"
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
