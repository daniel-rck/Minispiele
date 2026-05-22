import { useCallback, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { isHintCell, isWhiteCell, KAKURO_PUZZLES } from '../lib/kakuroPuzzles';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const DIFFICULTY_LABELS = ['Leicht', 'Mittel', 'Schwer'] as const;

export default function KakuroGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = KAKURO_PUZZLES[puzzleIdx] ?? KAKURO_PUZZLES[0];
  if (!puzzle) throw new Error('No Kakuro puzzles available');
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: puzzle.size }, () => Array<number>(puzzle.size).fill(0)),
  );
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [solved, setSolved] = useState(false);
  const [announcement, setAnnouncement] = useState(
    'Tippe ein weißes Feld und gib eine Zahl 1-9 ein.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback((idx: number) => {
    const p = KAKURO_PUZZLES[idx];
    if (!p) return;
    setPuzzleIdx(idx);
    setSolved(false);
    setSelected(null);
    setGrid(Array.from({ length: p.size }, () => Array<number>(p.size).fill(0)));
    setAnnouncement(`${DIFFICULTY_LABELS[idx] ?? 'Rätsel'} geladen.`);
  }, []);

  const enterNumber = useCallback(
    (n: number) => {
      if (!selected || solved) return;
      const { r, c } = selected;
      vibrate(15);
      setGrid((g) => {
        const next = g.map((row) => [...row]);
        const row = next[r];
        if (row) row[c] = n;
        return next;
      });
    },
    [selected, solved, vibrate],
  );

  const check = useCallback(() => {
    let allCorrect = true;
    let allFilled = true;
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const cell = puzzle.grid[r]?.[c];
        if (!isWhiteCell(cell ?? 'B')) continue;
        const v = grid[r]?.[c] ?? 0;
        if (v === 0) {
          allFilled = false;
          allCorrect = false;
        } else if (v !== puzzle.solution[r]?.[c]) {
          allCorrect = false;
        }
      }
    }
    if (allCorrect && allFilled) {
      setSolved(true);
      setAnnouncement('Gelöst! Perfekt.');
      sfx.win();
      vibrate([60, 40, 120]);
    } else if (!allFilled) {
      setAnnouncement('Noch nicht alle Felder ausgefüllt.');
      sfx.error();
      vibrate(40);
    } else {
      setAnnouncement('Einige Zahlen sind falsch.');
      sfx.error();
      vibrate(40);
    }
  }, [puzzle, grid, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        {DIFFICULTY_LABELS.map((label, i) => (
          <Button
            key={label}
            variant={i === puzzleIdx ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => restart(i)}
          >
            {label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={check}>
          Prüfen
        </Button>
      </div>

      <div
        className="grid gap-[2px] rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
        role="group"
        aria-label="Kakuro-Spielfeld"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, 44px)` }}
      >
        {puzzle.grid.flatMap((row, r) =>
          row.map((cell, c) => {
            const isSelected = selected?.r === r && selected?.c === c;
            if (cell === 'B') {
              return (
                <div
                  key={`${r}-${c}`}
                  aria-hidden
                  className="flex aspect-square items-center justify-center bg-slate-950"
                />
              );
            }
            if (isHintCell(cell)) {
              return (
                <div
                  key={`${r}-${c}`}
                  aria-label={`Hinweis ${cell.d ? `runter ${cell.d}` : ''} ${cell.r ? `rechts ${cell.r}` : ''}`.trim()}
                  className="relative flex aspect-square flex-col items-stretch justify-between bg-slate-800 text-[10px] font-bold text-amber-300"
                >
                  <span className="absolute right-1 top-0 leading-none">{cell.r ?? ''}</span>
                  <span className="absolute bottom-0 left-1 leading-none">{cell.d ?? ''}</span>
                  {cell.d && cell.r && (
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom right, transparent 49%, #475569 49%, #475569 51%, transparent 51%)',
                      }}
                    />
                  )}
                </div>
              );
            }
            const value = grid[r]?.[c] ?? 0;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSelected({ r, c })}
                aria-label={`Feld ${r + 1},${c + 1}${value ? ` Wert ${value}` : ''}`}
                className={`flex aspect-square items-center justify-center rounded text-base font-bold ${
                  isSelected
                    ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-400 dark:bg-amber-900/50 dark:text-amber-100'
                    : 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100'
                }`}
              >
                {value || ''}
              </button>
            );
          }),
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => enterNumber(i + 1)}
            disabled={!selected || solved}
            aria-label={`Zahl ${i + 1}`}
            className="min-h-12 min-w-12 rounded-xl bg-surface-100 px-3 text-lg font-bold disabled:opacity-50 dark:bg-surface-800"
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => enterNumber(0)}
          disabled={!selected || solved}
          aria-label="Zelle leeren"
          className="min-h-12 min-w-12 rounded-xl bg-surface-100 px-3 text-lg font-bold disabled:opacity-50 dark:bg-surface-800"
        >
          ×
        </button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Kakuro: weiße Felder mit 1-9 füllen. Jede Summengruppe (Hinweispfeil) gibt die Summe der
        Zellen rechts oder unten. Pro Gruppe kommt jede Zahl nur einmal vor.
      </p>
    </div>
  );
}
