import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { TypingTestBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const WORDS_DE = [
  'der',
  'die',
  'und',
  'in',
  'den',
  'von',
  'zu',
  'das',
  'mit',
  'sich',
  'des',
  'auf',
  'für',
  'ist',
  'im',
  'dem',
  'nicht',
  'ein',
  'eine',
  'als',
  'auch',
  'es',
  'an',
  'werden',
  'aus',
  'er',
  'hat',
  'dass',
  'sie',
  'nach',
  'wird',
  'bei',
  'einer',
  'um',
  'am',
  'sind',
  'noch',
  'wie',
  'einem',
  'über',
  'so',
  'zum',
  'kann',
  'wurde',
  'haben',
  'nur',
  'oder',
  'aber',
  'vor',
  'zur',
  'bis',
  'mehr',
  'durch',
  'man',
  'seine',
  'seit',
  'her',
  'wenn',
  'dann',
  'unter',
  'wir',
  'diese',
  'alle',
  'zwischen',
  'schon',
  'immer',
  'wieder',
  'neue',
  'anderen',
  'dieser',
  'Zeit',
  'Leben',
  'Arbeit',
  'Jahr',
  'Welt',
  'Haus',
  'Stadt',
  'Frau',
  'Mann',
  'Kind',
  'Geld',
  'Hand',
  'Teil',
  'Platz',
  'Stelle',
  'Seite',
  'Bild',
  'Wasser',
  'Kopf',
  'Auge',
  'Wort',
  'Weg',
  'Ende',
  'Stunde',
  'Monat',
  'Abend',
  'Nacht',
  'Morgen',
  'Anfang',
  'Frage',
  'Antwort',
  'gut',
  'schlecht',
  'neu',
  'alt',
  'jung',
  'schnell',
  'langsam',
  'hoch',
  'tief',
  'breit',
  'schmal',
  'gehen',
  'kommen',
  'sehen',
  'geben',
  'nehmen',
  'finden',
  'sagen',
  'machen',
  'wissen',
  'denken',
  'sprechen',
  'schreiben',
  'lesen',
  'lernen',
  'arbeiten',
  'spielen',
  'helfen',
  'bringen',
  'laufen',
  'fahren',
  'tragen',
  'halten',
  'beginnen',
  'heute',
  'gestern',
  'morgen',
  'hier',
  'dort',
  'oben',
  'unten',
  'links',
  'rechts',
  'innen',
  'außen',
  'vorne',
  'hinten',
];

const DURATIONS = [30, 60, 120] as const;
type Duration = (typeof DURATIONS)[number];

function generateText(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDS_DE[Math.floor(Math.random() * WORDS_DE.length)] ?? 'und');
  }
  return words.join(' ');
}

export default function TypingTestGame() {
  const [duration, setDuration] = useState<Duration>(60);
  const [text, setText] = useState<string>(() => generateText(100));
  const [charIndex, setCharIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrect, setIncorrect] = useState<Set<number>>(() => new Set());
  const [totalTyped, setTotalTyped] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [announcement, setAnnouncement] = useState('Tippe los, wenn du bereit bist.');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.TYPING_TEST_BEST,
    TypingTestBestSchema,
    0,
  );
  const startedAt = useRef<number | null>(null);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setText(generateText(100));
    setCharIndex(0);
    setCorrectCount(0);
    setIncorrect(new Set());
    setTotalTyped(0);
    setRemaining(duration);
    setRunning(false);
    setFinished(false);
    startedAt.current = null;
    setAnnouncement('Tippe los, wenn du bereit bist.');
  }, [duration]);

  useEffect(() => {
    restart();
  }, [duration, restart]);

  useEffect(() => {
    if (!running || finished) return;
    const id = window.setInterval(() => {
      if (!startedAt.current) return;
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) {
        setFinished(true);
        setRunning(false);
        const words = correctCount / 5;
        const wpm = elapsed > 0 ? Math.round(words / (elapsed / 60)) : 0;
        if (wpm > best) {
          setBest(wpm);
          sfx.win();
          vibrate([60, 40, 120]);
          setAnnouncement(`Test beendet. Neue Bestmarke ${wpm} WPM.`);
        } else {
          sfx.match();
          setAnnouncement(`Test beendet. ${wpm} WPM.`);
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [running, finished, duration, correctCount, best, setBest, sfx, vibrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      if (!running) {
        setRunning(true);
        startedAt.current = Date.now();
      }
      if (charIndex < text.length) {
        const expected = text[charIndex];
        setTotalTyped((t) => t + 1);
        if (e.key === expected) {
          setCorrectCount((c) => c + 1);
        } else {
          setIncorrect((s) => {
            const next = new Set(s);
            next.add(charIndex);
            return next;
          });
          vibrate(20);
        }
        setCharIndex((i) => i + 1);
      }
      if (charIndex >= text.length - 40) {
        setText((t) => t + ' ' + generateText(50));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, running, charIndex, text, vibrate]);

  const elapsed = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0;
  const wpm = elapsed > 0 ? Math.round(correctCount / 5 / (elapsed / 60)) : 0;
  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 100) : 100;

  const windowBefore = 15;
  const visibleStart = Math.max(0, charIndex - windowBefore);
  const visibleEnd = Math.min(text.length, visibleStart + 80);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          Dauer:
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as Duration)}
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} Sekunden
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" size="sm" onClick={restart}>
          Neuer Test
        </Button>
      </div>

      <div className="grid w-full max-w-md grid-cols-4 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          WPM: <span className="font-semibold tabular-nums">{wpm}</span>
        </div>
        <div className="text-center">
          Genauigkeit: <span className="font-semibold tabular-nums">{accuracy}%</span>
        </div>
        <div className="text-right">
          Zeit: <span className="font-semibold tabular-nums">{remaining}s</span>
        </div>
        <div className="text-right">
          Rekord: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        className="min-h-24 w-full max-w-2xl rounded-lg bg-slate-900 p-4 font-mono text-base leading-relaxed dark:bg-slate-950"
        aria-label="Tipp-Text"
      >
        {Array.from(text.slice(visibleStart, visibleEnd)).map((ch, i) => {
          const idx = visibleStart + i;
          const isPast = idx < charIndex;
          const isCurrent = idx === charIndex;
          let cls = 'text-slate-400';
          if (isPast) cls = incorrect.has(idx) ? 'text-rose-400 underline' : 'text-emerald-400';
          else if (isCurrent) cls = 'text-amber-300 underline';
          return (
            <span key={idx} className={cls}>
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tippe einfach drauflos — Timer startet beim ersten Tastendruck. WPM = (richtige Zeichen / 5)
        pro Minute. Rekord persistiert.
      </p>
    </div>
  );
}
