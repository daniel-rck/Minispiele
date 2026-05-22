import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type HitoriSize, HitoriSizeSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SIZES: readonly HitoriSize[] = [5, 6, 7];
type CellState = 0 | 1 | 2; // 0 white, 1 black, 2 circled

interface Puzzle {
  n: number;
  numbers: number[][];
  state: CellState[][];
}

function shuffleArr<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
}

function generate(n: number): Puzzle {
  const numbers: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let r = 0; r < n; r++) {
    const row = numbers[r];
    if (!row) continue;
    for (let c = 0; c < n; c++) row[c] = ((r + c) % n) + 1;
  }
  for (let i = 0; i < n * 3; i++) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (Math.random() < 0.5) {
      const ra = numbers[a];
      const rb = numbers[b];
      if (ra && rb) {
        numbers[a] = rb;
        numbers[b] = ra;
      }
    } else {
      for (let r = 0; r < n; r++) {
        const row = numbers[r];
        if (!row) continue;
        const va = row[a];
        const vb = row[b];
        if (va !== undefined && vb !== undefined) {
          row[a] = vb;
          row[b] = va;
        }
      }
    }
  }
  const cells: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  shuffleArr(cells);
  const toChange = Math.floor(n * n * 0.25);
  for (let i = 0; i < toChange && i < cells.length; i++) {
    const pair = cells[i];
    if (!pair) continue;
    const [r, c] = pair;
    const row = numbers[r];
    if (!row) continue;
    const existing = new Set<number>();
    for (let j = 0; j < n; j++) {
      if (j !== c) existing.add(numbers[r]?.[j] ?? 0);
      if (j !== r) existing.add(numbers[j]?.[c] ?? 0);
    }
    const pick = [...existing].filter((v) => v > 0);
    const picked = pick[Math.floor(Math.random() * pick.length)];
    if (picked !== undefined) row[c] = picked;
  }
  const state: CellState[][] = Array.from({ length: n }, () => Array<CellState>(n).fill(0));
  return { n, numbers, state };
}

function check(puzzle: Puzzle): { ok: boolean; reason: string } {
  const { n, numbers, state } = puzzle;
  for (let r = 0; r < n; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < n; c++) {
      if (state[r]?.[c] === 1) continue;
      const v = numbers[r]?.[c] ?? 0;
      if (seen.has(v)) return { ok: false, reason: 'Duplikat in einer Zeile.' };
      seen.add(v);
    }
  }
  for (let c = 0; c < n; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < n; r++) {
      if (state[r]?.[c] === 1) continue;
      const v = numbers[r]?.[c] ?? 0;
      if (seen.has(v)) return { ok: false, reason: 'Duplikat in einer Spalte.' };
      seen.add(v);
    }
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (state[r]?.[c] !== 1) continue;
      if (r > 0 && state[r - 1]?.[c] === 1)
        return { ok: false, reason: 'Schwarze Zellen benachbart.' };
      if (c > 0 && state[r]?.[c - 1] === 1)
        return { ok: false, reason: 'Schwarze Zellen benachbart.' };
    }
  }
  const visited: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  let start: [number, number] | null = null;
  for (let r = 0; r < n && !start; r++) {
    for (let c = 0; c < n; c++) {
      if (state[r]?.[c] !== 1) {
        start = [r, c];
        break;
      }
    }
  }
  if (!start) return { ok: false, reason: 'Keine weißen Zellen übrig.' };
  const queue: [number, number][] = [start];
  const visited2 = visited[start[0]];
  if (visited2) visited2[start[1]] = true;
  let count = 1;
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
      if (visited[nr]?.[nc] || state[nr]?.[nc] === 1) continue;
      const vrow = visited[nr];
      if (vrow) vrow[nc] = true;
      count++;
      queue.push([nr, nc]);
    }
  }
  let totalWhite = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (state[r]?.[c] !== 1) totalWhite++;
  if (count !== totalWhite) return { ok: false, reason: 'Weiße Zellen nicht zusammenhängend.' };
  return { ok: true, reason: 'Gelöst! Perfekt.' };
}

export default function HitoriGame() {
  const [size, setSize] = useLocalStorage<HitoriSize>(
    STORAGE_KEYS.HITORI_SIZE,
    HitoriSizeSchema,
    5,
  );
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(size));
  const [announcement, setAnnouncement] = useState(
    'Schwärze Zellen: Klick = schwärzen, Lang-Klick = markieren.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((n: HitoriSize) => {
    setPuzzle(generate(n));
    setAnnouncement(`Neues ${n}×${n}-Rätsel.`);
  }, []);

  useEffect(() => {
    setPuzzle((prev) => (prev.n === size ? prev : generate(size)));
  }, [size]);

  const toggleBlack = useCallback(
    (r: number, c: number) => {
      vibrate(15);
      setPuzzle((p) => {
        const next = p.state.map((row) => [...row]) as CellState[][];
        const row = next[r];
        if (!row) return p;
        row[c] = row[c] === 1 ? 0 : 1;
        return { ...p, state: next };
      });
    },
    [vibrate],
  );

  const toggleMark = useCallback((r: number, c: number) => {
    setPuzzle((p) => {
      const next = p.state.map((row) => [...row]) as CellState[][];
      const row = next[r];
      if (!row) return p;
      row[c] = row[c] === 2 ? 0 : 2;
      return { ...p, state: next };
    });
  }, []);

  const verify = useCallback(() => {
    const result = check(puzzle);
    setAnnouncement(result.reason);
    if (result.ok) {
      sfx.win();
      vibrate([60, 40, 120]);
    } else {
      sfx.error();
      vibrate(40);
    }
  }, [puzzle, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Größe:
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value) as HitoriSize;
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
        <Button variant="ghost" size="sm" onClick={verify}>
          Prüfen
        </Button>
      </div>

      <div
        className="grid gap-1 rounded-2xl bg-surface-200 p-2 dark:bg-surface-800"
        role="group"
        aria-label="Hitori-Spielfeld"
        style={{ gridTemplateColumns: `repeat(${puzzle.n}, 46px)` }}
      >
        {puzzle.numbers.flatMap((row, r) =>
          row.map((value, c) => {
            const st = puzzle.state[r]?.[c] ?? 0;
            const base =
              st === 1
                ? 'bg-slate-900 text-slate-700 dark:bg-slate-950'
                : st === 2
                  ? 'bg-amber-100 text-surface-900 ring-2 ring-amber-400 dark:bg-amber-900/40 dark:text-amber-100'
                  : 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100';
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => toggleBlack(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleMark(r, c);
                }}
                aria-label={`Feld ${r + 1},${c + 1} Wert ${value} ${
                  st === 1 ? 'geschwärzt' : st === 2 ? 'markiert' : 'weiß'
                }`}
                className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-md text-lg font-bold ${base}`}
              >
                {value}
              </button>
            );
          }),
        )}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Klick = schwärzen, Rechtsklick = markieren. Keine Duplikate pro Zeile/Spalte unter weißen
        Zellen. Schwarze nicht benachbart, weiße zusammenhängend.
      </p>
    </div>
  );
}
