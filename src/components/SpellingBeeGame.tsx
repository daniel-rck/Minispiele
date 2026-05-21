import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { SpellingBeeBestSchema } from '../lib/persistedSchemas';
import {
  generatePuzzle,
  SPELLING_BEE_MIN_WORD_LENGTH,
  type SpellingBeePuzzle,
  submitWord,
} from '../lib/spellingBee';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

interface PuzzleProgress {
  found: Set<string>;
  score: number;
}

const EMPTY: PuzzleProgress = { found: new Set(), score: 0 };

export default function SpellingBeeGame() {
  const [puzzle, setPuzzle] = useState<SpellingBeePuzzle>(() => generatePuzzle());
  const [progress, setProgress] = useState<PuzzleProgress>(() => ({ ...EMPTY, found: new Set() }));
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [announce, setAnnounce] = useState('');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.SPELLING_BEE_BEST,
    SpellingBeeBestSchema,
    0,
  );
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  useEffect(() => {
    setMessage(`Bilde Wörter mit dem Buchstaben „${puzzle.center}" in der Mitte.`);
  }, [puzzle.center]);

  const totalWords = puzzle.validWords.length;
  const foundCount = progress.found.size;
  const percent = totalWords > 0 ? Math.round((foundCount / totalWords) * 100) : 0;

  const sortedFound = useMemo(
    () => Array.from(progress.found).sort((a, b) => a.localeCompare(b, 'de')),
    [progress.found],
  );

  const newPuzzle = useCallback(() => {
    const next = generatePuzzle();
    setPuzzle(next);
    setProgress({ found: new Set(), score: 0 });
    setInput('');
    setAnnounce('Neues Rätsel gestartet.');
  }, []);

  const appendLetter = (letter: string) => {
    setInput((prev) => (prev + letter).slice(0, 15));
  };

  const backspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const submit = () => {
    const result = submitWord(input, puzzle, progress.found);
    setInput('');
    switch (result.kind) {
      case 'too-short':
        setMessage(`Mindestens ${SPELLING_BEE_MIN_WORD_LENGTH} Buchstaben.`);
        vibrate(40);
        sfx.error();
        return;
      case 'missing-center':
        setMessage(`Muss „${puzzle.center}" enthalten.`);
        vibrate(40);
        sfx.error();
        return;
      case 'invalid-letters':
        setMessage('Nur die angezeigten Buchstaben.');
        vibrate(40);
        sfx.error();
        return;
      case 'already-found':
        setMessage('Bereits gefunden.');
        return;
      case 'unknown':
        setMessage('Nicht in der Wortliste.');
        vibrate(40);
        sfx.error();
        return;
      case 'accepted': {
        setProgress((prev) => {
          const found = new Set(prev.found);
          found.add(result.word);
          const score = prev.score + result.points;
          if (score > best) setBest(score);
          return { found, score };
        });
        vibrate(result.pangram ? [40, 30, 60, 30, 60] : 25);
        if (result.pangram) sfx.win();
        else sfx.match();
        const text = result.pangram
          ? `Pangram! +${result.points} Punkte für ${result.word}.`
          : `+${result.points} Punkte für ${result.word}.`;
        setMessage(text);
        setAnnounce(text);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <p
        className="min-h-[1.5rem] max-w-md text-center text-sm font-semibold text-amber-600 dark:text-amber-400"
        role="status"
      >
        {message}
      </p>

      <div className="flex flex-col items-center gap-1" aria-label="Buchstaben-Wabe" role="group">
        <HexRow letters={[puzzle.outer[0] ?? '', puzzle.outer[1] ?? '']} onPick={appendLetter} />
        <HexRow
          letters={[puzzle.outer[2] ?? '', puzzle.center, puzzle.outer[3] ?? '']}
          centerIndex={1}
          onPick={appendLetter}
        />
        <HexRow letters={[puzzle.outer[4] ?? '', puzzle.outer[5] ?? '']} onPick={appendLetter} />
      </div>

      <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 15))}
          onKeyDown={handleKeyDown}
          aria-label="Wort eingeben"
          placeholder="Wort eingeben"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-12 flex-1 rounded-2xl border-2 border-slate-300 bg-white px-4 text-center text-lg font-bold uppercase tracking-widest text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
        />
        <Button variant="secondary" onClick={backspace} aria-label="Letzten Buchstaben entfernen">
          ⌫
        </Button>
        <Button variant="primary" onClick={submit}>
          OK
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Anteil gefundener Wörter"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
          <span>
            Punkte: <span className="font-semibold tabular-nums">{progress.score}</span>
          </span>
          <span>
            Gefunden:{' '}
            <span className="font-semibold tabular-nums">
              {foundCount}/{totalWords}
            </span>
          </span>
          <span>
            Best: <span className="font-semibold tabular-nums">{best}</span>
          </span>
        </div>
      </div>

      {sortedFound.length > 0 && (
        <div
          className="flex max-h-40 w-full max-w-md flex-wrap justify-center gap-1 overflow-y-auto"
          role="list"
          aria-label="Gefundene Wörter"
        >
          {sortedFound.map((w) => (
            <span
              key={w}
              role="listitem"
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      <Button variant="secondary" block className="max-w-md" onClick={newPuzzle}>
        Neues Rätsel
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Mindestens {SPELLING_BEE_MIN_WORD_LENGTH} Buchstaben pro Wort, der mittlere muss enthalten
        sein. Alle sieben Buchstaben gleichzeitig nutzen = Pangram.
      </p>
    </div>
  );
}

interface HexRowProps {
  letters: string[];
  centerIndex?: number;
  onPick: (letter: string) => void;
}

function HexRow({ letters, centerIndex, onPick }: HexRowProps) {
  return (
    <div className="flex gap-1.5">
      {letters.map((l, i) => {
        const isCenter = i === centerIndex;
        return (
          <button
            key={`${i}-${l}`}
            type="button"
            onClick={() => onPick(l)}
            aria-label={`Buchstabe ${l}${isCenter ? ' (Mitte)' : ''}`}
            className={`flex h-14 w-14 items-center justify-center text-xl font-extrabold transition-transform active:scale-95 ${
              isCenter
                ? 'bg-amber-400 text-slate-900 dark:bg-amber-400 dark:text-slate-900'
                : 'bg-slate-200 text-slate-800 hover:bg-amber-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
            }`}
            style={{ clipPath: HEX_CLIP }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
