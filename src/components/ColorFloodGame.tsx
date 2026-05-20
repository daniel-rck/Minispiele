import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import {
  applyMove,
  COLOR_FLOOD_MAX_MOVES,
  COLOR_FLOOD_PALETTE,
  COLOR_FLOOD_SIZE,
  type ColorFloodState,
  createInitialState,
  floodPercent,
} from '../lib/colorFlood';
import { STORAGE_KEYS } from '../lib/constants';
import { ColorFloodBestSchema } from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const PALETTE_LABELS = ['Rot', 'Blau', 'Grün', 'Gelb', 'Lila', 'Orange'] as const;

export default function ColorFloodGame() {
  const [state, setState] = useState<ColorFloodState>(() => createInitialState());
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.COLOR_FLOOD_BEST,
    ColorFloodBestSchema,
    null,
  );
  const [endOpen, setEndOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const prevDoneRef = useRef(false);
  const { vibrate } = useVibration();

  const done = state.won || state.lost;
  const currentColor = state.grid[0];
  const percent = floodPercent(state.grid);

  useEffect(() => {
    if (!done) {
      prevDoneRef.current = false;
      return;
    }
    if (prevDoneRef.current) return;
    prevDoneRef.current = true;
    if (state.won) {
      if (best === null || state.moves < best) {
        setBest(state.moves);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setAnnounce(`Gewonnen in ${state.moves} Zügen!`);
      vibrate([40, 30, 60]);
    } else {
      setScoreIsNew(false);
      setAnnounce('Vorbei – zu viele Züge.');
      vibrate(120);
    }
    setEndOpen(true);
  }, [done, state.won, state.moves, best, setBest, vibrate]);

  const restart = useCallback(() => {
    setState(createInitialState());
    setEndOpen(false);
    setScoreIsNew(false);
    prevDoneRef.current = false;
    setAnnounce('Neue Runde gestartet.');
  }, []);

  const pick = (colorIdx: number) => {
    if (done) return;
    if (colorIdx === currentColor) return;
    vibrate(15);
    setState((s) => applyMove(s, colorIdx));
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge:{' '}
          <span className="font-semibold tabular-nums">
            {state.moves}
            <span className="text-slate-400">/{COLOR_FLOOD_MAX_MOVES}</span>
          </span>
        </div>
        <div className="text-center">
          Geflutet: <span className="font-semibold tabular-nums">{percent}%</span>
        </div>
        <div className="text-right">
          {best !== null ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">Best —</span>
          )}
        </div>
      </div>

      <div
        className="grid w-full max-w-md gap-0 overflow-hidden rounded-2xl bg-slate-900 p-1 dark:bg-slate-950"
        style={{ gridTemplateColumns: `repeat(${COLOR_FLOOD_SIZE}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Farbflut-Spielfeld, ${state.moves} von ${COLOR_FLOOD_MAX_MOVES} Zügen verbraucht, ${percent} Prozent geflutet`}
      >
        {state.grid.map((color, i) => (
          <div
            key={i}
            className="aspect-square"
            style={{ backgroundColor: COLOR_FLOOD_PALETTE[color] }}
          />
        ))}
      </div>

      <div
        className="flex w-full max-w-md flex-wrap justify-center gap-2"
        role="group"
        aria-label="Farbauswahl"
      >
        {COLOR_FLOOD_PALETTE.map((hex, i) => {
          const isCurrent = i === currentColor;
          return (
            <button
              key={hex}
              type="button"
              onClick={() => pick(i)}
              disabled={done || isCurrent}
              aria-label={`Farbe wählen: ${PALETTE_LABELS[i]}${isCurrent ? ' (aktiv)' : ''}`}
              aria-pressed={isCurrent}
              className={`min-h-11 min-w-11 flex-1 rounded-xl border-4 transition-transform ${
                isCurrent
                  ? 'border-white opacity-50'
                  : 'border-transparent hover:scale-110 active:scale-95'
              } disabled:cursor-default`}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>

      <Button variant="primary" block className="max-w-md" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Wähle eine Farbe und färbe den Bereich oben links ein. Schaffe es in höchstens{' '}
        {COLOR_FLOOD_MAX_MOVES} Zügen, das ganze Feld einfarbig zu machen.
      </p>

      <Sheet
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title={state.won ? 'Geschafft!' : 'Vorbei'}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            {state.won ? '🎨' : '💧'}
          </div>
          {state.won && scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {state.won
              ? `Feld einfarbig in ${state.moves} Zügen.`
              : `Das Feld blieb mehrfarbig (${percent} % geflutet).`}
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
