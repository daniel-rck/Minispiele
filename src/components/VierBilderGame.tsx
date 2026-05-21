import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { VierBilderBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import { VIER_BILDER_PUZZLES } from '../lib/vierBilderPuzzles';
import AriaLive from './AriaLive';
import Button from './ui/Button';

interface Slot {
  letter: string;
  srcIdx: number;
}

function makeLetters(word: string): string[] {
  const letters = word.split('');
  const extras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const pool = [...letters];
  while (pool.length < 12) {
    pool.push(extras[Math.floor(Math.random() * extras.length)] ?? 'A');
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = pool[i];
    const b = pool[j];
    if (a && b) {
      pool[i] = b;
      pool[j] = a;
    }
  }
  return pool;
}

export default function VierBilderGame() {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<(Slot | null)[]>([]);
  const [used, setUsed] = useState<Set<number>>(() => new Set());
  const [letters, setLetters] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [announcement, setAnnouncement] = useState('Welches Wort passt zu den 4 Bildern?');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.VIER_BILDER_BEST,
    VierBilderBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const puzzle = VIER_BILDER_PUZZLES[idx] ?? VIER_BILDER_PUZZLES[0];
  if (!puzzle) throw new Error('No puzzles');

  const loadPuzzle = useCallback((puzzleIdx: number) => {
    const p = VIER_BILDER_PUZZLES[puzzleIdx];
    if (!p) return;
    setAnswer(Array(p.word.length).fill(null));
    setUsed(new Set());
    setLetters(makeLetters(p.word));
    setHintsUsed(0);
    setAnnouncement('Welches Wort passt zu den 4 Bildern?');
  }, []);

  useEffect(() => {
    loadPuzzle(idx);
  }, [idx, loadPuzzle]);

  const pickLetter = useCallback(
    (i: number) => {
      if (used.has(i)) return;
      vibrate(10);
      setAnswer((a) => {
        const next = [...a];
        const pos = next.findIndex((v) => !v);
        if (pos === -1 || pos >= puzzle.word.length) return a;
        next[pos] = { letter: letters[i] ?? '', srcIdx: i };
        return next;
      });
      setUsed((s) => {
        const next = new Set(s);
        next.add(i);
        return next;
      });
    },
    [used, letters, puzzle.word.length, vibrate],
  );

  const removeLetter = useCallback((pos: number) => {
    setAnswer((a) => {
      const slot = a[pos];
      if (!slot) return a;
      const next = [...a];
      next[pos] = null;
      setUsed((s) => {
        const ns = new Set(s);
        ns.delete(slot.srcIdx);
        return ns;
      });
      return next;
    });
  }, []);

  const clearAnswer = useCallback(() => {
    setAnswer(Array(puzzle.word.length).fill(null));
    setUsed(new Set());
  }, [puzzle.word.length]);

  const useHint = useCallback(() => {
    setHintsUsed((h) => h + 1);
    setAnswer((a) => {
      const next = [...a];
      for (let i = 0; i < puzzle.word.length; i++) {
        const slot = next[i];
        const needed = puzzle.word[i];
        if (!slot || slot.letter !== needed) {
          if (slot) {
            setUsed((s) => {
              const ns = new Set(s);
              ns.delete(slot.srcIdx);
              return ns;
            });
          }
          const srcIdx = letters.findIndex((l, j) => l === needed && !used.has(j));
          if (srcIdx >= 0) {
            next[i] = { letter: needed ?? '', srcIdx };
            setUsed((s) => {
              const ns = new Set(s);
              ns.add(srcIdx);
              return ns;
            });
          }
          break;
        }
      }
      return next;
    });
  }, [puzzle.word, letters, used]);

  const guess = answer.map((a) => a?.letter ?? '').join('');
  const isComplete = guess.length === puzzle.word.length && !answer.includes(null);
  const isCorrect = isComplete && guess === puzzle.word;

  useEffect(() => {
    if (isCorrect) {
      const pts = Math.max(10, 50 - hintsUsed * 15);
      sfx.win();
      vibrate([60, 40, 120]);
      setAnnouncement(`Richtig! +${pts} Punkte.`);
      setScore((s) => {
        const next = s + pts;
        if (next > best) setBest(next);
        return next;
      });
      const id = window.setTimeout(() => {
        if (idx + 1 >= VIER_BILDER_PUZZLES.length) {
          setAnnouncement(`Alle gelöst! Gesamt: ${score + pts} Punkte.`);
        } else {
          setIdx((i) => i + 1);
        }
      }, 1200);
      return () => window.clearTimeout(id);
    } else if (isComplete) {
      sfx.error();
      vibrate(40);
      setAnnouncement('Nicht ganz richtig.');
    }
  }, [isCorrect, isComplete, hintsUsed, idx, score, best, setBest, sfx, vibrate]);

  const restart = useCallback(() => {
    setIdx(0);
    setScore(0);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Rätsel: <span className="font-semibold tabular-nums">{idx + 1}</span>/
          {VIER_BILDER_PUZZLES.length}
        </div>
        <div className="text-center">
          Punkte: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="grid w-full max-w-sm grid-cols-2 gap-2"
        role="group"
        aria-label="Bildhinweise"
      >
        {puzzle.emojis.map((emoji, i) => (
          <div
            key={i}
            role="img"
            aria-label={`Bild ${i + 1}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-surface-100 text-5xl dark:bg-surface-800"
          >
            <span aria-hidden>{emoji}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1" role="group" aria-label="Antwort">
        {Array.from({ length: puzzle.word.length }).map((_, i) => {
          const slot = answer[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => removeLetter(i)}
              disabled={!slot}
              aria-label={`Buchstabe ${i + 1}${slot ? `: ${slot.letter}` : ''}`}
              className={`flex h-10 w-8 items-center justify-center rounded text-lg font-bold ${
                slot
                  ? 'bg-amber-300 text-slate-900 dark:bg-amber-500 dark:text-slate-950'
                  : 'border-2 border-surface-400 bg-transparent'
              }`}
            >
              {slot?.letter ?? ''}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label="Verfügbare Buchstaben"
      >
        {letters.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pickLetter(i)}
            disabled={used.has(i)}
            aria-label={`Buchstabe ${l}`}
            className={`h-10 w-10 rounded text-lg font-bold disabled:opacity-30 ${
              used.has(i)
                ? 'bg-surface-200 text-surface-500 dark:bg-surface-900 dark:text-surface-700'
                : 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={useHint}>
          Hinweis (-15)
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAnswer}>
          Leeren
        </Button>
        <Button variant="primary" size="sm" onClick={restart}>
          Von vorne
        </Button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        4 Emojis, 1 Wort. Klicke Buchstaben in der richtigen Reihenfolge. Hinweise reduzieren die
        Punkte (50 → min. 10).
      </p>
    </div>
  );
}
