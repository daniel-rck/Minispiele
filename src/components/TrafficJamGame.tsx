import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import { STORAGE_KEYS } from '../lib/constants';
import { isBetter } from '../lib/highscores';
import {
  EMPTY_TRAFFIC_JAM_HIGHSCORES,
  type HighscoreEntry,
  TrafficJamDifficultySchema,
  TrafficJamHighscoresSchema,
} from '../lib/persistedSchemas';
import {
  BOARD_SIZE,
  type Car,
  createInitialState,
  type Direction,
  driveCar,
  EXIT_ROW,
  PUZZLES,
  pickRandomPuzzleIndex,
  type TrafficJamDifficulty,
  type TrafficJamState,
} from '../lib/trafficJam';
import { useGameSfx } from '../lib/useGameSfx';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import DifficultySelector from './ui/DifficultySelector';
import GameFooter from './ui/GameFooter';
import GameStats from './ui/GameStats';
import Sheet from './ui/Sheet';

const difficultyLabels: Record<TrafficJamDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

// Stable colors per puzzle letter. 'A' is always red (target car).
// All Tailwind class strings must appear statically so the JIT keeps them.
const CAR_COLORS: Record<string, { body: string; roof: string; stroke: string }> = {
  A: { body: '#ef4444', roof: '#7f1d1d', stroke: '#7f1d1d' },
  B: { body: '#fbbf24', roof: '#92400e', stroke: '#92400e' },
  C: { body: '#10b981', roof: '#065f46', stroke: '#065f46' },
  D: { body: '#0ea5e9', roof: '#075985', stroke: '#075985' },
  E: { body: '#8b5cf6', roof: '#4c1d95', stroke: '#4c1d95' },
  F: { body: '#f97316', roof: '#7c2d12', stroke: '#7c2d12' },
  G: { body: '#ec4899', roof: '#831843', stroke: '#831843' },
  H: { body: '#14b8a6', roof: '#134e4a', stroke: '#134e4a' },
  I: { body: '#84cc16', roof: '#365314', stroke: '#365314' },
  J: { body: '#d946ef', roof: '#701a75', stroke: '#701a75' },
  K: { body: '#06b6d4', roof: '#155e75', stroke: '#155e75' },
};

const FALLBACK_COLOR = { body: '#94a3b8', roof: '#334155', stroke: '#334155' };

function colorFor(id: string) {
  return CAR_COLORS[id] ?? FALLBACK_COLOR;
}

// Top-down SVG of a car/truck with body, windshield (front), wheels, and
// headlights at the facing edge. viewBox matches the car's logical footprint
// so the SVG fills the button cleanly via preserveAspectRatio="none".
function CarSVG({ car }: { car: Car }) {
  const c = colorFor(car.id);
  const isH = car.orientation === 'h';
  const w = isH ? car.length * 100 : 100;
  const h = isH ? 100 : car.length * 100;
  const m = 10; // body margin from cell edge
  const bodyW = w - 2 * m;
  const bodyH = h - 2 * m;

  // Position of the "front" (where headlights point).
  const front = car.facing;

  // Windshield is a small lighter rectangle near the front of the car.
  const wsThickness = isH ? Math.min(bodyW * 0.32, 34) : Math.min(bodyH * 0.32, 34);
  const wsPad = 14;
  let wsX = m + wsPad;
  let wsY = m + wsPad;
  let wsW = bodyW - 2 * wsPad;
  let wsH = bodyH - 2 * wsPad;
  if (isH) {
    wsW = wsThickness;
    wsX = front === 'right' ? w - m - wsPad - wsThickness : m + wsPad;
  } else {
    wsH = wsThickness;
    wsY = front === 'down' ? h - m - wsPad - wsThickness : m + wsPad;
  }

  // Wheels at the four corners — visible bands on the outside of the body.
  const wheelW = isH ? 18 : 8;
  const wheelH = isH ? 8 : 18;
  const wheels = [
    { x: m + 4, y: m - 3 },
    { x: w - m - wheelW - 4, y: m - 3 },
    { x: m + 4, y: h - m - wheelH + 3 },
    { x: w - m - wheelW - 4, y: h - m - wheelH + 3 },
  ];

  // Headlights at the front edge.
  const hlR = 5;
  let hl: { cx: number; cy: number }[];
  if (front === 'right') {
    hl = [
      { cx: w - m - 5, cy: h / 2 - 14 },
      { cx: w - m - 5, cy: h / 2 + 14 },
    ];
  } else if (front === 'left') {
    hl = [
      { cx: m + 5, cy: h / 2 - 14 },
      { cx: m + 5, cy: h / 2 + 14 },
    ];
  } else if (front === 'down') {
    hl = [
      { cx: w / 2 - 14, cy: h - m - 5 },
      { cx: w / 2 + 14, cy: h - m - 5 },
    ];
  } else {
    hl = [
      { cx: w / 2 - 14, cy: m + 5 },
      { cx: w / 2 + 14, cy: m + 5 },
    ];
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="block h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Wheels — drawn behind the body */}
      {wheels.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={wheelW} height={wheelH} rx={3} fill="#1f2937" />
      ))}
      {/* Body */}
      <rect
        x={m}
        y={m}
        width={bodyW}
        height={bodyH}
        rx={12}
        fill={c.body}
        stroke={c.stroke}
        strokeWidth={3}
      />
      {/* Windshield */}
      <rect x={wsX} y={wsY} width={wsW} height={wsH} rx={6} fill="rgba(255,255,255,0.55)" />
      {/* Headlights */}
      {hl.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={hlR}
          fill="#fff8c8"
          stroke={c.stroke}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

const facingArrow: Record<Direction, string> = {
  right: '→',
  left: '←',
  down: '↓',
  up: '↑',
};

const facingWord: Record<Direction, string> = {
  right: 'rechts',
  left: 'links',
  down: 'unten',
  up: 'oben',
};

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
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

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
      setAnnounce(`Gelöst in ${state.moves} Klicks, Zeit ${formatDuration(timer.elapsedSeconds)}.`);
      setWinOpen(true);
      sfx.win();
    }
    prevMovesRef.current = state.moves;
    prevWonRef.current = state.won;
  }, [state.moves, state.won, state.difficulty, timer, highscores, setHighscores, sfx]);

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

  const onDrive = (car: Car) => {
    setState((s) => {
      const after = driveCar(s, car.id);
      if (after !== s) {
        vibrate(15);
        setAnnounce(
          car.isTarget
            ? `Rotes Zielauto fährt nach ${facingWord[car.facing]}`
            : `Auto ${car.id} fährt nach ${facingWord[car.facing]}`,
        );
      } else {
        vibrate(4);
      }
      return after;
    });
  };

  const pool = PUZZLES[difficulty];
  const best = highscores[state.difficulty];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center gap-3">
        <DifficultySelector<TrafficJamDifficulty>
          value={state.difficulty}
          options={difficultyLabels}
          onChange={onDifficultyChange}
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Rätsel {state.puzzleIndex + 1} / {pool.length}
        </span>
      </div>

      <GameStats
        items={[
          { label: 'Klicks', value: state.moves },
          {
            label: 'Zeit',
            value: formatDuration(timer.elapsedSeconds),
            valueAriaLabel: 'Spielzeit',
          },
          {
            label: 'Best',
            value: best ? (
              <>
                {best.moves}K · {formatDuration(best.seconds)}
              </>
            ) : (
              <span className="font-normal text-slate-400">noch keine Bestzeit</span>
            ),
          },
        ]}
      />

      <div className="fit-area mx-auto w-full max-w-md sm:max-w-lg">
        <div className="relative fit-box">
          <span className="sr-only">Ausfahrt rechts in Reihe {EXIT_ROW + 1}</span>

          <div className="pr-7 sm:pr-8">
            <span
              aria-hidden
              className="pointer-events-none absolute right-0 text-2xl leading-none text-red-500 dark:text-red-400"
              style={{
                top: `${((EXIT_ROW + 0.5) / BOARD_SIZE) * 100}%`,
                transform: 'translateY(-50%)',
              }}
            >
              →
            </span>
            <div
              className="grid touch-none gap-1 rounded-2xl border-2 border-slate-300 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1',
                touchAction: 'none',
              }}
            >
              {/* Lane indicator background */}
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                const r = Math.floor(i / BOARD_SIZE);
                const isExitRow = r === EXIT_ROW;
                return (
                  <div
                    key={`bg-${i}`}
                    aria-hidden
                    className={`rounded-md ${
                      isExitRow
                        ? 'bg-slate-200 dark:bg-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/40'
                    }`}
                    style={{
                      gridColumn: `${(i % BOARD_SIZE) + 1} / span 1`,
                      gridRow: `${r + 1} / span 1`,
                    }}
                  />
                );
              })}

              {state.cars.map((car) => {
                const spanCol = car.orientation === 'h' ? car.length : 1;
                const spanRow = car.orientation === 'v' ? car.length : 1;
                const label = car.isTarget
                  ? `Rotes Zielauto, fährt nach ${facingWord[car.facing]}`
                  : `Auto ${car.id}, ${car.length === 3 ? 'Lkw' : 'Pkw'}, fährt nach ${facingWord[car.facing]}`;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => onDrive(car)}
                    aria-label={label}
                    title={`${facingArrow[car.facing]} ${facingWord[car.facing]}`}
                    className="relative block touch-none overflow-visible bg-transparent p-0 transition select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                    style={{
                      gridColumn: `${car.col + 1} / span ${spanCol}`,
                      gridRow: `${car.row + 1} / span ${spanRow}`,
                      minHeight: 0,
                    }}
                  >
                    <CarSVG car={car} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Tipp ein Auto an — es fährt automatisch in seine Fahrtrichtung (Pfeil am Scheinwerfer), so
        weit es kommt. Befreie das rote Auto bis zur rechten Ausfahrt.
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
            Gelöst in {state.moves} Klicks, Zeit {formatDuration(timer.elapsedSeconds)}.
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
