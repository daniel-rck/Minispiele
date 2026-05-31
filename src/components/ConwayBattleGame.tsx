import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const COLS = 30;
const ROWS = 20;
const INITIAL_BUDGET = 30;
const MAX_GENERATIONS = 200;
const STEP_MS = 80;

type Cell = 0 | 1 | 2; // 0 empty, 1 blue (player), 2 red (AI)

type Phase = 'place' | 'battle' | 'done';

function makeGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
}

function placeAI(grid: Cell[][], count: number): void {
  let n = count;
  while (n > 0) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(COLS / 2) + Math.floor((Math.random() * COLS) / 2);
    const row = grid[r];
    if (!row) continue;
    if (!row[c]) {
      row[c] = 2;
      n--;
    }
  }
}

function step(grid: readonly Cell[][]): Cell[][] {
  const next: Cell[][] = makeGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let alive = 0;
      let blueN = 0;
      let redN = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + ROWS) % ROWS;
          const nc = (c + dc + COLS) % COLS;
          const v = grid[nr]?.[nc] ?? 0;
          if (v) {
            alive++;
            if (v === 1) blueN++;
            else redN++;
          }
        }
      }
      const v = grid[r]?.[c] ?? 0;
      const nrow = next[r];
      if (!nrow) continue;
      if (v) {
        nrow[c] = alive === 2 || alive === 3 ? v : 0;
      } else if (alive === 3) {
        nrow[c] = blueN > redN ? 1 : 2;
      }
    }
  }
  return next;
}

function countCells(grid: readonly Cell[][]): { blue: number; red: number } {
  let blue = 0;
  let red = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r]?.[c];
      if (v === 1) blue++;
      else if (v === 2) red++;
    }
  }
  return { blue, red };
}

export default function ConwayBattleGame() {
  const [grid, setGrid] = useState<Cell[][]>(() => {
    const g = makeGrid();
    placeAI(g, INITIAL_BUDGET);
    return g;
  });
  const [phase, setPhase] = useState<Phase>('place');
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [generation, setGeneration] = useState(0);
  const [announcement, setAnnouncement] = useState(
    'Platziere deine Zellen (Blau) in der linken Hälfte.',
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const sfx = useGameSfx();
  const { vibrate } = useVibration();
  const { blue, red } = countCells(grid);

  const restart = useCallback(() => {
    const g = makeGrid();
    placeAI(g, INITIAL_BUDGET);
    setGrid(g);
    setPhase('place');
    setBudget(INITIAL_BUDGET);
    setGeneration(0);
    setAnnouncement('Platziere deine Zellen (Blau) in der linken Hälfte.');
  }, []);

  const toggleCell = useCallback(
    (r: number, c: number) => {
      if (phaseRef.current !== 'place') return;
      if (c >= Math.floor(COLS / 2)) return;
      vibrate(10);
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        const row = next[r];
        if (!row) return prev;
        const current = row[c] ?? 0;
        if (current === 1) {
          row[c] = 0;
          setBudget((b) => b + 1);
        } else if (current === 0) {
          setBudget((b) => {
            if (b <= 0) return b;
            row[c] = 1;
            return b - 1;
          });
        }
        return next;
      });
    },
    [vibrate],
  );

  const startBattle = useCallback(() => {
    if (phase !== 'place') return;
    setPhase('battle');
    setAnnouncement('Schlacht läuft.');
    sfx.match();
  }, [phase, sfx]);

  useEffect(() => {
    if (phase !== 'battle') return;
    const interval = window.setInterval(() => {
      setGrid((prev) => {
        const next = step(prev);
        const { blue: b, red: r } = countCells(next);
        if (b === 0 || r === 0) {
          setPhase('done');
          if (b > r) {
            setAnnouncement(`Blau gewinnt! ${b} : ${r}.`);
            sfx.win();
            vibrate([60, 40, 120]);
          } else if (r > b) {
            setAnnouncement(`Rot gewinnt! ${r} : ${b}.`);
            sfx.lose();
            vibrate([120, 60, 60]);
          } else {
            setAnnouncement(`Unentschieden! ${b} : ${r}.`);
            sfx.error();
          }
        }
        return next;
      });
      setGeneration((g) => {
        if (g + 1 >= MAX_GENERATIONS) {
          setPhase('done');
        }
        return g + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(interval);
  }, [phase, sfx, vibrate]);

  useEffect(() => {
    if (phase === 'done' && generation >= MAX_GENERATIONS) {
      const { blue: b, red: r } = countCells(grid);
      if (b > r) {
        setAnnouncement(`Zeit aus. Blau gewinnt! ${b} : ${r}.`);
        sfx.win();
      } else if (r > b) {
        setAnnouncement(`Zeit aus. Rot gewinnt! ${r} : ${b}.`);
        sfx.lose();
      } else {
        setAnnouncement(`Zeit aus. Unentschieden! ${b} : ${r}.`);
      }
    }
  }, [phase, generation, grid, sfx]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-xl grid-cols-4 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Blau: <span className="font-semibold tabular-nums text-sky-500">{blue}</span>
        </div>
        <div>
          Rot: <span className="font-semibold tabular-nums text-rose-500">{red}</span>
        </div>
        <div>
          Generation: <span className="font-semibold tabular-nums">{generation}</span>
        </div>
        <div>
          Budget: <span className="font-semibold tabular-nums">{budget}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-xl">
        <div
          className="grid fit-box gap-[1px] rounded-lg bg-slate-900 p-1 dark:bg-slate-950"
          role="group"
          aria-label="Conway-Battle-Spielfeld"
          style={
            {
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              '--fit-ar': COLS / ROWS,
            } as CSSProperties
          }
        >
          {grid.flatMap((row, r) =>
            row.map((value, c) => {
              const inPlayerHalf = c < Math.floor(COLS / 2);
              const bg =
                value === 1
                  ? 'bg-sky-500'
                  : value === 2
                    ? 'bg-rose-500'
                    : phase === 'place' && inPlayerHalf
                      ? 'bg-amber-900/20'
                      : 'bg-slate-800/40';
              const isDisabled = phase !== 'place' || !inPlayerHalf;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => toggleCell(r, c)}
                  disabled={isDisabled}
                  aria-label={`Zelle Zeile ${r + 1} Spalte ${c + 1}${value === 1 ? ' blau' : value === 2 ? ' rot' : ''}`}
                  className={`aspect-square ${bg} transition disabled:cursor-not-allowed`}
                />
              );
            }),
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={startBattle}
          disabled={phase !== 'place' || blue === 0}
        >
          Schlacht starten
        </Button>
        <Button variant="secondary" size="sm" onClick={restart}>
          Neues Spiel
        </Button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tippe Zellen in deiner linken Hälfte. Conway-Regeln: 2-3 Nachbarn überleben, exakt 3
        gebären. Nach 200 Generationen entscheidet die Mehrheit.
      </p>
    </div>
  );
}
