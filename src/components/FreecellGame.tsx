import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SUITS,
  autoMoveToFoundation,
  canPlaceOnFoundation,
  deal,
  isWon,
  makeMove,
  rankLabel,
  undo,
  type Card,
  type FreecellState,
  type MoveSource,
  type MoveTarget,
} from '../lib/freecell';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { FreecellBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import AriaLive from './AriaLive';

function CardView({
  card,
  onClick,
  selected,
  className = '',
  small = false,
}: {
  card: Card | null;
  onClick: () => void;
  selected?: boolean;
  className?: string;
  small?: boolean;
}) {
  if (!card) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Leerer Platz"
        className={`flex items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800 ${className}`}
      >
        ·
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${rankLabel(card.rank)} ${card.suit}`}
      className={`flex items-center justify-center rounded-md border-2 bg-white font-bold dark:bg-slate-50 ${
        selected ? 'border-brand-500 ring-2 ring-brand-300' : 'border-slate-300'
      } ${small ? 'text-xs' : 'text-sm'} ${card.red ? 'text-red-600' : 'text-slate-900'} ${className}`}
    >
      <span>
        {rankLabel(card.rank)}
        <span className="ml-0.5">{card.suit}</span>
      </span>
    </button>
  );
}

export default function FreecellGame() {
  const [state, setState] = useState<FreecellState>(() => deal());
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.FREECELL_BEST,
    FreecellBestSchema,
    null,
  );
  const [selected, setSelected] = useState<MoveSource | null>(null);
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const wonRef = useRef(false);
  const { vibrate } = useVibration();

  const won = isWon(state);

  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      if (best === null || state.moves < best) {
        setBest(state.moves);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Gewonnen in ${state.moves} Zügen`);
      vibrate([40, 30, 60]);
    }
  }, [won, state.moves, best, setBest, vibrate]);

  const restart = useCallback(() => {
    setState(deal());
    setSelected(null);
    setWinOpen(false);
    setScoreIsNew(false);
    wonRef.current = false;
  }, []);

  const trySelectOrMove = useCallback(
    (target: MoveTarget) => {
      if (!selected) return false;
      const next = makeMove(state, selected, target);
      if (next) {
        setState(next);
        setSelected(null);
        vibrate(15);
        return true;
      }
      return false;
    },
    [selected, state, vibrate],
  );

  const handleSource = (src: MoveSource) => {
    const card =
      src.type === 'free'
        ? (state.freeCells[src.index] ?? null)
        : (state.tableau[src.index]![state.tableau[src.index]!.length - 1] ?? null);
    if (!card) {
      // try moving selected to empty tableau column
      if (src.type === 'tableau' && selected)
        trySelectOrMove({ type: 'tableau', index: src.index });
      return;
    }
    if (selected && selected.type === src.type && selected.index === src.index) {
      setSelected(null);
      return;
    }
    if (selected) {
      const target: MoveTarget = { type: src.type, index: src.index };
      if (trySelectOrMove(target)) return;
    }
    setSelected(src);
  };

  const handleFoundation = (idx: number) => {
    if (!selected) return;
    trySelectOrMove({ type: 'foundation', index: idx });
  };

  const sendToFoundation = () => {
    if (!selected) return;
    const next = autoMoveToFoundation(state, selected);
    if (next) {
      setState(next);
      setSelected(null);
      vibrate(20);
    } else {
      vibrate([40, 20, 40]);
    }
  };

  const handleUndo = () => {
    setState((s) => undo(s));
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center gap-2 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-xl grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
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

      <div className="grid w-full max-w-xl grid-cols-8 gap-1">
        {/* free cells */}
        {state.freeCells.map((c, i) => (
          <CardView
            key={`free-${i}`}
            card={c}
            small
            selected={selected?.type === 'free' && selected.index === i}
            onClick={() => handleSource({ type: 'free', index: i })}
            className="aspect-[3/4]"
          />
        ))}
        {/* foundations */}
        {SUITS.map((s, i) => {
          const top = state.foundations[i]![state.foundations[i]!.length - 1] ?? null;
          return (
            <button
              key={`f-${i}`}
              type="button"
              onClick={() => handleFoundation(i)}
              aria-label={`Foundation ${s}`}
              className={`flex aspect-[3/4] items-center justify-center rounded-md border-2 bg-amber-50 text-base font-bold dark:bg-amber-100 ${
                top ? '' : 'border-dashed text-amber-700'
              } ${top?.red ? 'text-red-600' : 'text-slate-900'} border-amber-300`}
            >
              {top ? `${rankLabel(top.rank)}${s}` : s}
            </button>
          );
        })}
      </div>

      <div className="grid w-full max-w-xl grid-cols-8 gap-1">
        {state.tableau.map((stack, ci) => {
          const isSelected = selected?.type === 'tableau' && selected.index === ci;
          return (
            <div key={ci} className="flex flex-col gap-0.5">
              {stack.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleSource({ type: 'tableau', index: ci })}
                  aria-label={`Leere Spalte ${ci + 1}`}
                  className="flex aspect-[3/4] items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-700"
                >
                  ·
                </button>
              ) : (
                stack.map((card, ri) => {
                  const isTop = ri === stack.length - 1;
                  return (
                    <CardView
                      key={`${ci}-${ri}`}
                      card={card}
                      small
                      selected={isSelected && isTop}
                      onClick={() => isTop && handleSource({ type: 'tableau', index: ci })}
                      className={`aspect-[3/4] ${!isTop ? 'opacity-75 pointer-events-none' : ''}`}
                    />
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid w-full max-w-xl grid-cols-3 gap-2">
        <button
          type="button"
          onClick={sendToFoundation}
          disabled={!selected || !canMoveToFoundation(state, selected)}
          className="min-h-12 rounded-xl bg-amber-500 px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          ⬆ Foundation
        </button>
        <button
          type="button"
          onClick={handleUndo}
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          ↩ Rückgängig
        </button>
        <Button variant="primary" onClick={restart}>
          Neu mischen
        </Button>
      </div>

      <p className="max-w-xl text-center text-xs text-slate-500">
        Tippe eine Karte zum Auswählen, dann ein Ziel. Tableau: absteigend in Wechselfarbe.
        Foundation: Ass bis König pro Farbe.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gewonnen!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            👑
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            FreeCell in {state.moves} Zügen gelöst.
          </p>
          <Button variant="primary" block onClick={restart}>
            Neue Partie
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function canMoveToFoundation(state: FreecellState, src: MoveSource | null): boolean {
  if (!src) return false;
  const card =
    src.type === 'free'
      ? (state.freeCells[src.index] ?? null)
      : (state.tableau[src.index]![state.tableau[src.index]!.length - 1] ?? null);
  if (!card) return false;
  return canPlaceOnFoundation(state, card) !== null;
}
