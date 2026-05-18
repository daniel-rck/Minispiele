import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOARD_SIZE,
  createInitialState,
  EXIT_ROW,
  moveSelected,
  PUZZLES,
  pickRandomPuzzleIndex,
  selectCar,
  slideCar,
  TARGET_ID,
  type Direction,
  type TrafficJamDifficulty,
  type TrafficJamState,
} from '../lib/trafficJam';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import GameStats from './ui/GameStats';
import GameFooter from './ui/GameFooter';
import AriaLive from './AriaLive';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  EMPTY_TRAFFIC_JAM_HIGHSCORES,
  TrafficJamDifficultySchema,
  TrafficJamHighscoresSchema,
  type HighscoreEntry,
} from '../lib/persistedSchemas';
import { isBetter } from '../lib/highscores';
import { useWakeLock } from '../hooks/useWakeLock';

const difficultyLabels: Record<TrafficJamDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

// Stable color per puzzle letter. 'A' is always red (the target car).
// All Tailwind class strings must appear statically here for the JIT to keep them.
const CAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'bg-red-500', border: 'border-red-700', text: 'text-white' },
  B: { bg: 'bg-amber-400', border: 'border-amber-600', text: 'text-amber-950' },
  C: { bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white' },
  D: { bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-white' },
  E: { bg: 'bg-violet-500', border: 'border-violet-700', text: 'text-white' },
  F: { bg: 'bg-orange-500', border: 'border-orange-700', text: 'text-white' },
  G: { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-white' },
  H: { bg: 'bg-teal-500', border: 'border-teal-700', text: 'text-white' },
  I: { bg: 'bg-lime-500', border: 'border-lime-700', text: 'text-lime-950' },
  J: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-700', text: 'text-white' },
  K: { bg: 'bg-cyan-500', border: 'border-cyan-700', text: 'text-white' },
};

const FALLBACK_COLOR = { bg: 'bg-slate-400', border: 'border-slate-600', text: 'text-white' };

function colorFor(id: string) {
  return CAR_COLORS[id] ?? FALLBACK_COLOR;
}

const SWIPE_THRESHOLD = 20;

export default function TrafficJamGame() {
  const [difficulty, setDifficulty] = useLocalStorage<TrafficJamDifficulty>(
    STORAGE_KEYS.TRAFFIC_JAM_DIFFICULTY,
    TrafficJamDifficultySchema,
    'easy',
  );
  const [highscores, setHighscores] = useLocalStorage(
    STORAGE_KEYS.TRAFFIC_JAM_HIGHSCORES,
    TrafficJamHighscoresSchema,
    EMPTY_TRAFFIC_JAM_HIGHSCORES,
  );

  const [state, setState] = useState<TrafficJamState>(() => createInitialState(difficulty, 0));
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timer = useGameTimer();
  useWakeLock(timer.status === 'running');
  const prevMovesRef = useRef(0);
  const prevWonRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; carId: string | null } | null>(null);

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
      setAnnounce(`Gelöst in ${state.moves} Zügen, Zeit ${formatDuration(timer.elapsedSeconds)}.`);
      setWinOpen(true);
    }
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, state.difficulty, timer, highscores, setHighscores]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
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
        setState((s) => moveSelected(s, dir));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = useCallback(
    (nextDifficulty: TrafficJamDifficulty = difficulty, nextIndex: number = 0) => {
      timer.reset();
      prevMovesRef.current = 0;
      prevWonRef.current = false;
      setScoreIsNew(false);
      setWinOpen(false);
      setAnnounce('');
      setState(createInitialState(nextDifficulty, nextIndex));
    },
    [difficulty, timer],
  );

  const onDifficultyChange = (next: TrafficJamDifficulty) => {
    if (next === difficulty) return;
    setDifficulty(next);
    restart(next, 0);
  };

  const onNextPuzzle = () => {
    const next = pickRandomPuzzleIndex(difficulty, state.puzzleIndex);
    restart(difficulty, next);
  };

  const onSelectCar = (carId: string) => {
    setState((s) => selectCar(s, carId));
    setAnnounce(carId === TARGET_ID ? 'Rotes Zielauto ausgewählt' : `Auto ${carId} ausgewählt`);
  };

  const onCarTouchStart = (carId: string) => (e: React.TouchEvent<HTMLButtonElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, carId };
    setState((s) => selectCar(s, carId));
  };

  const onBoardTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    if (!start || !t) {
      touchStartRef.current = null;
      return;
    }
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      // Treat as a tap — selection already happened on touchstart.
      touchStartRef.current = null;
      return;
    }
    const dir: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    if (start.carId) {
      setState((s) => slideCar(s, start.carId!, dir));
    }
    touchStartRef.current = null;
  };

  const pool = PUZZLES[difficulty];
  const best = highscores[state.difficulty];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Schwierigkeit:</span>
          <select
            value={state.difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as TrafficJamDifficulty)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {(Object.keys(difficultyLabels) as TrafficJamDifficulty[]).map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Rätsel {state.puzzleIndex + 1} / {pool.length}
        </span>
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

      <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
        <span className="sr-only">Ausfahrt rechts in Reihe {EXIT_ROW + 1}</span>
        {/* Exit chevron on the right side of row 2 */}
        <span
          aria-hidden
          className="pointer-events-none absolute text-2xl leading-none text-red-500 dark:text-red-400"
          style={{
            top: `${((EXIT_ROW + 0.5) / BOARD_SIZE) * 100}%`,
            right: '-1.5rem',
            transform: 'translateY(-50%)',
          }}
        >
          →
        </span>

        <div className="pr-6">
          <div
            onTouchEnd={onBoardTouchEnd}
            className="grid gap-1 rounded-2xl border-2 border-slate-300 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              aspectRatio: '1 / 1',
            }}
          >
            {/* Lane indicator for the exit row */}
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const r = Math.floor(i / BOARD_SIZE);
              const isExitRow = r === EXIT_ROW;
              return (
                <div
                  key={`bg-${i}`}
                  aria-hidden
                  className={`rounded-md ${isExitRow ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-900/40'}`}
                  style={{
                    gridColumn: `${(i % BOARD_SIZE) + 1} / span 1`,
                    gridRow: `${r + 1} / span 1`,
                  }}
                />
              );
            })}

            {state.cars.map((car) => {
              const color = colorFor(car.id);
              const isSelected = car.id === state.selectedCarId;
              const spanCol = car.orientation === 'h' ? car.length : 1;
              const spanRow = car.orientation === 'v' ? car.length : 1;
              const label = car.isTarget
                ? `Rotes Zielauto, ${car.orientation === 'h' ? 'horizontal' : 'vertikal'}`
                : `Auto ${car.id}, Länge ${car.length}, ${
                    car.orientation === 'h' ? 'horizontal' : 'vertikal'
                  }`;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => onSelectCar(car.id)}
                  onTouchStart={onCarTouchStart(car.id)}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-center rounded-lg border-2 font-bold transition ${color.bg} ${color.border} ${color.text} ${
                    isSelected ? 'ring-4 ring-amber-300 ring-offset-1 z-10 dark:ring-amber-400' : ''
                  } ${car.isTarget ? 'shadow-lg' : ''}`}
                  style={{
                    gridColumn: `${car.col + 1} / span ${spanCol}`,
                    gridRow: `${car.row + 1} / span ${spanRow}`,
                    minHeight: 0,
                  }}
                >
                  <span aria-hidden className="text-xs sm:text-sm">
                    {car.isTarget ? '★' : car.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Auto antippen, dann mit Pfeiltasten oder Wischgeste verschieben. Bringe das rote Auto nach
        rechts hinaus.
      </p>

      <GameFooter>
        <Button variant="secondary" className="flex-1" onClick={() => restart()}>
          Neu starten
        </Button>
        <Button variant="primary" className="flex-1" onClick={onNextPuzzle}>
          Nächstes Rätsel
        </Button>
      </GameFooter>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🚗💨
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Gelöst in {state.moves} Zügen, Zeit {formatDuration(timer.elapsedSeconds)}.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="primary" block onClick={onNextPuzzle}>
              Nächstes Rätsel
            </Button>
            <Button variant="secondary" block onClick={() => restart()}>
              Nochmal spielen
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
