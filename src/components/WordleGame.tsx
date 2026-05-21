import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { EMPTY_WORDLE_STATS, type WordleStats, WordleStatsSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import {
  appendLetter,
  backspace,
  createInitialState,
  keyboardStatus,
  type LetterState,
  MAX_GUESSES,
  pickRandomWord,
  submitGuess,
  WORD_LENGTH,
  type WordleState,
} from '../lib/wordle';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import GameOverSheet from './ui/GameOverSheet';
import WordleKeyboard from './WordleKeyboard';

function cellClass(state: LetterState | undefined, filled: boolean): string {
  if (state === 'correct') return 'bg-emerald-500 text-white border-emerald-600';
  if (state === 'present') return 'bg-amber-400 text-white border-amber-500';
  if (state === 'absent')
    return 'bg-slate-400 text-white border-slate-500 dark:bg-slate-700 dark:border-slate-800';
  if (filled)
    return 'border-slate-400 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100';
  return 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';
}

function updateStats(stats: WordleStats, outcome: 'won' | 'lost', guessCount: number): WordleStats {
  const played = stats.played + 1;
  if (outcome === 'lost') {
    return {
      ...stats,
      played,
      currentStreak: 0,
    };
  }
  const distribution = stats.distribution.slice() as WordleStats['distribution'];
  const idx = Math.max(0, Math.min(5, guessCount - 1));
  distribution[idx] = (distribution[idx] ?? 0) + 1;
  const currentStreak = stats.currentStreak + 1;
  return {
    ...stats,
    played,
    won: stats.won + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
  };
}

export default function WordleGame() {
  const [state, setState] = useState<WordleState>(() => createInitialState(pickRandomWord()));
  const [stats, setStats] = useLocalStorage<WordleStats>(
    STORAGE_KEYS.WORDLE_STATS,
    WordleStatsSchema,
    EMPTY_WORDLE_STATS,
  );
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const shakeTimeoutRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const flashError = useCallback((message: string) => {
    setError(message);
    setShake(true);
    if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current);
    if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShake(false), 350);
    errorTimeoutRef.current = window.setTimeout(() => setError(null), 1800);
  }, []);

  useEffect(
    () => () => {
      if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current);
      if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current);
    },
    [],
  );

  const handleEnter = useCallback(() => {
    setState((s) => {
      if (s.done) return s;
      if (s.current.length < WORD_LENGTH) {
        flashError('Zu wenig Buchstaben');
        vibrate(40);
        sfx.error();
        return s;
      }
      const r = submitGuess(s, s.current);
      if (r.error === 'not-a-word') {
        flashError('Nicht im Wörterbuch');
        vibrate(40);
        sfx.error();
        return s;
      }
      if (r.state.done === 'won') {
        vibrate([40, 30, 40, 30, 80]);
        sfx.win();
        setAnnouncement(`Gewonnen in ${r.state.guesses.length} Versuchen`);
      } else if (r.state.done === 'lost') {
        vibrate([80, 60, 80]);
        sfx.lose();
        setAnnouncement(`Verloren. Wort war ${r.state.target}`);
      }
      return r.state;
    });
  }, [flashError, vibrate, sfx]);

  const handleLetter = useCallback((ch: string) => {
    setState((s) => appendLetter(s, ch));
  }, []);

  const handleBackspace = useCallback(() => {
    setState((s) => backspace(s));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-ZäöüßÄÖÜẞ]$/.test(e.key)) {
        e.preventDefault();
        handleLetter(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleEnter, handleBackspace, handleLetter]);

  useEffect(() => {
    if (state.done && !finishedRef.current) {
      finishedRef.current = true;
      const outcome = state.done;
      setStats((prev) => updateStats(prev, outcome, state.guesses.length));
      const openId = window.setTimeout(() => setDoneOpen(true), 600);
      return () => window.clearTimeout(openId);
    }
  }, [state.done, state.guesses.length, setStats]);

  const newGame = useCallback(() => {
    finishedRef.current = false;
    setDoneOpen(false);
    setError(null);
    setShake(false);
    setState(createInitialState(pickRandomWord()));
  }, []);

  const kbStatus = keyboardStatus(state);

  const rows: { letters: string[]; statuses: (LetterState | undefined)[]; isCurrent: boolean }[] =
    Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
      if (rowIdx < state.guesses.length) {
        const guess = state.guesses[rowIdx]!;
        const stat = state.statuses[rowIdx]!;
        return {
          letters: guess.split(''),
          statuses: stat,
          isCurrent: false,
        };
      }
      if (rowIdx === state.guesses.length && !state.done) {
        const letters = state.current.split('');
        while (letters.length < WORD_LENGTH) letters.push('');
        return {
          letters,
          statuses: new Array(WORD_LENGTH).fill(undefined),
          isCurrent: true,
        };
      }
      return {
        letters: new Array(WORD_LENGTH).fill(''),
        statuses: new Array(WORD_LENGTH).fill(undefined),
        isCurrent: false,
      };
    });

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announcement} />

      <div
        className={`mx-auto flex w-full max-w-xs flex-col gap-1 sm:max-w-sm ${shake ? 'wordle-shake' : ''}`}
        role="grid"
        aria-label={`Wordle-Versuche ${state.guesses.length} von ${MAX_GUESSES}`}
      >
        {rows.map((row, ri) => (
          <div key={ri} role="row" className="grid grid-cols-5 gap-1">
            {row.letters.map((ch, ci) => (
              <div
                key={ci}
                role="gridcell"
                aria-label={
                  row.statuses[ci]
                    ? `${ch}, ${
                        row.statuses[ci] === 'correct'
                          ? 'richtig'
                          : row.statuses[ci] === 'present'
                            ? 'enthalten'
                            : 'nicht enthalten'
                      }`
                    : ch
                      ? `${ch}`
                      : 'leer'
                }
                className={`flex aspect-square items-center justify-center rounded border-2 text-2xl font-bold uppercase ${cellClass(row.statuses[ci], !!ch)}`}
              >
                {ch}
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && (
        <div
          role="status"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow dark:bg-slate-100 dark:text-slate-900"
        >
          {error}
        </div>
      )}

      <WordleKeyboard
        status={kbStatus}
        onLetter={handleLetter}
        onEnter={handleEnter}
        onBackspace={handleBackspace}
        disabled={state.done !== null}
      />

      {state.done && (
        <Button variant="primary" block className="max-w-md" onClick={newGame}>
          Nochmal spielen
        </Button>
      )}

      <GameOverSheet
        open={doneOpen}
        onClose={() => setDoneOpen(false)}
        title={state.done === 'won' ? 'Gewonnen!' : 'Verloren'}
        emoji={state.done === 'won' ? '🎉' : '🙈'}
        message={
          state.done === 'won' ? (
            <>
              In {state.guesses.length} {state.guesses.length === 1 ? 'Versuch' : 'Versuchen'}{' '}
              erraten.
            </>
          ) : (
            <>
              Das Wort war <span className="font-bold uppercase">{state.target}</span>.
            </>
          )
        }
        stats={[
          { label: 'Spiele', value: stats.played },
          {
            label: 'Siege',
            value: `${stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%`,
          },
          { label: 'Serie', value: stats.currentStreak },
          { label: 'Beste', value: stats.maxStreak },
        ]}
        primaryAction={{ label: 'Nochmal spielen', onClick: newGame }}
      />
    </div>
  );
}
