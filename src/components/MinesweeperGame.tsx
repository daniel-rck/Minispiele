import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import {
  createInitialState,
  DIFFICULTY,
  type MinesweeperState,
  reveal,
  toggleFlag,
} from '../lib/minesweeper';
import {
  EMPTY_MINES_HIGHSCORES,
  type MinesDifficulty,
  MinesDifficultySchema,
  type MinesEntry,
  MinesHighscoresSchema,
} from '../lib/persistedSchemas';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import GameFooter from './ui/GameFooter';
import GameStats from './ui/GameStats';
import Sheet from './ui/Sheet';

const NUMBER_COLOR: Readonly<Record<number, string>> = {
  1: 'text-blue-600 dark:text-blue-400',
  2: 'text-emerald-600 dark:text-emerald-400',
  3: 'text-red-600 dark:text-red-400',
  4: 'text-indigo-700 dark:text-indigo-300',
  5: 'text-amber-700 dark:text-amber-400',
  6: 'text-cyan-600 dark:text-cyan-300',
  7: 'text-slate-900 dark:text-slate-100',
  8: 'text-slate-600 dark:text-slate-400',
};

const difficultyLabels: Record<MinesDifficulty, string> = {
  easy: `Leicht (${DIFFICULTY.easy.cols}×${DIFFICULTY.easy.rows}, ${DIFFICULTY.easy.mines})`,
  medium: `Mittel (${DIFFICULTY.medium.cols}×${DIFFICULTY.medium.rows}, ${DIFFICULTY.medium.mines})`,
  hard: `Schwer (${DIFFICULTY.hard.cols}×${DIFFICULTY.hard.rows}, ${DIFFICULTY.hard.mines})`,
};

function isBetterMines(candidate: MinesEntry, existing: MinesEntry | null): boolean {
  if (!existing) return true;
  return candidate.seconds < existing.seconds;
}

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useLocalStorage<MinesDifficulty>(
    STORAGE_KEYS.MINES_DIFFICULTY,
    MinesDifficultySchema,
    'easy',
  );
  const [highscores, setHighscores] = useLocalStorage(
    STORAGE_KEYS.MINES_HIGHSCORES,
    MinesHighscoresSchema,
    EMPTY_MINES_HIGHSCORES,
  );

  const [state, setState] = useState<MinesweeperState>(() => createInitialState(difficulty));
  const [flagMode, setFlagMode] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const timer = useGameTimer();
  const longPressRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const prevWonRef = useRef(false);
  const prevLostRef = useRef(false);
  const { vibrate } = useVibration();

  useEffect(() => {
    if (state.firstClick) return;
    if (state.won || state.lost) return;
    if (timer.status === 'idle') timer.start();
  }, [state.firstClick, state.won, state.lost, timer]);

  useEffect(() => {
    if (state.won && !prevWonRef.current) {
      timer.stop();
      const entry: MinesEntry = { seconds: timer.elapsedSeconds, at: Date.now() };
      const existing = highscores[state.difficulty];
      if (isBetterMines(entry, existing)) {
        setHighscores({ ...highscores, [state.difficulty]: entry });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnouncement('Gewonnen!');
    }
    prevWonRef.current = state.won;
  }, [state.won, state.difficulty, timer, highscores, setHighscores]);

  useEffect(() => {
    if (state.lost && !prevLostRef.current) {
      timer.stop();
      vibrate([80, 60, 80]);
      setLostOpen(true);
      setAnnouncement('Verloren — auf eine Mine getreten');
    }
    prevLostRef.current = state.lost;
  }, [state.lost, timer, vibrate]);

  const restart = useCallback(
    (nextDifficulty: MinesDifficulty = difficulty) => {
      timer.reset();
      prevWonRef.current = false;
      prevLostRef.current = false;
      setScoreIsNew(false);
      setWinOpen(false);
      setLostOpen(false);
      setFlagMode(false);
      setState(createInitialState(nextDifficulty));
    },
    [difficulty, timer],
  );

  const onDifficultyChange = (next: MinesDifficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(next);
  };

  const handleCellAction = useCallback(
    (idx: number, asFlag: boolean) => {
      if (state.lost || state.won) return;
      const cell = state.grid[idx];
      if (!cell) return;
      if (asFlag) {
        if (cell.revealed) return;
        vibrate(15);
        setState((s) => toggleFlag(s, idx));
      } else {
        if (cell.flagged) return;
        setState((s) => reveal(s, idx));
      }
    },
    [state.lost, state.won, state.grid, vibrate],
  );

  const onPointerDown = (idx: number) => {
    longPressFiredRef.current = false;
    if (longPressRef.current !== null) window.clearTimeout(longPressRef.current);
    longPressRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      vibrate(25);
      handleCellAction(idx, true);
    }, ANIMATION.LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const onCellClick = (idx: number) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    handleCellAction(idx, flagMode);
  };

  const onContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    handleCellAction(idx, true);
  };

  useEffect(
    () => () => {
      if (longPressRef.current !== null) window.clearTimeout(longPressRef.current);
    },
    [],
  );

  const minesRemaining = state.mines - state.flagged;
  const best = highscores[state.difficulty];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as MinesDifficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as MinesDifficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <GameStats
        items={[
          { label: '🚩', value: minesRemaining },
          { label: '⏱', value: formatDuration(timer.elapsedSeconds) },
          {
            label: 'Best',
            value: best ? (
              formatDuration(best.seconds)
            ) : (
              <span className="font-normal text-slate-400">noch keine Bestzeit</span>
            ),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-md overflow-x-auto sm:max-w-lg">
        <div
          className="grid gap-[2px] rounded-lg bg-slate-300 p-[2px] dark:bg-slate-700"
          style={{ gridTemplateColumns: `repeat(${state.cols}, minmax(20px, 1fr))` }}
        >
          {state.grid.map((cell, idx) => {
            const revealed = cell.revealed;
            const showMine = cell.mine && (state.lost || cell.revealed);
            const isLosingMine = state.losingIdx === idx;
            const wrongFlag = state.lost && cell.flagged && !cell.mine;
            const cellLabel = cell.flagged
              ? `Zelle ${idx + 1}, geflaggt`
              : revealed
                ? cell.mine
                  ? `Zelle ${idx + 1}, Mine`
                  : cell.adjacent === 0
                    ? `Zelle ${idx + 1}, leer`
                    : `Zelle ${idx + 1}, ${cell.adjacent}`
                : `Zelle ${idx + 1}, verdeckt`;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onCellClick(idx)}
                onPointerDown={() => onPointerDown(idx)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onContextMenu={(e) => onContextMenu(e, idx)}
                aria-label={cellLabel}
                disabled={state.lost || state.won}
                className={`aspect-square touch-manipulation select-none text-xs font-bold sm:text-sm ${
                  revealed
                    ? showMine
                      ? isLosingMine
                        ? 'bg-red-500 text-white'
                        : 'bg-red-300 text-red-900 dark:bg-red-900 dark:text-red-100'
                      : 'bg-slate-100 dark:bg-slate-800'
                    : 'bg-slate-200 hover:bg-slate-100 active:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600'
                } ${wrongFlag ? 'ring-2 ring-red-500 ring-inset' : ''}`}
              >
                {revealed ? (
                  cell.mine ? (
                    <span aria-hidden>💣</span>
                  ) : cell.adjacent > 0 ? (
                    <span aria-hidden className={NUMBER_COLOR[cell.adjacent] ?? ''}>
                      {cell.adjacent}
                    </span>
                  ) : null
                ) : cell.flagged ? (
                  <span aria-hidden>🚩</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <GameFooter>
        <button
          type="button"
          onClick={() => setFlagMode((m) => !m)}
          aria-pressed={flagMode}
          aria-label={flagMode ? 'Flaggen-Modus aktiv (umschalten)' : 'Flaggen-Modus einschalten'}
          className={`min-h-12 min-w-12 rounded-xl px-3 text-base ${
            flagMode
              ? 'bg-amber-500 text-white'
              : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          🚩
        </button>
        <Button variant="primary" className="flex-1" onClick={() => restart()}>
          Neu
        </Button>
      </GameFooter>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gewonnen!">
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
            Gelöst in {formatDuration(timer.elapsedSeconds)}.
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>

      <Sheet open={lostOpen} onClose={() => setLostOpen(false)} title="Bumm!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Auf eine Mine getreten. Beim nächsten Mal!
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
