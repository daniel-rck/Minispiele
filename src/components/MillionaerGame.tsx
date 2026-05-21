import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  MILLIONAER_QUESTIONS,
  type MillionaerQuestion,
  PRIZES,
  SAFE_LEVELS,
} from '../lib/millionaerQuestions';
import { MillionaerBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const TOTAL = 15;
const LETTERS = ['A', 'B', 'C', 'D'] as const;

function pickQuestions(): MillionaerQuestion[] {
  const arr = [...MILLIONAER_QUESTIONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a && b) {
      arr[i] = b;
      arr[j] = a;
    }
  }
  return arr.slice(0, TOTAL);
}

export default function MillionaerGame() {
  const [questions, setQuestions] = useState<MillionaerQuestion[]>(() => pickQuestions());
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [over, setOver] = useState(false);
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [jokers, setJokers] = useState({ fifty: false, audience: false, phone: false });
  const [hint, setHint] = useState<string>('');
  const [announcement, setAnnouncement] = useState('Frage 1 von 15.');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.MILLIONAER_BEST,
    MillionaerBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const question = questions[level];

  const restart = useCallback(() => {
    setQuestions(pickQuestions());
    setLevel(0);
    setSelected(null);
    setAnswered(false);
    setOver(false);
    setHidden(new Set());
    setJokers({ fifty: false, audience: false, phone: false });
    setHint('');
    setAnnouncement('Frage 1 von 15.');
  }, []);

  const selectAnswer = useCallback(
    (idx: number) => {
      if (answered || over || !question) return;
      setAnswered(true);
      setSelected(idx);
      vibrate(15);
      if (idx === question.c) {
        sfx.match();
        setAnnouncement(`Richtig. Du hast ${PRIZES[level]?.toLocaleString('de-DE')} Punkte.`);
        window.setTimeout(() => {
          if (level + 1 >= TOTAL) {
            setOver(true);
            const prize = PRIZES[TOTAL - 1] ?? 0;
            if (prize > best) setBest(prize);
            setAnnouncement('MILLIONÄR! Alle 15 Fragen richtig.');
            sfx.win();
            vibrate([60, 40, 120]);
            return;
          }
          setLevel((l) => l + 1);
          setSelected(null);
          setAnswered(false);
          setHidden(new Set());
          setHint('');
        }, 1000);
      } else {
        sfx.lose();
        vibrate([120, 60, 80]);
        const safeLevel = SAFE_LEVELS.filter((s) => s < level).pop();
        const prize = safeLevel !== undefined ? (PRIZES[safeLevel] ?? 0) : 0;
        if (prize > best) setBest(prize);
        setAnnouncement(`Falsch. Du gehst mit ${prize.toLocaleString('de-DE')} Punkten heim.`);
        setOver(true);
      }
    },
    [answered, over, question, level, best, setBest, sfx, vibrate],
  );

  const useFifty = useCallback(() => {
    if (jokers.fifty || over || !question) return;
    const wrong = [0, 1, 2, 3].filter((i) => i !== question.c);
    for (let i = wrong.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = wrong[i];
      const b = wrong[j];
      if (a !== undefined && b !== undefined) {
        wrong[i] = b;
        wrong[j] = a;
      }
    }
    const hide = new Set<number>();
    if (wrong[0] !== undefined) hide.add(wrong[0]);
    if (wrong[1] !== undefined) hide.add(wrong[1]);
    setHidden(hide);
    setJokers((j) => ({ ...j, fifty: true }));
  }, [jokers.fifty, over, question]);

  const useAudience = useCallback(() => {
    if (jokers.audience || over || !question) return;
    const pcts = [5, 5, 5, 5];
    pcts[question.c] = 60 + Math.floor(Math.random() * 25);
    const rest = 100 - pcts[question.c]!;
    const others = [0, 1, 2, 3].filter((i) => i !== question.c);
    pcts[others[0]!] = Math.floor(rest * 0.5);
    pcts[others[1]!] = Math.floor(rest * 0.3);
    pcts[others[2]!] = rest - pcts[others[0]!]! - pcts[others[1]!]!;
    setHint(`Publikum: A ${pcts[0]}% · B ${pcts[1]}% · C ${pcts[2]}% · D ${pcts[3]}%`);
    setJokers((j) => ({ ...j, audience: true }));
  }, [jokers.audience, over, question]);

  const usePhone = useCallback(() => {
    if (jokers.phone || over || !question) return;
    const sure = Math.random() < 0.7;
    const answer = sure ? question.c : Math.floor(Math.random() * 4);
    setHint(`Telefonjoker: „Ich ${sure ? 'bin sicher' : 'glaube'}, es ist ${LETTERS[answer]}."`);
    setJokers((j) => ({ ...j, phone: true }));
  }, [jokers.phone, over, question]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex w-full max-w-md items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Frage: <span className="font-semibold tabular-nums">{level + 1}</span>/{TOTAL}
        </div>
        <div>
          Rekord: <span className="font-semibold tabular-nums">{best.toLocaleString('de-DE')}</span>
        </div>
      </div>

      <div
        className="flex flex-col-reverse items-center gap-1"
        role="group"
        aria-label="Gewinnpyramide"
      >
        {PRIZES.map((p, i) => {
          const isCurrent = i === level && !over;
          const isDone = i < level;
          const isSafe = SAFE_LEVELS.includes(i);
          return (
            <div
              key={i}
              className={`flex w-full max-w-md items-center justify-between rounded px-3 py-1 text-xs ${
                isCurrent
                  ? 'bg-amber-300 font-bold text-slate-900'
                  : isDone
                    ? 'bg-emerald-700/40 text-emerald-100'
                    : isSafe
                      ? 'bg-amber-700/40 text-amber-100'
                      : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span>{i + 1}</span>
              <span>{p.toLocaleString('de-DE')}</span>
            </div>
          );
        })}
      </div>

      {!over && question && (
        <>
          <div className="w-full max-w-md rounded-lg bg-slate-800 p-3 text-center text-base font-medium text-white">
            {question.q}
          </div>

          <div className="grid w-full max-w-md gap-2">
            {question.a.map((a, i) => {
              const isHidden = hidden.has(i);
              const isCorrect = answered && i === question.c;
              const isWrong = answered && selected === i && i !== question.c;
              const bg = isCorrect
                ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                : isWrong
                  ? 'border-rose-500 bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100'
                  : 'border-surface-300 bg-surface-100 text-surface-900 hover:border-amber-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectAnswer(i)}
                  disabled={answered || isHidden}
                  aria-label={`${LETTERS[i]}: ${a}`}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 text-left text-sm font-medium transition disabled:cursor-not-allowed ${
                    isHidden ? 'opacity-30' : bg
                  }`}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {LETTERS[i]}
                  </span>
                  {isHidden ? '—' : a}
                </button>
              );
            })}
          </div>

          {hint && (
            <div
              className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              role="status"
            >
              {hint}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={useFifty}
              disabled={jokers.fifty || answered}
            >
              50:50
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={useAudience}
              disabled={jokers.audience || answered}
            >
              Publikum
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={usePhone}
              disabled={jokers.phone || answered}
            >
              Telefon
            </Button>
          </div>
        </>
      )}

      {over && (
        <div className="text-center">
          <p className="mb-3 text-sm text-surface-700 dark:text-surface-200">{announcement}</p>
          <Button variant="primary" onClick={restart}>
            Neues Spiel
          </Button>
        </div>
      )}
    </div>
  );
}
