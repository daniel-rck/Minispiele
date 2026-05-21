import { useCallback, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const COLS = 10;
const ROWS = 6;
const COLORS = [
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-violet-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-stone-500',
];

interface Pentomino {
  name: string;
  cells: [number, number][];
  color: string;
  placed: boolean;
}

const SHAPES: { name: string; cells: [number, number][] }[] = [
  {
    name: 'F',
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: 'I',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  {
    name: 'L',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
    ],
  },
  {
    name: 'N',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  },
  {
    name: 'P',
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
  },
  {
    name: 'T',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: 'U',
    cells: [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    name: 'V',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  {
    name: 'W',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
  },
  {
    name: 'X',
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
    ],
  },
  {
    name: 'Y',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 0],
      [3, 0],
    ],
  },
  {
    name: 'Z',
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
  },
];

function normalize(cells: [number, number][]): [number, number][] {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]);
}

function rotateCells(cells: [number, number][]): [number, number][] {
  return normalize(cells.map(([r, c]) => [c, -r]));
}

function flipCells(cells: [number, number][]): [number, number][] {
  const maxC = Math.max(...cells.map((c) => c[1]));
  return normalize(cells.map(([r, c]) => [r, maxC - c]));
}

function makePieces(): Pentomino[] {
  return SHAPES.map((s, i) => ({
    name: s.name,
    cells: s.cells.map((c) => [...c] as [number, number]),
    color: COLORS[i] ?? 'bg-slate-500',
    placed: false,
  }));
}

export default function PentominoGame() {
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1)),
  );
  const [pieces, setPieces] = useState<Pentomino[]>(() => makePieces());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState(
    'Wähle ein Teil, klicke aufs Brett. Drehe oder spiegle es vorher.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setGrid(Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1)));
    setPieces(makePieces());
    setSelectedIdx(null);
    setAnnouncement('Wähle ein Teil, klicke aufs Brett.');
  }, []);

  const placedCount = pieces.filter((p) => p.placed).length;
  const solved = placedCount === SHAPES.length;

  const handleBoardCell = useCallback(
    (r: number, c: number) => {
      if (solved || selectedIdx === null) return;
      const piece = pieces[selectedIdx];
      if (!piece || piece.placed) return;
      for (const [dr, dc] of piece.cells) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr]?.[nc] !== -1) {
          sfx.error();
          vibrate(40);
          setAnnouncement('Hier passt das Teil nicht.');
          return;
        }
      }
      vibrate(15);
      sfx.match();
      setGrid((g) => {
        const next = g.map((row) => [...row]);
        for (const [dr, dc] of piece.cells) {
          const row = next[r + dr];
          if (row) row[c + dc] = selectedIdx;
        }
        return next;
      });
      setPieces((ps) => ps.map((p, i) => (i === selectedIdx ? { ...p, placed: true } : p)));
      setSelectedIdx(null);
      if (placedCount + 1 === SHAPES.length) {
        setAnnouncement('Gelöst! Alle Teile platziert.');
        sfx.win();
        vibrate([60, 40, 120]);
      }
    },
    [solved, selectedIdx, pieces, grid, placedCount, sfx, vibrate],
  );

  const rotateSelected = useCallback(() => {
    if (selectedIdx === null) return;
    setPieces((ps) =>
      ps.map((p, i) => (i === selectedIdx ? { ...p, cells: rotateCells(p.cells) } : p)),
    );
    vibrate(10);
  }, [selectedIdx, vibrate]);

  const flipSelected = useCallback(() => {
    if (selectedIdx === null) return;
    setPieces((ps) =>
      ps.map((p, i) => (i === selectedIdx ? { ...p, cells: flipCells(p.cells) } : p)),
    );
    vibrate(10);
  }, [selectedIdx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={rotateSelected}
          disabled={selectedIdx === null}
        >
          Drehen
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={flipSelected}
          disabled={selectedIdx === null}
        >
          Spiegeln
        </Button>
        <Button variant="primary" size="sm" onClick={restart}>
          Neustart
        </Button>
      </div>

      <div
        className="grid gap-[1px] rounded-lg bg-slate-900 p-1 dark:bg-slate-950"
        role="group"
        aria-label="Pentomino-Spielbrett"
        style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}
      >
        {grid.flatMap((row, r) =>
          row.map((value, c) => {
            const filled = value >= 0;
            const color = filled ? (COLORS[value] ?? 'bg-slate-500') : 'bg-slate-800';
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleBoardCell(r, c)}
                disabled={filled || solved}
                aria-label={`Brettfeld ${r + 1},${c + 1}`}
                className={`h-7 w-7 ${color}`}
              />
            );
          }),
        )}
      </div>

      <div
        className="flex max-w-md flex-wrap items-start justify-center gap-2"
        role="group"
        aria-label="Pentomino-Teile"
      >
        {pieces.map((p, i) => {
          if (p.placed) return null;
          const maxR = Math.max(...p.cells.map((c) => c[0])) + 1;
          const maxC = Math.max(...p.cells.map((c) => c[1])) + 1;
          const cellSet = new Set(p.cells.map((c) => `${c[0]},${c[1]}`));
          const isSelected = selectedIdx === i;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              aria-label={`Teil ${p.name}`}
              aria-pressed={isSelected}
              className={`grid gap-[1px] rounded p-1 ${isSelected ? 'bg-amber-300 dark:bg-amber-900/40' : 'bg-surface-100 dark:bg-surface-800'}`}
              style={{ gridTemplateColumns: `repeat(${maxC}, 12px)` }}
            >
              {Array.from({ length: maxR }).flatMap((_, r) =>
                Array.from({ length: maxC }).map((__, c) => {
                  const isFilled = cellSet.has(`${r},${c}`);
                  return (
                    <span
                      key={`${r}-${c}`}
                      aria-hidden
                      className={`block h-3 w-3 ${isFilled ? p.color : 'bg-transparent'}`}
                    />
                  );
                }),
              )}
            </button>
          );
        })}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        12 Pentomino-Teile, jedes aus 5 Zellen. Wähle ein Teil, drehe/spiegele es nach Bedarf und
        klicke auf das Brett, um den Ankerpunkt (oben-links) zu setzen.
      </p>
    </div>
  );
}
