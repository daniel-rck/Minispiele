import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { type AnagramTile, scrambleLetters, verifyGuess } from '../lib/anagram';
import { STORAGE_KEYS } from '../lib/constants';
import { pickRandomHangmanWord } from '../lib/hangmanWords';
import { AnagramBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

type Tile = AnagramTile;

export default function AnagramGame() {
  const [word, setWord] = useState<string>(() => pickRandomHangmanWord());
  const [tiles, setTiles] = useState<Tile[]>(() => scrambleLetters(word));
  const [slots, setSlots] = useState<(Tile | null)[]>(() => new Array(word.length).fill(null));
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.ANAGRAM_BEST, AnagramBestSchema, 0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [announce, setAnnounce] = useState('');
  const submittedRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const newRound = useCallback(() => {
    const next = pickRandomHangmanWord();
    setWord(next);
    setTiles(scrambleLetters(next));
    setSlots(new Array(next.length).fill(null));
    setFeedback('none');
    submittedRef.current = false;
  }, []);

  const placeTile = (tileId: number) => {
    if (feedback === 'correct') return;
    setTiles((prev) => {
      const tile = prev.find((t) => t.id === tileId);
      if (!tile || tile.placed) return prev;
      setSlots((cur) => {
        const slotIdx = cur.findIndex((s) => s === null);
        if (slotIdx === -1) return cur;
        const next = cur.slice();
        next[slotIdx] = { ...tile, placed: true };
        return next;
      });
      vibrate(15);
      return prev.map((t) => (t.id === tileId ? { ...t, placed: true } : t));
    });
  };

  const removeSlot = (slotIdx: number) => {
    if (feedback === 'correct') return;
    setSlots((prev) => {
      const tile = prev[slotIdx];
      if (!tile) return prev;
      setTiles((cur) => cur.map((t) => (t.id === tile.id ? { ...t, placed: false } : t)));
      const next = prev.slice();
      next[slotIdx] = null;
      return next;
    });
    vibrate(15);
  };

  const clear = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, placed: false })));
    setSlots(new Array(word.length).fill(null));
    setFeedback('none');
  };

  const submit = useCallback(() => {
    if (slots.some((s) => s === null)) return;
    if (verifyGuess(slots, word)) {
      setFeedback('correct');
      setAnnounce(`Richtig: ${word}`);
      vibrate([40, 30, 60]);
      sfx.match();
      submittedRef.current = true;
      setStreak((s) => {
        const next = s + 1;
        if (next > best) setBest(next);
        return next;
      });
    } else {
      setFeedback('wrong');
      setAnnounce('Falsch — versuche es nochmal');
      vibrate([80, 60, 80]);
      sfx.error();
      setStreak(0);
      window.setTimeout(() => setFeedback('none'), 1000);
    }
  }, [slots, word, best, setBest, vibrate, sfx]);

  useEffect(() => {
    const remaining = slots.some((s) => s === null);
    if (!remaining && feedback === 'none' && !submittedRef.current) submit();
  }, [slots, feedback, submit]);

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Länge: <span className="font-semibold tabular-nums">{word.length}</span>
        </div>
        <div className="text-center">
          Serie: <span className="font-semibold tabular-nums">{streak}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-colors ${
          feedback === 'correct'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
            : feedback === 'wrong'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}
        role="group"
        aria-label="Lösung"
      >
        {slots.map((s, i) =>
          s ? (
            <button
              key={i}
              type="button"
              onClick={() => removeSlot(i)}
              disabled={feedback === 'correct'}
              aria-label={`Lösungsbuchstabe ${s.letter}`}
              className="h-12 w-9 rounded-lg bg-brand-600 text-xl font-bold uppercase text-white"
            >
              {s.letter}
            </button>
          ) : (
            <span
              key={i}
              role="img"
              aria-label="leerer Slot"
              className="inline-block h-12 w-9 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700"
            />
          ),
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Buchstaben"
      >
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => placeTile(t.id)}
            disabled={t.placed || feedback === 'correct'}
            aria-label={t.letter}
            className={`h-12 w-9 rounded-lg border text-xl font-bold uppercase ${
              t.placed
                ? 'invisible'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.letter}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={feedback === 'correct'}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Leeren
        </button>
        <Button variant="primary" className="flex-1" onClick={newRound}>
          {feedback === 'correct' ? 'Nächstes Wort' : 'Überspringen'}
        </Button>
      </div>
    </div>
  );
}
