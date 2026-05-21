import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { CROSSWORD_PUZZLES, type CrosswordPuzzle } from '../lib/crosswordPuzzles';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

interface CellInfo {
  solution: string;
  letter: string;
  wrong: boolean;
}

type Grid = (CellInfo | null)[][];

function buildGrid(puzzle: CrosswordPuzzle): Grid {
  const grid: Grid = Array.from({ length: puzzle.size }, () =>
    Array<CellInfo | null>(puzzle.size).fill(null),
  );
  for (const w of puzzle.words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'v' ? w.row + i : w.row;
      const c = w.dir === 'h' ? w.col + i : w.col;
      const row = grid[r];
      if (!row) continue;
      if (!row[c]) row[c] = { solution: w.word[i] ?? '', letter: '', wrong: false };
      else row[c]!.solution = w.word[i] ?? '';
    }
  }
  return grid;
}

function assignNumbers(puzzle: CrosswordPuzzle): Map<string, number> {
  const numbered = new Map<string, number>();
  let n = 0;
  for (const w of puzzle.words) {
    const key = `${w.row},${w.col}`;
    if (!numbered.has(key)) {
      n++;
      numbered.set(key, n);
    }
  }
  return numbered;
}

export default function CrosswordGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = CROSSWORD_PUZZLES[puzzleIdx] ?? CROSSWORD_PUZZLES[0];
  if (!puzzle) throw new Error('No crossword puzzles');
  const [grid, setGrid] = useState<Grid>(() => buildGrid(puzzle));
  const [announcement, setAnnouncement] = useState('Klicke ein Feld und tippe einen Buchstaben.');
  const numbers = useMemo(() => assignNumbers(puzzle), [puzzle]);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    const next = Math.floor(Math.random() * CROSSWORD_PUZZLES.length);
    setPuzzleIdx(next);
    const np = CROSSWORD_PUZZLES[next];
    if (np) setGrid(buildGrid(np));
    setAnnouncement('Neues Rätsel.');
  }, []);

  useEffect(() => {
    setGrid(buildGrid(puzzle));
  }, [puzzle]);

  const setCell = useCallback(
    (r: number, c: number, value: string) => {
      vibrate(10);
      setGrid((g) => {
        const next = g.map((row) => row.slice()) as Grid;
        const cell = next[r]?.[c];
        if (!cell) return g;
        next[r]![c] = { ...cell, letter: value.toUpperCase().slice(0, 1), wrong: false };
        return next;
      });
    },
    [vibrate],
  );

  const check = useCallback(() => {
    let allCorrect = true;
    let allFilled = true;
    setGrid((g) => {
      const next = g.map((row) => row.slice()) as Grid;
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          const cell = next[r]?.[c];
          if (!cell) continue;
          if (cell.letter === '') {
            allFilled = false;
            allCorrect = false;
            next[r]![c] = { ...cell, wrong: false };
            continue;
          }
          const wrong = cell.letter !== cell.solution;
          if (wrong) allCorrect = false;
          next[r]![c] = { ...cell, wrong };
        }
      }
      return next;
    });
    if (allCorrect && allFilled) {
      setAnnouncement('Gelöst! Perfekt.');
      sfx.win();
      vibrate([60, 40, 120]);
    } else if (!allFilled) {
      setAnnouncement('Es fehlen noch Buchstaben.');
      sfx.error();
    } else {
      setAnnouncement('Manche Buchstaben sind falsch.');
      sfx.error();
      vibrate(40);
    }
  }, [puzzle.size, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={check}>
          Prüfen
        </Button>
        <Button variant="secondary" size="sm" onClick={restart}>
          Neues Rätsel
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <div
          className="grid gap-[1px] bg-slate-700"
          role="group"
          aria-label="Kreuzworträtsel-Gitter"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, 36px)` }}
        >
          {Array.from({ length: puzzle.size }).flatMap((_, r) =>
            Array.from({ length: puzzle.size }).map((__, c) => {
              const cell = grid[r]?.[c] ?? null;
              const num = numbers.get(`${r},${c}`);
              if (!cell) {
                return <div key={`${r}-${c}`} aria-hidden className="h-9 w-9 bg-slate-950" />;
              }
              return (
                <label
                  key={`${r}-${c}`}
                  className={`relative block h-9 w-9 ${
                    cell.wrong
                      ? 'bg-rose-200 dark:bg-rose-900/60'
                      : 'bg-surface-100 dark:bg-surface-700'
                  }`}
                >
                  {num !== undefined && (
                    <span
                      aria-hidden
                      className="absolute left-0.5 top-0 text-[8px] leading-none text-surface-400"
                    >
                      {num}
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={cell.letter}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    aria-label={`Feld ${r + 1},${c + 1}`}
                    className={`h-full w-full bg-transparent text-center text-base font-bold uppercase ${
                      cell.wrong
                        ? 'text-rose-700 dark:text-rose-200'
                        : 'text-surface-900 dark:text-surface-100'
                    }`}
                  />
                </label>
              );
            }),
          )}
        </div>

        <div className="max-w-xs space-y-3 text-sm">
          <div>
            <h3 className="mb-1 font-bold text-surface-900 dark:text-surface-100">Waagerecht</h3>
            {puzzle.words
              .filter((w) => w.dir === 'h')
              .map((w) => (
                <p key={`h-${w.row}-${w.col}`} className="text-surface-700 dark:text-surface-200">
                  <span className="font-semibold">{numbers.get(`${w.row},${w.col}`)}.</span>{' '}
                  {w.clue}
                </p>
              ))}
          </div>
          <div>
            <h3 className="mb-1 font-bold text-surface-900 dark:text-surface-100">Senkrecht</h3>
            {puzzle.words
              .filter((w) => w.dir === 'v')
              .map((w) => (
                <p key={`v-${w.row}-${w.col}`} className="text-surface-700 dark:text-surface-200">
                  <span className="font-semibold">{numbers.get(`${w.row},${w.col}`)}.</span>{' '}
                  {w.clue}
                </p>
              ))}
          </div>
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tippe in jedes weiße Feld einen Buchstaben. „Prüfen" markiert falsche Buchstaben rot.
      </p>
    </div>
  );
}
