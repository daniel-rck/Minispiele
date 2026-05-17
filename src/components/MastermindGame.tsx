import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CODE_LENGTH,
  MAX_GUESSES,
  createInitialState,
  placePeg,
  removePeg,
  submit,
  type MastermindState,
} from '../lib/mastermind';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { MastermindBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import Sheet from './ui/Sheet';
import AriaLive from './AriaLive';

const COLOR_CLASSES = [
  'bg-red-500',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-pink-500',
];
const COLOR_NAMES = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Pink'];

export default function MastermindGame() {
  const [state, setState] = useState<MastermindState>(() => createInitialState());
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.MASTERMIND_BEST,
    MastermindBestSchema,
    null,
  );
  const [doneOpen, setDoneOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  useEffect(() => {
    if (state.done && !finishedRef.current) {
      finishedRef.current = true;
      if (state.done === 'won') {
        const count = state.guesses.length;
        if (best === null || count < best) {
          setBest(count);
          setScoreIsNew(true);
        } else {
          setScoreIsNew(false);
        }
        setAnnounce(`Gewonnen in ${count} Versuchen`);
        vibrate([40, 30, 40, 30, 80]);
      } else {
        setScoreIsNew(false);
        setAnnounce('Verloren');
        vibrate([80, 60, 80]);
      }
      const id = window.setTimeout(() => setDoneOpen(true), 500);
      return () => window.clearTimeout(id);
    }
  }, [state.done, state.guesses.length, best, setBest, vibrate]);

  const restart = useCallback(() => {
    finishedRef.current = false;
    setDoneOpen(false);
    setScoreIsNew(false);
    setState(createInitialState());
  }, []);

  const handleColor = (c: number) => {
    if (state.done) return;
    vibrate(15);
    setState((s) => placePeg(s, c));
  };

  const handleErase = () => {
    if (state.done) return;
    vibrate(15);
    setState((s) => removePeg(s));
  };

  const handleSubmit = () => {
    if (state.done) return;
    if (state.current.length !== CODE_LENGTH) {
      vibrate([40, 30, 40]);
      return;
    }
    vibrate(25);
    setState((s) => submit(s));
  };

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    const past = state.guesses[i];
    if (past) {
      return {
        pegs: past as readonly (number | null)[],
        fb: state.feedback[i]!,
        isCurrent: false,
      };
    }
    if (i === state.guesses.length && !state.done) {
      const current = [...state.current];
      while (current.length < CODE_LENGTH) current.push(-1);
      return {
        pegs: current.map((v) => (v === -1 ? null : v)),
        fb: null,
        isCurrent: true,
      };
    }
    return {
      pegs: new Array<number | null>(CODE_LENGTH).fill(null),
      fb: null,
      isCurrent: false,
    };
  });

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Versuch:{' '}
          <span className="font-semibold tabular-nums">
            {state.guesses.length + (state.done ? 0 : 1)} / {MAX_GUESSES}
          </span>
        </div>
        <div className="text-right">
          {best !== null ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div
        className="flex w-full max-w-md flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
        role="grid"
        aria-label="Mastermind-Versuche"
      >
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2" role="row">
            <div className="flex flex-1 gap-1.5">
              {row.pegs.map((p, j) => (
                <div
                  key={j}
                  role="gridcell"
                  aria-label={p === null ? 'leer' : COLOR_NAMES[p]}
                  className={`h-7 w-7 rounded-full border ${
                    p === null
                      ? 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                      : `border-slate-300 dark:border-slate-700 ${COLOR_CLASSES[p]}`
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-0.5">
              {row.fb
                ? Array.from({ length: CODE_LENGTH }, (_, k) => {
                    const black = row.fb!.black;
                    const white = row.fb!.white;
                    let cls = 'bg-slate-200 dark:bg-slate-700';
                    if (k < black) cls = 'bg-slate-900 dark:bg-slate-100';
                    else if (k < black + white) cls = 'bg-white border border-slate-400';
                    return <span key={k} className={`h-3 w-3 rounded-full ${cls}`} />;
                  })
                : Array.from({ length: CODE_LENGTH }, (_, k) => (
                    <span key={k} className="h-3 w-3 rounded-full bg-slate-100 dark:bg-slate-800" />
                  ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-6 gap-2" role="group" aria-label="Farbpalette">
        {COLOR_CLASSES.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleColor(i)}
            disabled={!!state.done || state.current.length >= CODE_LENGTH}
            aria-label={COLOR_NAMES[i]}
            className={`h-12 rounded-full border-2 border-white shadow-sm disabled:opacity-50 dark:border-slate-700 ${c}`}
          />
        ))}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={handleErase}
          disabled={!!state.done || state.current.length === 0}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!!state.done || state.current.length !== CODE_LENGTH}
          className="min-h-12 flex-1 rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Prüfen
        </button>
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe Farben in eine Reihe. <span className="font-semibold">Schwarz</span> = richtige Farbe,
        richtige Position. <span className="font-semibold">Weiß</span> = richtige Farbe, falsche
        Position.
      </p>

      <Sheet
        open={doneOpen}
        onClose={() => setDoneOpen(false)}
        title={state.done === 'won' ? 'Geknackt!' : 'Verloren'}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            {state.done === 'won' ? '🔓' : '🙈'}
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
            {state.done === 'won' ? (
              <>In {state.guesses.length} Versuchen geknackt.</>
            ) : (
              <>Code war:</>
            )}
          </p>
          <div className="mb-4 flex justify-center gap-1.5">
            {state.code.map((c, i) => (
              <span
                key={i}
                aria-label={COLOR_NAMES[c]}
                className={`h-8 w-8 rounded-full border ${COLOR_CLASSES[c]}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={restart}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </Sheet>
    </div>
  );
}
