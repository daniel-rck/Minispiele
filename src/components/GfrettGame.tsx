import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  type Block,
  type Cell,
  type Color,
  expandSidebar,
  type GameState,
  LEVELS,
  loadLevel,
  maxSlide,
  shuffle,
  slide,
  undo,
} from '../lib/gfrett';
import { GfrettBestSchema, GfrettLevelSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const COLOR_LABEL: Record<Color | 'joker', string> = {
  red: 'roter',
  blue: 'blauer',
  green: 'grüner',
  yellow: 'gelber',
  purple: 'lila',
  orange: 'oranger',
  cyan: 'cyaner',
  joker: 'bunter',
};

const COLOR_CLASS: Record<Color | 'joker', string> = {
  red: 'bg-red-500 dark:bg-red-600',
  blue: 'bg-blue-500 dark:bg-blue-600',
  green: 'bg-emerald-500 dark:bg-emerald-600',
  yellow: 'bg-amber-400 dark:bg-amber-500',
  purple: 'bg-purple-500 dark:bg-purple-600',
  orange: 'bg-orange-500 dark:bg-orange-600',
  cyan: 'bg-cyan-500 dark:bg-cyan-600',
  joker:
    'bg-gradient-to-br from-pink-400 via-amber-300 to-cyan-400 dark:from-pink-500 dark:via-amber-400 dark:to-cyan-500',
};

const DIR_ARROW_GLYPH: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const EXIT_GLYPH: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
};

interface DragState {
  blockId: string;
  axis: 'horizontal' | 'vertical';
  startX: number;
  startY: number;
  cellSizePx: number;
  minOffset: number;
  maxOffset: number;
  offset: number;
  pointerId: number;
}

export default function GfrettGame() {
  const [levelIdx, setLevelIdx] = useLocalStorage<number>(
    STORAGE_KEYS.GFRETT_LEVEL,
    GfrettLevelSchema,
    0,
  );
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.GFRETT_BEST,
    GfrettBestSchema,
    {},
  );
  const [state, setState] = useState<GameState>(() => loadLevel(levelIdx));
  const [winOpen, setWinOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [drag, setDrag] = useState<DragState | null>(null);
  const wonRef = useRef(false);
  const lostRef = useRef(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const focusedBlockRef = useRef<string | null>(null);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  // React to win / lose transitions.
  useEffect(() => {
    if (state.status === 'won' && !wonRef.current) {
      wonRef.current = true;
      lostRef.current = false;
      const key = String(state.level);
      const prev = bestMap[key];
      if (prev === undefined || state.moves < prev) {
        setBestMap({ ...bestMap, [key]: state.moves });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Geschafft! Level ${state.level + 1} in ${state.moves} Zügen.`);
      vibrate([40, 30, 60]);
      sfx.win();
    }
    if ((state.status === 'lost' || state.status === 'gridlock') && !lostRef.current) {
      lostRef.current = true;
      wonRef.current = false;
      setLoseOpen(true);
      setAnnounce(
        state.status === 'gridlock'
          ? 'Match-Leiste voll — Gridlock.'
          : `Zuglimit erreicht (${state.moveLimit}).`,
      );
      vibrate([80, 40, 80]);
      sfx.lose();
    }
  }, [state.status, state.moves, state.level, state.moveLimit, bestMap, setBestMap, vibrate, sfx]);

  const restart = useCallback(
    (idx: number = levelIdx) => {
      setState(loadLevel(idx));
      setWinOpen(false);
      setLoseOpen(false);
      setScoreIsNew(false);
      wonRef.current = false;
      lostRef.current = false;
    },
    [levelIdx],
  );

  const changeLevel = useCallback(
    (n: number) => {
      setLevelIdx(n);
      restart(n);
    },
    [restart, setLevelIdx],
  );

  const nextLevel = useCallback(() => {
    const n = (levelIdx + 1) % LEVELS.length;
    changeLevel(n);
  }, [levelIdx, changeLevel]);

  const doSlide = useCallback(
    (blockId: string, steps: number) => {
      if (steps === 0) return;
      setState((s) => {
        const next = slide(s, blockId, steps);
        if (next !== s) vibrate(10);
        return next;
      });
    },
    [vibrate],
  );

  // Keyboard fallback: move a focused block by 1 along its axis with arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'z' || e.key === 'Z' || e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        setState((s) => undo(s));
        return;
      }
      const focused = focusedBlockRef.current;
      if (!focused) return;
      const block = state.blocks.find((b) => b.id === focused);
      if (!block || block.locked) return;
      let steps = 0;
      if (block.orientation === 'horizontal') {
        if (e.key === 'ArrowLeft') steps = -1;
        else if (e.key === 'ArrowRight') steps = 1;
      } else {
        if (e.key === 'ArrowUp') steps = -1;
        else if (e.key === 'ArrowDown') steps = 1;
      }
      if (steps !== 0) {
        e.preventDefault();
        doSlide(block.id, steps);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.blocks, doSlide]);

  // Pointer drag handlers (axis-locked, clamped to maxSlide).
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, blockId: string) => {
      const block = state.blocks.find((b) => b.id === blockId);
      if (!block || block.locked) return;
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const cellSizePx = rect.width / state.grid.cols;
      const minOffset = -maxSlide(state, blockId, -1);
      const maxOffset = maxSlide(state, blockId, 1);
      if (minOffset === 0 && maxOffset === 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      vibrate(8);
      setDrag({
        blockId,
        axis: block.orientation,
        startX: e.clientX,
        startY: e.clientY,
        cellSizePx,
        minOffset,
        maxOffset,
        offset: 0,
        pointerId: e.pointerId,
      });
    },
    [state, vibrate],
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setDrag((cur) => {
      if (!cur || cur.pointerId !== e.pointerId) return cur;
      const dx = e.clientX - cur.startX;
      const dy = e.clientY - cur.startY;
      const delta = cur.axis === 'horizontal' ? dx : dy;
      const raw = delta / cur.cellSizePx;
      const clamped = Math.max(cur.minOffset, Math.min(cur.maxOffset, raw));
      if (clamped === cur.offset) return cur;
      return { ...cur, offset: clamped };
    });
  }, []);

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      setDrag((cur) => {
        if (!cur || cur.pointerId !== e.pointerId) return cur;
        const steps = Math.round(cur.offset);
        if (steps !== 0) doSlide(cur.blockId, steps);
        return null;
      });
    },
    [doSlide],
  );

  const handlePointerCancel = handlePointerUp;

  const best = bestMap[String(state.level)];
  const filledSlots = state.matchArea.slots.filter((s) => s !== null).length;
  const movesLeft = state.moveLimit !== null ? state.moveLimit - state.moves : null;

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Level:</span>
          <select
            value={levelIdx}
            onChange={(e) => changeLevel(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {LEVELS.map((_, i) => (
              <option key={i} value={i}>
                Level {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div className="text-center">
          {movesLeft !== null ? (
            <>
              Übrig:{' '}
              <span
                className={`font-semibold tabular-nums ${movesLeft <= 2 ? 'text-amber-600 dark:text-amber-400' : ''}`}
              >
                {Math.max(0, movesLeft)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
        <div className="text-right">
          {best !== undefined ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <Board
        state={state}
        drag={drag}
        boardRef={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onFocusBlock={(id) => {
          focusedBlockRef.current = id;
        }}
      />

      <MatchAreaView slots={state.matchArea.slots} capacity={state.matchArea.capacity} />

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Belegt: {filledSlots} / {state.matchArea.capacity}
      </div>

      <PowerUpBar
        powerUps={state.powerUps}
        onUndo={() => setState((s) => undo(s))}
        onShuffle={() => setState((s) => shuffle(s))}
        onExpand={() => setState((s) => expandSidebar(s))}
        canUndo={state.history.length > 0 && state.powerUps.undo > 0}
      />

      <Button variant="secondary" block className="max-w-md" onClick={() => restart()}>
        Level neustarten
      </Button>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Level gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🧩
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Level {state.level + 1} in {state.moves} Zügen geschafft.
          </p>
          <Button variant="primary" block onClick={nextLevel}>
            Nächstes Level
          </Button>
        </div>
      </Sheet>

      <Sheet open={loseOpen} onClose={() => setLoseOpen(false)} title="Nicht geschafft">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🚧
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {state.status === 'gridlock'
              ? 'Die Match-Leiste ist voll und kein Dreier mehr möglich.'
              : 'Zuglimit erreicht.'}
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal versuchen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

interface BoardProps {
  state: GameState;
  drag: DragState | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>, blockId: string) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onFocusBlock: (id: string | null) => void;
}

function Board({
  state,
  drag,
  boardRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onFocusBlock,
}: BoardProps) {
  const { grid, blocks } = state;
  return (
    <div
      ref={boardRef}
      className="grid w-full max-w-md touch-none select-none rounded-2xl bg-slate-800 p-1 dark:bg-slate-900"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
        aspectRatio: `${grid.cols} / ${grid.rows}`,
      }}
      role="application"
      aria-label="Gfrett-Spielfeld"
    >
      {grid.cells.map((cell, idx) => (
        <CellView key={idx} cell={cell} />
      ))}
      {blocks.map((b) => (
        <BlockView
          key={b.id}
          block={b}
          cols={grid.cols}
          rows={grid.rows}
          dragOffset={drag?.blockId === b.id ? drag.offset : 0}
          dragging={drag?.blockId === b.id}
          cellSizePx={drag?.cellSizePx ?? 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onFocus={() => onFocusBlock(b.id)}
          onBlur={() => onFocusBlock(null)}
        />
      ))}
    </div>
  );
}

function CellView({ cell }: { cell: Cell }) {
  let cls = 'bg-slate-700/40 dark:bg-slate-800/60';
  let glyph = '';
  if (cell.kind === 'wall') {
    cls = 'bg-slate-700 dark:bg-slate-950';
  } else if (cell.kind === 'exit') {
    cls = 'bg-emerald-700/50 dark:bg-emerald-900/40';
    glyph = EXIT_GLYPH[cell.dir];
  } else if (cell.kind === 'arrow') {
    cls = 'bg-slate-600/50 dark:bg-slate-700/50';
    glyph = DIR_ARROW_GLYPH[cell.out];
  }
  return (
    <div
      className={`flex items-center justify-center text-base font-bold text-white/80 ${cls}`}
      style={{ aspectRatio: '1 / 1' }}
      aria-hidden
    >
      <span>{glyph}</span>
    </div>
  );
}

interface BlockViewProps {
  block: Block;
  cols: number;
  rows: number;
  dragOffset: number;
  dragging: boolean;
  cellSizePx: number;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>, blockId: string) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

function BlockView({
  block,
  dragOffset,
  dragging,
  cellSizePx,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onFocus,
  onBlur,
}: BlockViewProps) {
  const spanH = block.orientation === 'horizontal' ? block.length : 1;
  const spanV = block.orientation === 'vertical' ? block.length : 1;
  const dx = block.orientation === 'horizontal' ? dragOffset * cellSizePx : 0;
  const dy = block.orientation === 'vertical' ? dragOffset * cellSizePx : 0;
  const label = `${COLOR_LABEL[block.color]} ${
    block.orientation === 'horizontal' ? 'waagerechter' : 'senkrechter'
  } Block, Länge ${block.length}${block.locked ? ', gesperrt' : ''}`;

  const style: CSSProperties = {
    gridRowStart: block.anchor.r + 1,
    gridRowEnd: block.anchor.r + 1 + spanV,
    gridColumnStart: block.anchor.c + 1,
    gridColumnEnd: block.anchor.c + 1 + spanH,
    transform: dx !== 0 || dy !== 0 ? `translate(${dx}px, ${dy}px)` : undefined,
    transition: dragging ? 'none' : 'transform 120ms ease-out',
    zIndex: dragging ? 30 : 10,
    touchAction: 'none',
  };

  return (
    <button
      type="button"
      className={`m-0.5 inline-flex items-center justify-center rounded-xl border-2 border-black/20 text-base font-bold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${COLOR_CLASS[block.color]} ${block.locked ? 'opacity-90' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={style}
      onPointerDown={(e) => onPointerDown(e, block.id)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={block.locked}
      aria-label={label}
      data-block-id={block.id}
    >
      <span aria-hidden>{block.locked ? '🔒' : block.color === 'joker' ? '★' : ''}</span>
    </button>
  );
}

function MatchAreaView({
  slots,
  capacity,
}: {
  slots: ({ color: Color | 'joker' } | null)[];
  capacity: number;
}) {
  // Show `capacity` boxes; only first `slots.length` are valid.
  const rendered = useMemo(() => {
    const arr: ({ color: Color | 'joker' } | null)[] = new Array(capacity).fill(null);
    for (let i = 0; i < Math.min(capacity, slots.length); i++) arr[i] = slots[i] ?? null;
    return arr;
  }, [slots, capacity]);
  return (
    <div
      className="flex w-full max-w-md flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-300 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800"
      role="list"
      aria-label="Match-Leiste"
    >
      {rendered.map((slot, i) => (
        <div
          key={i}
          role="listitem"
          className={`flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-sm font-bold text-white dark:border-slate-600 ${slot ? COLOR_CLASS[slot.color] : 'bg-white dark:bg-slate-900'}`}
          aria-label={
            slot ? `${COLOR_LABEL[slot.color]} Block in Slot ${i + 1}` : `leerer Slot ${i + 1}`
          }
        >
          {slot && slot.color === 'joker' ? <span aria-hidden>★</span> : null}
        </div>
      ))}
    </div>
  );
}

interface PowerUpBarProps {
  powerUps: { undo: number; shuffle: number; expand: number };
  canUndo: boolean;
  onUndo: () => void;
  onShuffle: () => void;
  onExpand: () => void;
}

function PowerUpBar({ powerUps, canUndo, onUndo, onShuffle, onExpand }: PowerUpBarProps) {
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-2" role="group" aria-label="Hilfsmittel">
      <PowerUpButton
        label="Rückgängig"
        glyph="↩"
        count={powerUps.undo}
        disabled={!canUndo}
        onClick={onUndo}
      />
      <PowerUpButton
        label="Mischen"
        glyph="🔀"
        count={powerUps.shuffle}
        disabled={powerUps.shuffle === 0}
        onClick={onShuffle}
      />
      <PowerUpButton
        label="Leiste +1"
        glyph="➕"
        count={powerUps.expand}
        disabled={powerUps.expand === 0}
        onClick={onExpand}
      />
    </div>
  );
}

function PowerUpButton({
  label,
  glyph,
  count,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  count: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100"
      aria-label={`${label}, ${count} übrig`}
    >
      <span aria-hidden className="text-base">
        {glyph}
      </span>
      <span>{label}</span>
      <span
        aria-hidden
        className="absolute top-0.5 right-1 rounded-full bg-slate-700 px-1.5 text-xs text-white dark:bg-slate-600"
      >
        {count}
      </span>
    </button>
  );
}
