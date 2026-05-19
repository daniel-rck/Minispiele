import { useCallback, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { TangramLevelSchema } from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

interface Piece {
  id: number;
  name: string;
  color: string;
  // path in the assembled square (100×100 viewBox)
  d: string;
}

const PIECES: Piece[] = [
  { id: 0, name: 'Großes Dreieck 1', color: '#ef4444', d: 'M 0 0 L 100 0 L 50 50 Z' },
  { id: 1, name: 'Großes Dreieck 2', color: '#3b82f6', d: 'M 0 0 L 0 100 L 50 50 Z' },
  { id: 2, name: 'Mittleres Dreieck', color: '#f59e0b', d: 'M 100 0 L 100 50 L 50 50 Z' },
  { id: 3, name: 'Kleines Dreieck 1', color: '#10b981', d: 'M 50 50 L 100 50 L 75 75 Z' },
  { id: 4, name: 'Kleines Dreieck 2', color: '#a855f7', d: 'M 25 75 L 0 100 L 50 100 Z' },
  { id: 5, name: 'Quadrat', color: '#06b6d4', d: 'M 50 50 L 75 75 L 50 100 L 25 75 Z' },
  { id: 6, name: 'Parallelogramm', color: '#ec4899', d: 'M 75 75 L 100 50 L 100 100 L 50 100 Z' },
];

interface Puzzle {
  name: string;
  silhouette: string; // SVG path describing target shape (rendered in 200x200 area, scaled inside)
}

const PUZZLES: Puzzle[] = [
  {
    name: 'Quadrat',
    silhouette: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
  },
  {
    name: 'Dreieck',
    silhouette: 'M 50 0 L 100 100 L 0 100 Z',
  },
  {
    name: 'Haus',
    silhouette: 'M 0 40 L 50 0 L 100 40 L 100 100 L 0 100 Z',
  },
  {
    name: 'Rakete',
    silhouette: 'M 50 0 L 70 30 L 70 80 L 90 100 L 10 100 L 30 80 L 30 30 Z',
  },
  {
    name: 'Berg',
    silhouette: 'M 0 100 L 30 40 L 50 70 L 80 10 L 100 100 Z',
  },
];

export default function TangramGame() {
  const [levelIdx, setLevelIdx] = useLocalStorage<number>(
    STORAGE_KEYS.TANGRAM_LEVEL,
    TangramLevelSchema,
    0,
  );
  const [showSolution, setShowSolution] = useState(false);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [announce, setAnnounce] = useState('');
  const { vibrate } = useVibration();

  const puzzle = PUZZLES[levelIdx % PUZZLES.length]!;

  const togglePiece = useCallback(
    (id: number) => {
      setPlaced((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      vibrate(15);
    },
    [vibrate],
  );

  const allPlaced = placed.size === PIECES.length;

  const nextPuzzle = useCallback(() => {
    const idx = (levelIdx + 1) % PUZZLES.length;
    setLevelIdx(idx);
    setPlaced(new Set());
    setShowSolution(false);
    setAnnounce(`Nächste Form: ${PUZZLES[idx]!.name}`);
  }, [levelIdx, setLevelIdx]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Form:</span>
          <select
            value={levelIdx}
            onChange={(e) => {
              setLevelIdx(Number(e.target.value));
              setPlaced(new Set());
              setShowSolution(false);
            }}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {PUZZLES.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <svg viewBox="0 0 100 100" className="h-64 w-full">
          <path d={puzzle.silhouette} fill="#0f172a" opacity={showSolution ? 0.15 : 0.9} />
          {showSolution &&
            PIECES.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill={p.color}
                stroke="white"
                strokeWidth="0.4"
                opacity="0.9"
              />
            ))}
        </svg>
        <p className="absolute right-3 top-3 text-xs text-slate-500">{puzzle.name}</p>
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe Teile als &quot;platziert&quot; markieren. Aktiviere &quot;Lösung zeigen&quot; um die
        klassische Quadrat-Aufteilung als Hilfestellung zu sehen.
      </p>

      <div
        className="grid w-full max-w-md grid-cols-7 gap-1.5"
        role="group"
        aria-label="Tangram-Teile"
      >
        {PIECES.map((p) => {
          const isPlaced = placed.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePiece(p.id)}
              aria-pressed={isPlaced}
              aria-label={p.name}
              className={`flex aspect-square items-center justify-center rounded-lg border-2 transition ${
                isPlaced ? 'border-emerald-500 opacity-40' : 'border-transparent'
              }`}
              style={{ backgroundColor: p.color }}
            >
              {isPlaced && <span aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          aria-pressed={showSolution}
          className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-medium ${
            showSolution
              ? 'bg-amber-500 text-white'
              : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          {showSolution ? 'Lösung an' : 'Lösung zeigen'}
        </button>
        <button
          type="button"
          onClick={() => setPlaced(new Set())}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Zurücksetzen
        </button>
        <Button variant="primary" className="flex-1" onClick={nextPuzzle}>
          {allPlaced ? 'Fertig — nächste' : 'Überspringen'}
        </Button>
      </div>
    </div>
  );
}
