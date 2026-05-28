import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type NurikabeSize, NurikabeSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SIZES: readonly NurikabeSize[] = [5, 7, 9];

interface Puzzle {
  n: number;
  clues: Map<string, number>;
}

function hasAdjacentClue(used: Set<string>, r: number, c: number): boolean {
  return [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ].some(([dr = 0, dc = 0]) => used.has(`${r + dr},${c + dc}`));
}

function generate(n: number): Puzzle {
  const used = new Set<string>();
  const clues = new Map<string, number>();
  const numIslands = Math.floor(n * n * 0.15) + 2;
  let attempts = 0;
  while (clues.size < numIslands && attempts < 500) {
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    const key = `${r},${c}`;
    if (used.has(key) || hasAdjacentClue(used, r, c)) {
      attempts++;
      continue;
    }
    used.add(key);
    clues.set(key, 1 + Math.floor(Math.random() * 3));
  }
  return { n, clues };
}

export default function NurikabeGame() {
  const [size, setSize] = useLocalStorage<NurikabeSize>(
    STORAGE_KEYS.NURIKABE_SIZE,
    NurikabeSizeSchema,
    5,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(size));
  const [state, setState] = useState<number[][]>(() =>
    Array.from({ length: size }, () => Array<number>(size).fill(0)),
  );
  const [announcement, setAnnouncement] = useState(
    'Klicke leere Felder, um Meer zu setzen. Inseln = Zahlen.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: NurikabeSize) => {
    const next = generate(n);
    setPuzzle(next);
    setState(Array.from({ length: n }, () => Array<number>(n).fill(0)));
    setAnnouncement(`Neues ${n}×${n}-Rätsel.`);
  }, []);

  useEffect(() => {
    if (puzzle.n !== size) restart(size);
  }, [size, puzzle.n, restart]);

  const toggleCell = useCallback(
    (r: number, c: number) => {
      if (puzzle.clues.has(`${r},${c}`)) return;
      vibrate(15);
      setState((s) => {
        const next = s.map((row) => [...row]);
        const row = next[r];
        if (!row) return s;
        row[c] = row[c] === 1 ? 0 : 1;
        return next;
      });
    },
    [puzzle.clues, vibrate],
  );

  const check = useCallback(() => {
    const n = puzzle.n;
    // sea connected
    let seaStart: [number, number] | null = null;
    let seaCount = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (state[r]?.[c] === 1) {
          seaCount++;
          if (!seaStart) seaStart = [r, c];
        }
      }
    }
    if (seaStart && seaCount > 0) {
      const visited = new Set<string>();
      const queue: [number, number][] = [seaStart];
      visited.add(`${seaStart[0]},${seaStart[1]}`);
      while (queue.length) {
        const head = queue.shift();
        if (!head) break;
        const [r, c] = head;
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          const k = `${nr},${nc}`;
          if (!visited.has(k) && state[nr]?.[nc] === 1) {
            visited.add(k);
            queue.push([nr, nc]);
          }
        }
      }
      if (visited.size !== seaCount) {
        setAnnouncement('Meer muss zusammenhängen.');
        sfx.error();
        return;
      }
    }
    // no 2x2 sea blocks
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        if (
          state[r]?.[c] === 1 &&
          state[r + 1]?.[c] === 1 &&
          state[r]?.[c + 1] === 1 &&
          state[r + 1]?.[c + 1] === 1
        ) {
          setAnnouncement('Keine 2×2-Meer-Blöcke.');
          sfx.error();
          return;
        }
      }
    }
    // check island sizes
    for (const [key, sz] of puzzle.clues) {
      const parts = key.split(',').map(Number);
      const cr = parts[0] ?? 0;
      const cc = parts[1] ?? 0;
      if (state[cr]?.[cc] === 1) {
        setAnnouncement('Zahlenfelder dürfen kein Meer sein.');
        sfx.error();
        return;
      }
      const island = new Set<string>();
      island.add(key);
      const queue: [number, number][] = [[cr, cc]];
      while (queue.length) {
        const head = queue.shift();
        if (!head) break;
        const [r, c] = head;
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          const k = `${nr},${nc}`;
          if (!island.has(k) && state[nr]?.[nc] === 0 && !puzzle.clues.has(k)) {
            island.add(k);
            queue.push([nr, nc]);
          }
        }
      }
      if (island.size !== sz) {
        setAnnouncement(`Insel bei ${key}: Größe ${island.size}, erwartet ${sz}.`);
        sfx.error();
        return;
      }
    }
    setAnnouncement('Gelöst! Alle Regeln erfüllt.');
    sfx.win();
    vibrate([60, 40, 120]);
  }, [puzzle, state, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as NurikabeSize;
              setSize(next);
              restart(next);
            }}
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n}×{n}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={() => restart(size)}>
          Neues Rätsel
        </Button>
        <Button variant="ghost" size="sm" onClick={check}>
          Prüfen
        </Button>
      </div>

      <div
        className="grid gap-1 rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
        role="group"
        aria-label="Nurikabe-Spielfeld"
        style={{ gridTemplateColumns: `repeat(${puzzle.n}, 44px)` }}
      >
        {Array.from({ length: puzzle.n }).flatMap((_, r) =>
          Array.from({ length: puzzle.n }).map((__, c) => {
            const key = `${r},${c}`;
            const clue = puzzle.clues.get(key);
            const isSea = state[r]?.[c] === 1;
            if (clue !== undefined) {
              return (
                <div
                  key={key}
                  role="img"
                  aria-label={`Insel-Hinweis ${clue} bei ${r + 1},${c + 1}`}
                  className="flex aspect-square items-center justify-center rounded-md bg-amber-300 text-base font-bold text-slate-900"
                >
                  {clue}
                </div>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCell(r, c)}
                aria-label={`Feld ${r + 1},${c + 1}: ${isSea ? 'Meer' : 'leer'}`}
                aria-pressed={isSea}
                className={`flex aspect-square items-center justify-center rounded-md text-base font-bold ${
                  isSea
                    ? 'bg-sky-700 text-sky-100'
                    : 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100'
                }`}
              >
                {isSea ? '~' : ''}
              </button>
            );
          }),
        )}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Klicke leere Felder, um sie zu Meer zu machen. Alle Meer-Zellen müssen zusammenhängen, keine
        2×2-Meer-Blöcke. Jede Zahl ist die Größe ihrer weißen Insel.
      </p>
    </div>
  );
}
