import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  createInitialState,
  type HanoiState,
  isSolved,
  minimumMoves,
  selectPeg,
} from '../lib/hanoi';
import { HanoiBestSchema, HanoiDisksSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const DISK_OPTIONS = [3, 4, 5, 6, 7, 8] as const;
const DISK_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

export default function HanoiGame() {
  const [disks, setDisks] = useLocalStorage<number>(STORAGE_KEYS.HANOI_DISKS, HanoiDisksSchema, 4);
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.HANOI_BEST,
    HanoiBestSchema,
    {},
  );
  const [state, setState] = useState<HanoiState>(() => createInitialState(disks));
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const prevSolvedRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const solved = isSolved(state);
  const optimal = minimumMoves(state.disks);
  const best = bestMap[String(state.disks)];

  useEffect(() => {
    if (solved && !prevSolvedRef.current) {
      const moves = state.moves;
      const key = String(state.disks);
      const prevBest = bestMap[key];
      if (prevBest === undefined || moves < prevBest) {
        setBestMap({ ...bestMap, [key]: moves });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce('Gelöst!');
      vibrate([40, 30, 60]);
      sfx.win();
    }
    prevSolvedRef.current = solved;
  }, [solved, state.moves, state.disks, bestMap, setBestMap, vibrate, sfx]);

  const restart = useCallback(
    (next: number = disks) => {
      setState(createInitialState(next));
      setWinOpen(false);
      setScoreIsNew(false);
      prevSolvedRef.current = false;
    },
    [disks],
  );

  const changeDisks = (n: number) => {
    setDisks(n);
    restart(n);
  };

  const handlePeg = (peg: number) => {
    setState((s) => {
      const next = selectPeg(s, peg);
      if (next === s) vibrate([40, 20, 40]);
      else if (next.selected === null && next.moves !== s.moves) vibrate(15);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Scheiben:</span>
          <select
            value={state.disks}
            onChange={(e) => changeDisks(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {DISK_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div className="text-center">
          Min: <span className="font-semibold tabular-nums">{optimal}</span>
        </div>
        <div className="text-right">
          {best !== undefined ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div
        className="flex w-full max-w-md items-end justify-around gap-2 rounded-2xl bg-slate-200 p-3 dark:bg-slate-800"
        style={{ minHeight: `${state.disks * 28 + 60}px` }}
      >
        {state.pegs.map((peg, pegIdx) => {
          const selected = state.selected === pegIdx;
          return (
            <button
              key={pegIdx}
              type="button"
              onClick={() => handlePeg(pegIdx)}
              aria-label={`Stab ${pegIdx + 1}`}
              className={`relative flex flex-1 flex-col items-center justify-end self-stretch rounded-lg pb-2 transition ${
                selected
                  ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-200 dark:ring-offset-slate-800'
                  : ''
              }`}
            >
              <div className="absolute bottom-2 top-3 w-1.5 -translate-y-0 rounded bg-slate-400 dark:bg-slate-600" />
              <div className="relative flex w-full flex-col-reverse items-center gap-[2px] pb-0">
                {peg.map((diskSize, i) => {
                  const widthPct = 30 + (diskSize / state.disks) * 65;
                  const color = DISK_COLORS[(diskSize - 1) % DISK_COLORS.length];
                  return (
                    <div
                      key={`${diskSize}-${i}`}
                      className={`h-5 rounded-md ${color}`}
                      style={{ width: `${widthPct}%` }}
                      role="img"
                      aria-label={`Scheibe Größe ${diskSize}`}
                    />
                  );
                })}
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-slate-500 dark:bg-slate-700" />
            </button>
          );
        })}
      </div>

      <Button variant="primary" block className="max-w-md" onClick={() => restart()}>
        Nochmal spielen
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe einen Stab um die oberste Scheibe auszuwählen, dann einen anderen Stab als Ziel. Eine
        größere Scheibe darf nie auf einer kleineren liegen.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🗼
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {state.disks} Scheiben in {state.moves} Zügen (Optimum: {optimal}).
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
