import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import {
  BINGO_COLUMNS,
  BINGO_FREE_INDEX,
  BINGO_SIZE,
  type BingoCard,
  type BingoState,
  columnFor,
  createInitialState,
  drawNumber,
} from '../lib/bingo';
import { STORAGE_KEYS } from '../lib/constants';
import { BingoBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

export default function BingoGame() {
  const [state, setState] = useState<BingoState>(() => createInitialState(2));
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.BINGO_BEST,
    BingoBestSchema,
    null,
  );
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const prevWonRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const lastDrawn = state.drawn[state.drawn.length - 1];

  useEffect(() => {
    if (state.won && !prevWonRef.current) {
      const draws = state.drawn.length;
      if (best === null || draws < best) {
        setBest(draws);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Bingo! Karte ${(state.winningCard ?? 0) + 1} hat gewonnen.`);
      vibrate([40, 30, 60, 30, 60]);
      sfx.win();
    }
    prevWonRef.current = state.won;
  }, [state.won, state.winningCard, state.drawn.length, best, setBest, vibrate, sfx]);

  const draw = useCallback(() => {
    if (state.won || state.pool.length === 0) return;
    vibrate(15);
    setState((s) => drawNumber(s));
  }, [state.won, state.pool.length, vibrate]);

  const restart = useCallback(() => {
    setState(createInitialState(2));
    setWinOpen(false);
    setScoreIsNew(false);
    prevWonRef.current = false;
    setAnnounce('Neue Runde gestartet.');
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-col items-center gap-1">
        <div className="text-xs uppercase tracking-widest text-slate-500">Gezogen</div>
        <div className="min-h-12 text-4xl font-extrabold text-amber-500 dark:text-amber-400 tabular-nums">
          {lastDrawn !== undefined ? `${BINGO_COLUMNS[columnFor(lastDrawn)]} ${lastDrawn}` : '—'}
        </div>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {state.cards.map((card, ci) => (
          <CardView
            key={`card-${ci}`}
            card={card}
            cardNumber={ci + 1}
            winning={state.winningCard === ci}
          />
        ))}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <Button
          variant="primary"
          block
          onClick={draw}
          disabled={state.won || state.pool.length === 0}
        >
          {state.pool.length === 0 ? 'Pool leer' : 'Ziehen'}
        </Button>
        <Button variant="secondary" onClick={restart}>
          Neu
        </Button>
      </div>

      <div className="flex w-full max-w-md justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span>
          Gezogen:{' '}
          <span className="font-semibold tabular-nums">
            {state.drawn.length}/{state.pool.length + state.drawn.length}
          </span>
        </span>
        <span>
          Best: <span className="font-semibold tabular-nums">{best !== null ? best : '—'}</span>
        </span>
      </div>

      {state.drawn.length > 0 && (
        <p className="max-w-md text-center text-xs text-slate-500 break-words">
          Bisherige Zahlen: {state.drawn.join(', ')}
        </p>
      )}

      <p className="max-w-md text-center text-xs text-slate-500">
        Beim Ziehen wird die Zahl automatisch auf beiden Karten markiert. Eine komplette Reihe,
        Spalte oder Diagonale gewinnt.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Bingo!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🎉
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Karte {(state.winningCard ?? 0) + 1} hat Bingo nach {state.drawn.length} gezogenen
            Zahlen.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function CardView({
  card,
  cardNumber,
  winning,
}: {
  card: BingoCard;
  cardNumber: number;
  winning: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-3 transition-colors ${
        winning
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
        Karte {cardNumber}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${BINGO_SIZE}, minmax(34px, 1fr))` }}
      >
        {BINGO_COLUMNS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-bold text-amber-600 dark:text-amber-400"
          >
            {label}
          </div>
        ))}
        {card.numbers.map((n, i) => {
          const isFree = i === BINGO_FREE_INDEX;
          const isMarked = card.marked[i];
          return (
            <div
              key={`cell-${i}`}
              title={isFree ? 'Freifeld' : `${n}${isMarked ? ' (markiert)' : ''}`}
              className={`flex aspect-square items-center justify-center rounded-md text-sm font-semibold tabular-nums transition-colors ${
                isFree
                  ? 'bg-amber-300 text-xs text-slate-900'
                  : isMarked
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {isFree ? 'FREI' : n}
            </div>
          );
        })}
      </div>
    </div>
  );
}
