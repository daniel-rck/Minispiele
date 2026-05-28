import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { StroopBestSchema } from '../lib/persistedSchemas';
import { nextChallenge, STROOP_COLORS, STROOP_ROUND_SECONDS, scoreAnswer } from '../lib/stroop';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const COLOR_STYLES: Record<string, { textClass: string; bgClass: string }> = {
  red: { textClass: 'text-red-500', bgClass: 'bg-red-500' },
  green: { textClass: 'text-emerald-500', bgClass: 'bg-emerald-500' },
  blue: { textClass: 'text-sky-500', bgClass: 'bg-sky-500' },
  yellow: { textClass: 'text-amber-500', bgClass: 'bg-amber-500' },
};

type Phase = 'idle' | 'playing' | 'done';

export default function StroopGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [challenge, setChallenge] = useState(() => nextChallenge());
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STROOP_ROUND_SECONDS);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.STROOP_BEST, StroopBestSchema, 0);
  const [announce, setAnnounce] = useState('');
  const tickRef = useRef<number | null>(null);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  useEffect(() => {
    if (phase !== 'playing') return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      setPhase('done');
      if (score > best) setBest(score);
      setAnnounce(`Fertig. ${score} Punkte`);
      sfx.win();
    }
  }, [timeLeft, phase, score, best, setBest, sfx]);

  const startRound = useCallback(() => {
    setScore(0);
    setWrong(0);
    setTimeLeft(STROOP_ROUND_SECONDS);
    setChallenge(nextChallenge());
    setPhase('playing');
    setAnnounce('Spiel gestartet');
  }, []);

  const handleAnswer = useCallback(
    (colorKey: string) => {
      if (phase !== 'playing') return;
      const correct = scoreAnswer(challenge, colorKey) === 'correct';
      if (correct) {
        setScore((s) => s + 1);
        vibrate(15);
      } else {
        setWrong((w) => w + 1);
        vibrate([50, 30, 50]);
        sfx.error();
      }
      setChallenge((prev) => nextChallenge(prev));
    },
    [phase, challenge, vibrate, sfx],
  );

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Zeit: <span className="font-semibold tabular-nums">{timeLeft}s</span>
        </div>
        <div className="text-center">
          Punkte: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {phase === 'idle' && (
          <Button variant="primary" onClick={startRound}>
            Starten
          </Button>
        )}
        {phase === 'playing' && (
          <span
            role="img"
            aria-label={`Wort ${challenge.word.label}, Farbe ${challenge.ink.label}`}
            className={`text-5xl font-extrabold uppercase tracking-wide ${COLOR_STYLES[challenge.ink.key]?.textClass ?? ''}`}
          >
            {challenge.word.label}
          </span>
        )}
        {phase === 'done' && (
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold tabular-nums">{score} Punkte</div>
            <div className="mb-3 text-xs text-slate-500">
              Fehler: <span className="tabular-nums">{wrong}</span>
            </div>
            <Button variant="primary" onClick={startRound}>
              Nochmal spielen
            </Button>
          </div>
        )}
      </div>

      <div
        className="grid w-full max-w-md grid-cols-2 gap-2"
        role="group"
        aria-label="Farb-Antworten"
      >
        {STROOP_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handleAnswer(c.key)}
            disabled={phase !== 'playing'}
            aria-label={c.label}
            className={`min-h-14 rounded-xl text-base font-semibold text-white shadow-sm disabled:opacity-50 ${COLOR_STYLES[c.key]?.bgClass ?? ''}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe auf die <strong>Schriftfarbe</strong>, nicht auf das gelesene Wort.
      </p>
    </div>
  );
}
