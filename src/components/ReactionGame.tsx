import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { ReactionBestSchema } from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';

type Phase = 'idle' | 'waiting' | 'ready' | 'tooEarly' | 'done';

const MIN_WAIT_MS = 1200;
const MAX_WAIT_MS = 3800;

export default function ReactionGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.REACTION_BEST,
    ReactionBestSchema,
    null,
  );
  const [announce, setAnnounce] = useState('');
  const timeoutRef = useRef<number | null>(null);
  const readyAtRef = useRef<number>(0);
  const { vibrate } = useVibration();

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startWaiting = useCallback(() => {
    clearPending();
    setReactionMs(null);
    setPhase('waiting');
    const delay = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    timeoutRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase('ready');
      vibrate(20);
    }, delay);
  }, [clearPending, vibrate]);

  const handleTap = useCallback(() => {
    if (phase === 'idle' || phase === 'done' || phase === 'tooEarly') {
      startWaiting();
      return;
    }
    if (phase === 'waiting') {
      clearPending();
      setPhase('tooEarly');
      setAnnounce('Zu früh!');
      vibrate([60, 40, 60]);
      return;
    }
    if (phase === 'ready') {
      const ms = Math.round(performance.now() - readyAtRef.current);
      setReactionMs(ms);
      setPhase('done');
      setAnnounce(`${ms} Millisekunden`);
      if (best === null || ms < best) setBest(ms);
      vibrate(30);
    }
  }, [phase, startWaiting, clearPending, best, setBest, vibrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap]);

  const surface =
    phase === 'idle'
      ? 'bg-slate-200 dark:bg-slate-800'
      : phase === 'waiting'
        ? 'bg-red-500'
        : phase === 'ready'
          ? 'bg-emerald-500'
          : phase === 'tooEarly'
            ? 'bg-amber-500'
            : 'bg-sky-500';

  const message =
    phase === 'idle'
      ? 'Tippe um zu starten'
      : phase === 'waiting'
        ? 'Warte auf Grün …'
        : phase === 'ready'
          ? 'JETZT!'
          : phase === 'tooEarly'
            ? 'Zu früh! Tippe nochmal'
            : `${reactionMs} ms`;

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Letzte:{' '}
          <span className="font-semibold tabular-nums">
            {reactionMs !== null ? `${reactionMs} ms` : '—'}
          </span>
        </div>
        <div className="text-right">
          Best:{' '}
          <span className="font-semibold tabular-nums">{best !== null ? `${best} ms` : '—'}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleTap}
        aria-label="Reaktionsfeld"
        className={`flex aspect-square w-full max-w-md select-none items-center justify-center rounded-2xl text-2xl font-bold text-white transition-colors ${surface}`}
      >
        <span className="px-4 text-center">{message}</span>
      </button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Tippe sobald die Fläche grün wird. Leertaste oder Enter funktionieren ebenfalls.
      </p>
    </div>
  );
}
