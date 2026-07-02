import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  cellOwner,
  colorHex,
  createState,
  endpointFor,
  extendPath,
  type FlowState,
  grabPath,
  isSolved,
  LEVELS,
  startPath,
} from '../lib/flow';
import { FlowBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

export default function FlowGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.FLOW_BEST,
    FlowBestSchema,
    {},
  );
  const [state, setState] = useState<FlowState>(() => createState(LEVELS[0]!));
  const [drawing, setDrawing] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const wonRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  const solved = useMemo(() => isSolved(state), [state]);

  useEffect(() => {
    if (solved && !wonRef.current) {
      wonRef.current = true;
      const key = String(levelIdx);
      const prev = bestMap[key];
      if (prev === undefined || moves < prev) {
        setBestMap({ ...bestMap, [key]: moves });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Level gelöst in ${moves} Zügen`);
      vibrate([40, 30, 60]);
      sfx.win();
    }
  }, [solved, moves, levelIdx, bestMap, setBestMap, vibrate, sfx]);

  const restart = useCallback(
    (idx: number = levelIdx) => {
      const lvl = LEVELS[idx % LEVELS.length]!;
      setState(createState(lvl));
      setMoves(0);
      setDrawing(null);
      setWinOpen(false);
      setScoreIsNew(false);
      wonRef.current = false;
    },
    [levelIdx],
  );

  const changeLevel = (idx: number) => {
    setLevelIdx(idx);
    restart(idx);
  };

  const startCell = (idx: number) => {
    const color = endpointFor(state.level, idx);
    if (color === null) {
      // continue an existing path if owned — drawing resumes at the grabbed cell
      const owner = cellOwner(state, idx);
      if (owner === null) return;
      setState((s) => grabPath(s, owner, idx));
      setDrawing(owner);
      return;
    }
    setState((s) => startPath(s, color, idx));
    setDrawing(color);
    vibrate(8);
  };

  const enterCell = useCallback(
    (idx: number) => {
      if (drawing === null) return;
      setState((s) => {
        const next = extendPath(s, drawing, idx);
        if (next) {
          setMoves((m) => m + 1);
          return next;
        }
        return s;
      });
    },
    [drawing],
  );

  // On touch, the pointerdown target implicitly captures the pointer, so
  // pointerenter never fires on the cells under the moving finger. Resolve
  // the hovered cell from the pointer position instead — works for mouse too.
  const onGridPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drawing === null) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest('[data-cell-idx]');
      if (cell instanceof HTMLElement && cell.dataset.cellIdx !== undefined) {
        enterCell(Number(cell.dataset.cellIdx));
      }
    },
    [drawing, enterCell],
  );

  // End the stroke wherever the pointer is released — also outside the grid.
  useEffect(() => {
    if (drawing === null) return;
    const end = () => setDrawing(null);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [drawing]);

  const size = state.level.size;
  const cells: {
    idx: number;
    bg: string | null;
    isEndpoint: boolean;
    endpointColor: number | null;
    pathColor: number | null;
  }[] = [];
  for (let i = 0; i < size * size; i++) {
    const ep = endpointFor(state.level, i);
    const owner = cellOwner(state, i);
    cells.push({
      idx: i,
      bg: ep !== null ? colorHex(ep) : owner !== null ? colorHex(owner) : null,
      isEndpoint: ep !== null,
      endpointColor: ep,
      pathColor: owner,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Level:</span>
          <select
            value={levelIdx}
            onChange={(e) => changeLevel(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {LEVELS.map((lvl, i) => (
              <option key={i} value={i}>
                Level {i + 1} ({lvl.size}×{lvl.size})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{moves}</span>
        </div>
        <div className="text-right">
          {bestMap[String(levelIdx)] !== undefined ? (
            <>
              Best: <span className="font-semibold tabular-nums">{bestMap[String(levelIdx)]}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="grid fit-box select-none gap-1 rounded-2xl bg-slate-900 p-2 touch-none dark:bg-slate-950"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          onPointerMove={onGridPointerMove}
          role="grid"
          aria-label="Verbinden-Spielfeld"
        >
          {cells.map((c) => (
            <button
              key={c.idx}
              type="button"
              data-cell-idx={c.idx}
              onPointerDown={(e) => {
                e.preventDefault();
                startCell(c.idx);
              }}
              aria-label={
                c.isEndpoint
                  ? `Endpunkt Farbe ${(c.endpointColor ?? 0) + 1}`
                  : c.pathColor !== null
                    ? `Weg Farbe ${c.pathColor + 1}`
                    : 'Leere Zelle'
              }
              className="relative flex aspect-square items-center justify-center rounded-md bg-slate-800 transition-colors"
            >
              {c.isEndpoint && (
                <span
                  className="block h-3/5 w-3/5 rounded-full"
                  style={{ background: colorHex(c.endpointColor!) }}
                />
              )}
              {!c.isEndpoint && c.pathColor !== null && (
                <span
                  className="block h-1/2 w-1/2 rounded-sm opacity-70"
                  style={{ background: colorHex(c.pathColor) }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" block className="max-w-md" onClick={() => restart()}>
        Level neustarten
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Halte einen farbigen Punkt gedrückt und ziehe zur gleichen Farbe. Linien dürfen sich nicht
        kreuzen, alle Felder sollten am Ende belegt sein.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🔗
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Level in {moves} Zügen gelöst.
          </p>
          <Button
            variant="primary"
            block
            onClick={() => changeLevel((levelIdx + 1) % LEVELS.length)}
          >
            Nächstes Level
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
