import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRandomHangmanWord } from '../lib/hangmanWords';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import {
  EMPTY_HANGMAN_STATS,
  HangmanStatsSchema,
  type HangmanStats,
} from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import AriaLive from './AriaLive';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_MISTAKES = 10;

interface HangmanState {
  word: string;
  guessed: Set<string>;
  mistakes: number;
}

function createInitialState(): HangmanState {
  return { word: pickRandomHangmanWord(), guessed: new Set(), mistakes: 0 };
}

function isWon(state: HangmanState): boolean {
  return state.word.split('').every((ch) => state.guessed.has(ch));
}

function isLost(state: HangmanState): boolean {
  return state.mistakes >= MAX_MISTAKES;
}

function HangmanFigure({ mistakes }: { mistakes: number }) {
  const stroke = 'currentColor';
  return (
    <svg
      viewBox="0 0 120 140"
      className="h-32 w-full max-w-[220px] text-slate-700 dark:text-slate-200"
      aria-hidden
    >
      <line x1="10" y1="135" x2="110" y2="135" stroke={stroke} strokeWidth="3" />
      {mistakes >= 1 && <line x1="30" y1="135" x2="30" y2="10" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 2 && <line x1="28" y1="10" x2="80" y2="10" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 3 && <line x1="80" y1="10" x2="80" y2="28" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 4 && (
        <circle cx="80" cy="38" r="10" stroke={stroke} strokeWidth="3" fill="none" />
      )}
      {mistakes >= 5 && <line x1="80" y1="48" x2="80" y2="85" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 6 && <line x1="80" y1="60" x2="65" y2="75" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 7 && <line x1="80" y1="60" x2="95" y2="75" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 8 && <line x1="80" y1="85" x2="65" y2="105" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 9 && <line x1="80" y1="85" x2="95" y2="105" stroke={stroke} strokeWidth="3" />}
      {mistakes >= 10 && (
        <>
          <line x1="76" y1="36" x2="78" y2="38" stroke={stroke} strokeWidth="2" />
          <line x1="78" y1="36" x2="76" y2="38" stroke={stroke} strokeWidth="2" />
          <line x1="82" y1="36" x2="84" y2="38" stroke={stroke} strokeWidth="2" />
          <line x1="84" y1="36" x2="82" y2="38" stroke={stroke} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export default function HangmanGame() {
  const [state, setState] = useState<HangmanState>(createInitialState);
  const [stats, setStats] = useLocalStorage<HangmanStats>(
    STORAGE_KEYS.HANGMAN_STATS,
    HangmanStatsSchema,
    EMPTY_HANGMAN_STATS,
  );
  const [doneOpen, setDoneOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  const won = isWon(state);
  const lost = isLost(state);
  const done = won || lost;

  useEffect(() => {
    if (done && !finishedRef.current) {
      finishedRef.current = true;
      setStats((prev) => {
        const played = prev.played + 1;
        if (won) {
          const currentStreak = prev.currentStreak + 1;
          return {
            ...prev,
            played,
            won: prev.won + 1,
            currentStreak,
            maxStreak: Math.max(prev.maxStreak, currentStreak),
          };
        }
        return { ...prev, played, currentStreak: 0 };
      });
      setAnnounce(won ? 'Gewonnen!' : `Verloren. Wort war ${state.word}`);
      vibrate(won ? [40, 30, 80] : [80, 60, 80]);
      const id = window.setTimeout(() => setDoneOpen(true), 500);
      return () => window.clearTimeout(id);
    }
  }, [done, won, state.word, setStats, vibrate]);

  const guess = useCallback(
    (ch: string) => {
      if (done) return;
      const up = ch.toUpperCase();
      if (!/^[A-Z]$/.test(up)) return;
      setState((s) => {
        if (s.guessed.has(up)) return s;
        const guessed = new Set(s.guessed);
        guessed.add(up);
        const hit = s.word.includes(up);
        return { ...s, guessed, mistakes: hit ? s.mistakes : s.mistakes + 1 };
      });
      vibrate(15);
    },
    [done, vibrate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        guess(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guess]);

  const restart = useCallback(() => {
    finishedRef.current = false;
    setDoneOpen(false);
    setState(createInitialState());
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Fehler:{' '}
          <span className="font-semibold tabular-nums">
            {state.mistakes} / {MAX_MISTAKES}
          </span>
        </div>
        <div className="text-center">
          Serie: <span className="font-semibold tabular-nums">{stats.currentStreak}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{stats.maxStreak}</span>
        </div>
      </div>

      <HangmanFigure mistakes={state.mistakes} />

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Wort"
      >
        {state.word.split('').map((ch, i) => {
          const shown = state.guessed.has(ch) || lost;
          return (
            <span
              key={i}
              className={`inline-flex h-10 w-7 items-end justify-center border-b-2 text-2xl font-bold uppercase ${
                shown ? 'border-slate-500 text-slate-900 dark:text-slate-100' : 'border-slate-400'
              } ${!shown ? 'text-transparent' : ''}`}
              aria-label={shown ? ch : 'verborgen'}
            >
              {shown ? ch : '_'}
            </span>
          );
        })}
      </div>

      <div
        className="grid w-full max-w-lg grid-cols-7 gap-1.5 sm:grid-cols-9"
        role="group"
        aria-label="Buchstaben"
      >
        {ALPHABET.map((ch) => {
          const used = state.guessed.has(ch);
          const correct = used && state.word.includes(ch);
          const wrong = used && !state.word.includes(ch);
          return (
            <button
              key={ch}
              type="button"
              onClick={() => guess(ch)}
              disabled={used || done}
              aria-label={ch}
              className={`min-h-11 rounded-lg text-sm font-semibold uppercase ${
                correct
                  ? 'bg-emerald-500 text-white'
                  : wrong
                    ? 'bg-slate-400 text-white dark:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              } border border-slate-300 disabled:opacity-70 dark:border-slate-700`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <Sheet
        open={doneOpen}
        onClose={() => setDoneOpen(false)}
        title={won ? 'Gewonnen!' : 'Verloren'}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            {won ? '🎉' : '💀'}
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {won ? (
              <>
                Wort gefunden: <span className="font-bold uppercase">{state.word}</span>
              </>
            ) : (
              <>
                Das Wort war: <span className="font-bold uppercase">{state.word}</span>
              </>
            )}
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-lg font-semibold tabular-nums">{stats.played}</div>
              <div className="text-slate-500">Spiele</div>
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums">{stats.currentStreak}</div>
              <div className="text-slate-500">Serie</div>
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums">{stats.maxStreak}</div>
              <div className="text-slate-500">Beste</div>
            </div>
          </div>
          <Button variant="primary" block onClick={restart}>
            Neues Wort
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
