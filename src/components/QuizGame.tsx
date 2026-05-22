import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { QuizBestSchema } from '../lib/persistedSchemas';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../lib/quizQuestions';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const TOTAL = 10;
const LETTERS = ['A', 'B', 'C', 'D'] as const;

function pickQuestions(): QuizQuestion[] {
  const arr = [...QUIZ_QUESTIONS];
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

export default function QuizGame() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => pickQuestions());
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [over, setOver] = useState(false);
  const [announcement, setAnnouncement] = useState('Wähle die richtige Antwort.');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.QUIZ_BEST, QuizBestSchema, 0);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setQuestions(pickQuestions());
    setCurrent(0);
    setCorrect(0);
    setSelected(null);
    setAnswered(false);
    setOver(false);
    setAnnouncement('Wähle die richtige Antwort.');
  }, []);

  const question = questions[current];

  const selectAnswer = useCallback(
    (idx: number) => {
      if (answered || over || !question) return;
      setAnswered(true);
      setSelected(idx);
      vibrate(15);
      const isCorrect = idx === question.c;
      if (isCorrect) {
        setCorrect((c) => c + 1);
        sfx.match();
        setAnnouncement('Richtig.');
      } else {
        sfx.error();
        setAnnouncement(`Falsch. Richtig: ${question.a[question.c]}.`);
      }
      window.setTimeout(() => {
        setSelected(null);
        setAnswered(false);
        setCurrent((c) => {
          if (c + 1 >= TOTAL) {
            setOver(true);
            const finalCorrect = correct + (isCorrect ? 1 : 0);
            if (finalCorrect > best) setBest(finalCorrect);
            if (finalCorrect === TOTAL) {
              setAnnouncement('Perfekt! Alle richtig.');
              sfx.win();
              vibrate([60, 40, 120]);
            } else {
              setAnnouncement(`Quiz beendet: ${finalCorrect} von ${TOTAL}.`);
            }
            return c;
          }
          return c + 1;
        });
      }, 1200);
    },
    [answered, over, question, correct, best, setBest, sfx, vibrate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (answered || over) return;
      if (e.key >= '1' && e.key <= '4') selectAnswer(Number(e.key) - 1);
      const k = e.key.toLowerCase();
      if (k === 'a') selectAnswer(0);
      if (k === 'b') selectAnswer(1);
      if (k === 'c') selectAnswer(2);
      if (k === 'd') selectAnswer(3);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, over, selectAnswer]);

  if (over) {
    let msg = 'Da geht noch mehr.';
    if (correct === TOTAL) msg = 'Perfekt! Alle richtig.';
    else if (correct >= 8) msg = 'Ausgezeichnet!';
    else if (correct >= 6) msg = 'Gut gemacht.';
    else if (correct >= 4) msg = 'Nicht schlecht.';
    return (
      <div className="flex flex-col items-center gap-4 pb-4">
        <AriaLive message={announcement} />
        <div className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">
          {correct} / {TOTAL}
        </div>
        <p className="text-surface-700 dark:text-surface-200">{msg}</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Rekord:{' '}
          <span className="font-semibold">
            {best}/{TOTAL}
          </span>
        </p>
        <Button variant="primary" onClick={restart}>
          Nochmal spielen
        </Button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Frage: <span className="font-semibold tabular-nums">{current + 1}</span>/{TOTAL}
        </div>
        <div className="text-center">
          Richtig: <span className="font-semibold tabular-nums">{correct}</span>
        </div>
        <div className="text-right">
          Rekord: <span className="font-semibold tabular-nums">{best}</span>/{TOTAL}
        </div>
      </div>

      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${((current + 1) / TOTAL) * 100}%` }}
        />
      </div>

      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
          {question.cat}
        </div>
        <h2 className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-100">
          {question.q}
        </h2>
      </div>

      <div className="grid w-full max-w-md gap-2">
        {question.a.map((answer, i) => {
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
              disabled={answered}
              aria-label={`${LETTERS[i]}: ${answer}`}
              className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 text-left text-sm font-medium transition disabled:cursor-not-allowed ${bg}`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {LETTERS[i]}
              </span>
              {answer}
            </button>
          );
        })}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        10 Fragen aus gemischten Kategorien. Tippe A/B/C/D oder 1-4 auf der Tastatur.
      </p>
    </div>
  );
}
