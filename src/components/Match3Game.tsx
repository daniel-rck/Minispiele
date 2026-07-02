import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { Match3BestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const N = 8;
const COLOR_COUNT = 6;
const MOVES = 30;
const COLORS = [
  'bg-sky-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-violet-500',
  'bg-orange-500',
];

type Grid = number[][];

function randomGrid(): Grid {
  // Generate without initial matches but with at least one possible move
  let g: Grid;
  do {
    g = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => Math.floor(Math.random() * COLOR_COUNT)),
    );
  } while (findMatches(g).size > 0 || !hasAnyMove(g));
  return g;
}

function swapCells(g: Grid, r1: number, c1: number, r2: number, c2: number): void {
  const tmp = g[r1]![c1]!;
  g[r1]![c1] = g[r2]![c2]!;
  g[r2]![c2] = tmp;
}

function hasAnyMove(g: Grid): boolean {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c + 1 < N) {
        swapCells(g, r, c, r, c + 1);
        const found = findMatches(g).size > 0;
        swapCells(g, r, c, r, c + 1);
        if (found) return true;
      }
      if (r + 1 < N) {
        swapCells(g, r, c, r + 1, c);
        const found = findMatches(g).size > 0;
        swapCells(g, r, c, r + 1, c);
        if (found) return true;
      }
    }
  }
  return false;
}

function findMatches(g: Grid): Set<string> {
  const matches = new Set<string>();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N - 2; c++) {
      const v = g[r]?.[c];
      if (v !== undefined && v >= 0 && v === g[r]?.[c + 1] && v === g[r]?.[c + 2]) {
        let end = c + 2;
        while (end + 1 < N && g[r]?.[end + 1] === v) end++;
        for (let i = c; i <= end; i++) matches.add(`${r},${i}`);
      }
    }
  }
  for (let c = 0; c < N; c++) {
    for (let r = 0; r < N - 2; r++) {
      const v = g[r]?.[c];
      if (v !== undefined && v >= 0 && v === g[r + 1]?.[c] && v === g[r + 2]?.[c]) {
        let end = r + 2;
        while (end + 1 < N && g[end + 1]?.[c] === v) end++;
        for (let i = r; i <= end; i++) matches.add(`${i},${c}`);
      }
    }
  }
  return matches;
}

function removeAndFill(g: Grid): { changed: boolean; cleared: number } {
  const matches = findMatches(g);
  if (matches.size === 0) return { changed: false, cleared: 0 };
  for (const key of matches) {
    const [r, c] = key.split(',').map(Number);
    if (r !== undefined && c !== undefined) g[r]![c] = -1;
  }
  for (let c = 0; c < N; c++) {
    let write = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const v = g[r]?.[c];
      if (v !== undefined && v >= 0) {
        g[write]![c] = v;
        if (write !== r) g[r]![c] = -1;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) g[r]![c] = Math.floor(Math.random() * COLOR_COUNT);
  }
  return { changed: true, cleared: matches.size };
}

export default function Match3Game() {
  const [grid, setGrid] = useState<Grid>(() => randomGrid());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES);
  const [over, setOver] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [announcement, setAnnouncement] = useState('Tippe zwei benachbarte Steine zum Tauschen.');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.MATCH3_BEST, Match3BestSchema, 0);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  // Ausstehende Kaskaden-Timeouts, damit sie bei Unmount/Restart aufgeräumt
  // werden (sonst setState nach Unmount + Leak).
  const timeoutsRef = useRef<number[]>([]);
  const clearTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];
  }, []);
  useEffect(() => clearTimeouts, [clearTimeouts]);

  const restart = useCallback(() => {
    clearTimeouts();
    setGrid(randomGrid());
    setScore(0);
    setMoves(MOVES);
    setOver(false);
    setSelected(null);
    setAnimating(false);
    setAnnouncement('Tippe zwei benachbarte Steine zum Tauschen.');
  }, [clearTimeouts]);

  const cascade = useCallback(
    (working: Grid, accumulatedScore: number) => {
      const { changed, cleared } = removeAndFill(working);
      if (changed) {
        const ns = accumulatedScore + cleared * 10;
        setScore(ns);
        setGrid(working.map((r) => [...r]));
        sfx.clear();
        vibrate(20);
        timeoutsRef.current.push(window.setTimeout(() => cascade(working, ns), 200));
      } else {
        setAnimating(false);
        setMoves((m) => Math.max(0, m - 1));
      }
    },
    [sfx, vibrate],
  );

  // Game over as effect (not inside the setMoves updater — updaters must stay
  // pure, otherwise sfx/vibrate double-fire under StrictMode)
  useEffect(() => {
    if (over || animating || moves > 0) return;
    setOver(true);
    setAnnouncement(`Spiel vorbei. ${score} Punkte.`);
    if (score > best) {
      setBest(score);
      sfx.win();
      vibrate([60, 40, 120]);
    } else {
      sfx.lose();
    }
  }, [moves, animating, over, score, best, setBest, sfx, vibrate]);

  // Soft-Lock-Schutz: gibt es keinen möglichen Tausch mehr, wird neu gemischt
  useEffect(() => {
    if (over || animating || moves <= 0) return;
    if (!hasAnyMove(grid)) {
      setGrid(randomGrid());
      setSelected(null);
      setAnnouncement('Keine Züge möglich — Feld neu gemischt.');
    }
  }, [grid, over, animating, moves]);

  const handleCell = useCallback(
    (r: number, c: number) => {
      if (over || animating || moves <= 0) return;
      vibrate(10);
      if (!selected) {
        setSelected([r, c]);
        return;
      }
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }
      const dr = Math.abs(sr - r);
      const dc = Math.abs(sc - c);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const next = grid.map((row) => [...row]);
        const a = next[sr]?.[sc];
        const b = next[r]?.[c];
        if (a === undefined || b === undefined) return;
        next[sr]![sc] = b;
        next[r]![c] = a;
        if (findMatches(next).size > 0) {
          setAnimating(true);
          setSelected(null);
          setGrid(next);
          sfx.match();
          timeoutsRef.current.push(window.setTimeout(() => cascade(next, score), 100));
        } else {
          sfx.error();
          setSelected(null);
        }
      } else {
        setSelected([r, c]);
      }
    },
    [over, animating, moves, selected, grid, score, cascade, sfx, vibrate],
  );

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <div className="text-center">
          Züge: <span className="font-semibold tabular-nums">{moves}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[380px]">
        <div
          className="grid fit-box gap-[2px] rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
          role="group"
          aria-label="Match-3-Spielfeld"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
        >
          {grid.flatMap((row, r) =>
            row.map((value, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCell(r, c)}
                  disabled={over}
                  aria-label={`Feld ${r + 1},${c + 1}`}
                  className="aspect-square p-0.5"
                >
                  <span
                    aria-hidden
                    className={`block h-full w-full rounded-full ${COLORS[value] ?? 'bg-slate-700'} ${
                      isSelected ? 'ring-4 ring-amber-300' : ''
                    }`}
                  />
                </button>
              );
            }),
          )}
        </div>
      </div>

      <Button variant="primary" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tausche zwei benachbarte Edelsteine, um Dreierreihen zu bilden. Kaskaden geben Bonuspunkte.
        30 Züge.
      </p>
    </div>
  );
}
