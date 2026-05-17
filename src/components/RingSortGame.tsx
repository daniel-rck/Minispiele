import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  pegCapacity,
  selectPeg,
  solve,
  tryMove,
  undoMove,
  type Difficulty,
  type GameState,
  type Move,
} from '../lib/ringSort';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import Peg from './Peg';
import BottomSheet from './BottomSheet';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  DifficultySchema,
  EMPTY_HIGHSCORES,
  HighscoresSchema,
  MixSchema,
  type HighscoreEntry,
} from '../lib/persistedSchemas';
import { applyHighscore } from '../lib/highscores';
import { useWakeLock } from '../hooks/useWakeLock';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

interface HintHighlight {
  from: number;
  to: number;
}

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
  const [highscores, setHighscores] = useLocalStorage(
    STORAGE_KEYS.RING_HIGHSCORES,
    HighscoresSchema,
    EMPTY_HIGHSCORES,
  );

  const [state, setState] = useState<GameState>(() =>
    createInitialState(difficulty, allowColorMix),
  );
  const [history, setHistory] = useState<Move[]>([]);
  const [hint, setHint] = useState<HintHighlight | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [hintFailed, setHintFailed] = useState(false);
  const [winSheetOpen, setWinSheetOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);

  const timer = useGameTimer();
  useWakeLock(timer.status === 'running');
  const prevMovesRef = useRef(state.moves);
  const prevWonRef = useRef(state.won);
  const hintTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.moves > prevMovesRef.current) timer.start();
    if (state.won && !prevWonRef.current) {
      timer.stop();
      const entry: HighscoreEntry = {
        moves: state.moves,
        seconds: timer.elapsedSeconds,
        at: Date.now(),
      };
      const result = applyHighscore(highscores, state.difficulty, entry);
      setHighscores(result.scores);
      setScoreIsNew(result.isNew);
      setWinSheetOpen(true);
    }
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, state.difficulty, timer, highscores, setHighscores]);

  useEffect(
    () => () => {
      if (hintTimeoutRef.current !== null) window.clearTimeout(hintTimeoutRef.current);
    },
    [],
  );

  const handlePegClick = useCallback((index: number) => {
    setHint(null);
    setHintFailed(false);
    setState((s) => {
      if (s.won) return s;
      if (s.selectedPegIndex === null) return selectPeg(s, index);
      if (s.selectedPegIndex === index) return { ...s, selectedPegIndex: null };
      const from = s.selectedPegIndex;
      const next = tryMove(s, from, index);
      if (next !== s && next.moves > s.moves) {
        setHistory((h) => [...h, { from, to: index }]);
      }
      return next;
    });
  }, []);

  const restart = useCallback(
    (nextDifficulty: Difficulty = difficulty, nextMix: boolean = allowColorMix) => {
      timer.reset();
      prevMovesRef.current = 0;
      prevWonRef.current = false;
      setHistory([]);
      setHint(null);
      setHintFailed(false);
      setScoreIsNew(false);
      setWinSheetOpen(false);
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

  const handleUndo = useCallback(() => {
    if (state.won || history.length === 0) return;
    const result = undoMove(state, history);
    setState(result.state);
    setHistory(result.history);
    setHint(null);
    setHintFailed(false);
  }, [state, history]);

  const handleHint = useCallback(() => {
    if (state.won || hintBusy) return;
    setHintBusy(true);
    setHint(null);
    setHintFailed(false);
    // Defer to next tick so the busy state can render before the BFS blocks.
    window.setTimeout(() => {
      const path = solve(state);
      if (path && path.length > 0) {
        const first = path[0];
        if (first) {
          setHint({ from: first.from, to: first.to });
          if (hintTimeoutRef.current !== null) window.clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = window.setTimeout(() => {
            setHint(null);
          }, ANIMATION.HINT_HIGHLIGHT_MS);
        }
      } else {
        setHintFailed(true);
      }
      setHintBusy(false);
    }, 0);
  }, [state, hintBusy]);

  const capacity = pegCapacity(state.difficulty);
  const currentBest = highscores[state.difficulty];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.allowColorMix}
            onChange={(e) => onMixToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
          />
          <span className="text-slate-600 dark:text-slate-300">Farbmix erlaubt</span>
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
          {currentBest ? (
            <>
              Best:{' '}
              <span className="font-semibold tabular-nums">
                {currentBest.moves}Z · {formatDuration(currentBest.seconds)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">noch keine Bestzeit</span>
          )}
        </div>
      </div>

      <div className="peg-board relative mx-auto w-full max-w-[720px]">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {state.pegs.map((peg, i) => {
            const highlighted =
              hint !== null && (i === hint.from || i === hint.to)
                ? i === hint.from
                  ? 'hint-from'
                  : 'hint-to'
                : null;
            return (
              <div
                key={i}
                className={
                  highlighted
                    ? 'ring-2 ring-offset-2 motion-safe:animate-pulse rounded-2xl ' +
                      (highlighted === 'hint-from'
                        ? 'ring-amber-400 ring-offset-amber-100 dark:ring-offset-amber-950/30'
                        : 'ring-emerald-400 ring-offset-emerald-100 dark:ring-offset-emerald-950/30')
                    : ''
                }
              >
                <Peg
                  peg={peg}
                  index={i}
                  capacity={capacity}
                  selected={state.selectedPegIndex === i}
                  onClick={handlePegClick}
                />
              </div>
            );
          })}
        </div>
      </div>

      {hintFailed && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          Kein Tipp gefunden — auf schwer kann die Berechnung zu groß werden.
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 || state.won}
            className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium hover:border-brand-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
          >
            ↶ Zurück
          </button>
          <button
            type="button"
            onClick={handleHint}
            disabled={hintBusy || state.won}
            aria-busy={hintBusy}
            className="min-h-12 flex-1 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-900 hover:border-amber-500 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {hintBusy ? '…' : '💡 Tipp'}
          </button>
          <button
            type="button"
            onClick={() => restart()}
            className="min-h-12 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Neu
          </button>
        </div>
      </div>

      <BottomSheet open={winSheetOpen} onClose={() => setWinSheetOpen(false)} title="Gewonnen!">
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
            Sortiert in {state.moves} Zügen, Zeit {formatDuration(timer.elapsedSeconds)}.
          </p>
          {currentBest && !scoreIsNew && (
            <p className="mb-4 text-xs text-slate-500">
              Bestzeit: {currentBest.moves} Züge · {formatDuration(currentBest.seconds)}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setWinSheetOpen(false);
              restart();
            }}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
