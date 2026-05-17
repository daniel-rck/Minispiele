import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generate, lineBetween, matchWord, type WordsearchPuzzle } from '../lib/wordsearch';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { WordsearchBestSchema } from '../lib/persistedSchemas';
import { formatDuration, useGameTimer } from '../lib/useGameTimer';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import Sheet from './ui/Sheet';
import AriaLive from './AriaLive';

const SIZE = 10;
const WORD_COUNT = 8;

export default function WordsearchGame() {
  const [puzzle, setPuzzle] = useState<WordsearchPuzzle>(() => generate(SIZE, WORD_COUNT));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.WORDSEARCH_BEST,
    WordsearchBestSchema,
    null,
  );
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timer = useGameTimer();
  const startedRef = useRef(false);
  const wonRef = useRef(false);
  const { vibrate } = useVibration();
  useWakeLock(timer.status === 'running');

  useEffect(() => {
    if (timer.status === 'idle' && !startedRef.current) {
      timer.start();
      startedRef.current = true;
    }
  }, [timer]);

  const allFound = found.size === puzzle.words.length;

  useEffect(() => {
    if (allFound && !wonRef.current) {
      wonRef.current = true;
      timer.stop();
      const sec = timer.elapsedSeconds;
      if (best === null || sec < best) {
        setBest(sec);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Alle Wörter gefunden in ${formatDuration(sec)}`);
      vibrate([40, 30, 60]);
    }
  }, [allFound, timer, best, setBest, vibrate]);

  const restart = useCallback(() => {
    setPuzzle(generate(SIZE, WORD_COUNT));
    setFound(new Set());
    setStart(null);
    setEnd(null);
    setWinOpen(false);
    setScoreIsNew(false);
    startedRef.current = false;
    wonRef.current = false;
    timer.reset();
    timer.start();
    startedRef.current = true;
  }, [timer]);

  const candidate = useMemo(() => {
    if (start === null || end === null) return null;
    return lineBetween(start, end, puzzle.size);
  }, [start, end, puzzle.size]);

  const handlePointerDown = (idx: number) => {
    setStart(idx);
    setEnd(idx);
  };

  const handlePointerEnter = (idx: number) => {
    if (start !== null) setEnd(idx);
  };

  const handlePointerUp = () => {
    if (start !== null && end !== null) {
      const cells = lineBetween(start, end, puzzle.size);
      if (cells) {
        const w = matchWord(puzzle, cells);
        if (w && !found.has(w.word)) {
          const next = new Set(found);
          next.add(w.word);
          setFound(next);
          vibrate(25);
        }
      }
    }
    setStart(null);
    setEnd(null);
  };

  const candidateSet = new Set(candidate ?? []);
  const foundCells = new Set<number>();
  for (const w of puzzle.words) {
    if (found.has(w.word)) for (const c of w.cells) foundCells.add(c);
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Gefunden:{' '}
          <span className="font-semibold tabular-nums">
            {found.size} / {puzzle.words.length}
          </span>
        </div>
        <div className="text-center">
          Zeit:{' '}
          <span className="font-semibold tabular-nums">{formatDuration(timer.elapsedSeconds)}</span>
        </div>
        <div className="text-right">
          {best !== null ? (
            <>
              Best: <span className="font-semibold tabular-nums">{formatDuration(best)}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div
        className="grid w-full max-w-md select-none gap-px rounded-lg bg-slate-300 p-1 touch-none dark:bg-slate-700"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="grid"
        aria-label="Wortgitter"
      >
        {puzzle.grid.map((ch, idx) => {
          const isFound = foundCells.has(idx);
          const isCandidate = candidateSet.has(idx);
          return (
            <button
              key={idx}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(idx);
              }}
              onPointerEnter={() => handlePointerEnter(idx)}
              aria-label={ch}
              className={`flex aspect-square min-w-[22px] items-center justify-center text-sm font-bold sm:text-base ${
                isFound
                  ? 'bg-emerald-300 text-emerald-900 dark:bg-emerald-700 dark:text-emerald-100'
                  : isCandidate
                    ? 'bg-brand-200 dark:bg-brand-900/60'
                    : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-1 sm:grid-cols-3">
        {puzzle.words.map((w) => (
          <span
            key={w.word}
            className={`rounded-lg px-2 py-1 text-center text-sm font-medium ${
              found.has(w.word)
                ? 'bg-emerald-100 text-emerald-700 line-through dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {w.word}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={restart}
        className="min-h-12 w-full max-w-md rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Neues Gitter
      </button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Halte gedrückt und ziehe vom ersten zum letzten Buchstaben. Wörter verlaufen waagerecht,
        senkrecht oder diagonal — vorwärts wie rückwärts.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Alle gefunden!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🔎
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestzeit!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Alle {puzzle.words.length} Wörter in {formatDuration(timer.elapsedSeconds)} gefunden.
          </p>
          <button
            type="button"
            onClick={restart}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Neues Gitter
          </button>
        </div>
      </Sheet>
    </div>
  );
}
