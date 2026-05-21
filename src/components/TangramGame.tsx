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
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const VIEW_W = 600;
const VIEW_H = 500;
const UNIT = 40;

interface PieceDef {
  id: number;
  name: string;
  color: string;
  points: [number, number][];
}

// 7 classic tangram pieces, sized so all 7 together fill a 4×4-unit (160×160 px) square.
const PIECE_DEFS: PieceDef[] = [
  {
    id: 0,
    name: 'Großes Dreieck rot',
    color: '#ef4444',
    points: [
      [0, 0],
      [4 * UNIT, 0],
      [2 * UNIT, 2 * UNIT],
    ],
  },
  {
    id: 1,
    name: 'Großes Dreieck blau',
    color: '#3b82f6',
    points: [
      [0, 0],
      [4 * UNIT, 0],
      [2 * UNIT, 2 * UNIT],
    ],
  },
  {
    id: 2,
    name: 'Mittleres Dreieck grün',
    color: '#10b981',
    points: [
      [0, 0],
      [2 * UNIT, 0],
      [0, 2 * UNIT],
    ],
  },
  {
    id: 3,
    name: 'Kleines Dreieck gelb',
    color: '#f59e0b',
    points: [
      [0, 0],
      [2 * UNIT, 0],
      [UNIT, UNIT],
    ],
  },
  {
    id: 4,
    name: 'Kleines Dreieck violett',
    color: '#a855f7',
    points: [
      [0, 0],
      [2 * UNIT, 0],
      [UNIT, UNIT],
    ],
  },
  {
    id: 5,
    name: 'Quadrat türkis',
    color: '#06b6d4',
    points: [
      [UNIT, 0],
      [2 * UNIT, UNIT],
      [UNIT, 2 * UNIT],
      [0, UNIT],
    ],
  },
  {
    id: 6,
    name: 'Parallelogramm pink',
    color: '#ec4899',
    points: [
      [0, 0],
      [2 * UNIT, 0],
      [3 * UNIT, UNIT],
      [UNIT, UNIT],
    ],
  },
];

interface Puzzle {
  name: string;
  // Polygon in unit space (4×4 = total piece area). Auto-scaled to fit.
  poly: [number, number][];
}

const PUZZLES: Puzzle[] = [
  {
    name: 'Quadrat',
    poly: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
  },
  {
    name: 'Dreieck',
    poly: [
      [0, 4],
      [4, 0],
      [8, 4],
    ],
  },
  {
    name: 'Rechteck',
    poly: [
      [0, 0],
      [8, 0],
      [8, 2],
      [0, 2],
    ],
  },
  {
    name: 'Haus',
    poly: [
      [0, 4],
      [0, 1],
      [3, 0],
      [6, 1],
      [6, 4],
    ],
  },
  {
    name: 'Boot',
    poly: [
      [0, 3],
      [2, 0],
      [6, 0],
      [8, 3],
    ],
  },
];

interface PieceState {
  id: number;
  x: number;
  y: number;
  rotation: number; // radians
}

function initialPieces(): PieceState[] {
  // Arrange pieces in a tray along the bottom of the canvas.
  return PIECE_DEFS.map((p, i) => ({
    id: p.id,
    x: 20 + i * 80,
    y: 380,
    rotation: 0,
  }));
}

function centroidOfPoints(points: [number, number][]): [number, number] {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function rotatedPiece(def: PieceDef, state: PieceState): [number, number][] {
  const [cx, cy] = centroidOfPoints(def.points);
  const cos = Math.cos(state.rotation);
  const sin = Math.sin(state.rotation);
  return def.points.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    return [state.x + cx + dx * cos - dy * sin, state.y + cy + dx * sin + dy * cos];
  });
}

function polygonArea(poly: [number, number][]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j]![0] * poly[i]![1] - poly[i]![0] * poly[j]![1];
  }
  return Math.abs(a) / 2;
}

function fitPuzzlePoints(puzzle: Puzzle): [number, number][] {
  // Total piece area = 16 unit² (a 4×4 square at S=40 → 160×160 px).
  // Auto-scale each puzzle polygon so its area equals 16 unit² when drawn at S=40.
  const rawArea = polygonArea(puzzle.poly);
  const targetArea = 16;
  const scale = UNIT * Math.sqrt(targetArea / rawArea);
  const cx = puzzle.poly.reduce((a, p) => a + p[0], 0) / puzzle.poly.length;
  const cy = puzzle.poly.reduce((a, p) => a + p[1], 0) / puzzle.poly.length;
  // Center the polygon in the upper-middle of the canvas.
  const targetCx = VIEW_W / 2;
  const targetCy = 170;
  return puzzle.poly.map(([x, y]) => [(x - cx) * scale + targetCx, (y - cy) * scale + targetCy]);
}

function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const TAP_THRESHOLD_PX = 8;
const TAP_THRESHOLD_MS = 250;
const ROTATION_STEP = Math.PI / 4;

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
    // Reset internal layout when puzzle changes via the dropdown handler is sufficient,
    // but also reset rotation-on-mount to keep dev/test consistent.
  }, [puzzle]);

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
