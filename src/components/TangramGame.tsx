import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { TangramLevelSchema } from '../lib/persistedSchemas';
import {
  fitPuzzlePoints,
  initialPieces,
  PIECE_DEFS,
  type PieceState,
  PUZZLES,
  pointInPolygon,
  rotatedPiece,
  TANGRAM_ROTATION_STEP,
  TANGRAM_UNIT,
  TANGRAM_VIEW_H,
  TANGRAM_VIEW_W,
} from '../lib/tangram';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const VIEW_W = TANGRAM_VIEW_W;
const VIEW_H = TANGRAM_VIEW_H;
const UNIT = TANGRAM_UNIT;

const TAP_THRESHOLD_PX = 8;
const TAP_THRESHOLD_MS = 250;
const ROTATION_STEP = TANGRAM_ROTATION_STEP;

export default function TangramGame() {
  const [levelIdx, setLevelIdx] = useLocalStorage<number>(
    STORAGE_KEYS.TANGRAM_LEVEL,
    TangramLevelSchema,
    0,
  );
  const [pieces, setPieces] = useState<PieceState[]>(initialPieces);
  const [order, setOrder] = useState<number[]>(() => PIECE_DEFS.map((p) => p.id));
  const [showSolution, setShowSolution] = useState(false);
  const [announce, setAnnounce] = useState('');
  const { vibrate } = useVibration();
  const sfx = useGameSfx();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    pieceId: number;
    pointerId: number;
    startSvgX: number;
    startSvgY: number;
    pieceStartX: number;
    pieceStartY: number;
    startTime: number;
    moved: boolean;
  } | null>(null);

  const puzzle = PUZZLES[levelIdx % PUZZLES.length]!;
  const puzzlePoints = fitPuzzlePoints(puzzle);

  const resetPieces = useCallback(() => {
    setPieces(initialPieces());
    setOrder(PIECE_DEFS.map((p) => p.id));
    setAnnounce('Teile zurückgesetzt');
  }, []);

  const nextPuzzle = useCallback(() => {
    const idx = (levelIdx + 1) % PUZZLES.length;
    setLevelIdx(idx);
    setPieces(initialPieces());
    setOrder(PIECE_DEFS.map((p) => p.id));
    setShowSolution(false);
    setAnnounce(`Nächste Form: ${PUZZLES[idx]!.name}`);
  }, [levelIdx, setLevelIdx]);

  const svgPointFromEvent = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    return { x, y };
  }, []);

  const findPieceAt = useCallback(
    (svgX: number, svgY: number): PieceState | null => {
      // Topmost first (last in render order = drawn last = on top)
      for (let i = order.length - 1; i >= 0; i--) {
        const id = order[i]!;
        const state = pieces.find((p) => p.id === id);
        if (!state) continue;
        const def = PIECE_DEFS[id]!;
        const transformed = rotatedPiece(def, state);
        if (pointInPolygon(svgX, svgY, transformed)) return state;
      }
      return null;
    },
    [order, pieces],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const pt = svgPointFromEvent(e);
      if (!pt) return;
      const hit = findPieceAt(pt.x, pt.y);
      if (!hit) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pieceId: hit.id,
        pointerId: e.pointerId,
        startSvgX: pt.x,
        startSvgY: pt.y,
        pieceStartX: hit.x,
        pieceStartY: hit.y,
        startTime: performance.now(),
        moved: false,
      };
      // Bring to front
      setOrder((prev) => [...prev.filter((id) => id !== hit.id), hit.id]);
    },
    [findPieceAt, svgPointFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const pt = svgPointFromEvent(e);
      if (!pt) return;
      const dx = pt.x - drag.startSvgX;
      const dy = pt.y - drag.startSvgY;
      if (!drag.moved && Math.hypot(dx, dy) > TAP_THRESHOLD_PX) {
        drag.moved = true;
      }
      if (drag.moved) {
        const newX = drag.pieceStartX + dx;
        const newY = drag.pieceStartY + dy;
        setPieces((prev) =>
          prev.map((p) => (p.id === drag.pieceId ? { ...p, x: newX, y: newY } : p)),
        );
      }
    },
    [svgPointFromEvent],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const elapsed = performance.now() - drag.startTime;
      if (!drag.moved && elapsed < TAP_THRESHOLD_MS) {
        // Tap → rotate by 45°
        setPieces((prev) =>
          prev.map((p) =>
            p.id === drag.pieceId ? { ...p, rotation: p.rotation + ROTATION_STEP } : p,
          ),
        );
        vibrate(12);
      } else if (drag.moved) {
        vibrate(8);
      }
      dragRef.current = null;
    },
    [vibrate],
  );

  const rotateSelected = useCallback(
    (pieceId: number) => {
      setPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, rotation: p.rotation + ROTATION_STEP } : p)),
      );
      setOrder((prev) => [...prev.filter((id) => id !== pieceId), pieceId]);
      vibrate(12);
    },
    [vibrate],
  );

  useEffect(() => {
    if (showSolution) sfx.pop();
  }, [showSolution, sfx]);

  const puzzlePathD =
    puzzlePoints.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ' Z';

  // For "Lösung zeigen" overlay: draw the pieces arranged as the canonical square
  // (target = top-left at (220, 90) so the 160x160 square is centered horizontally).
  const SOLUTION_OFFSET_X = (VIEW_W - 4 * UNIT) / 2;
  const SOLUTION_OFFSET_Y = 90;

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Form:</span>
          <select
            value={levelIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setLevelIdx(idx);
              setPieces(initialPieces());
              setOrder(PIECE_DEFS.map((p) => p.id));
              setShowSolution(false);
              setAnnounce(`Form: ${PUZZLES[idx]!.name}`);
            }}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {PUZZLES.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full touch-none select-none"
          style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
          role="application"
          aria-label="Tangram-Spielfläche"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <path
            d={puzzlePathD}
            fill="rgba(148, 163, 184, 0.18)"
            stroke="rgba(148, 163, 184, 0.55)"
            strokeWidth={2}
          />
          {showSolution &&
            PIECE_DEFS.map((def) => (
              <path
                key={`sol-${def.id}`}
                d={
                  def.points
                    .map(
                      ([x, y], i) =>
                        `${i === 0 ? 'M' : 'L'} ${SOLUTION_OFFSET_X + x} ${SOLUTION_OFFSET_Y + y}`,
                    )
                    .join(' ') + ' Z'
                }
                fill={def.color}
                opacity={0.35}
                stroke="white"
                strokeWidth={1}
              />
            ))}
          {order.map((id) => {
            const def = PIECE_DEFS[id]!;
            const state = pieces.find((p) => p.id === id);
            if (!state) return null;
            const points = rotatedPiece(def, state)
              .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
              .join(' ');
            return (
              <polygon
                key={id}
                points={points}
                fill={def.color}
                stroke="#0f172a"
                strokeWidth={1.5}
                opacity={0.92}
              >
                <title>{def.name}</title>
              </polygon>
            );
          })}
        </svg>
        <p className="absolute right-3 top-3 rounded bg-white/80 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
          {puzzle.name}
        </p>
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Ziehe die Teile auf die Silhouette. Antippen ohne Ziehen dreht ein Teil um 45°. Nutze die
        Knöpfe für Tastatur-Rotation.
      </p>

      <div
        className="grid w-full max-w-md grid-cols-7 gap-1.5"
        role="group"
        aria-label="Teil drehen"
      >
        {PIECE_DEFS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => rotateSelected(p.id)}
            aria-label={`${p.name} drehen`}
            className="flex aspect-square min-h-11 items-center justify-center rounded-lg border-2 border-transparent text-sm font-medium text-white"
            style={{ backgroundColor: p.color }}
          >
            ⟳
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          aria-pressed={showSolution}
          className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-medium ${
            showSolution
              ? 'bg-amber-500 text-white'
              : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          {showSolution ? 'Lösung an' : 'Lösung zeigen'}
        </button>
        <button
          type="button"
          onClick={resetPieces}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Zurücksetzen
        </button>
        <Button variant="primary" className="flex-1" onClick={nextPuzzle}>
          Nächste Form
        </Button>
      </div>
    </div>
  );
}
