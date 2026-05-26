export const TANGRAM_VIEW_W = 600;
export const TANGRAM_VIEW_H = 500;
export const TANGRAM_UNIT = 40;
export const TANGRAM_ROTATION_STEP = Math.PI / 4;

export interface PieceDef {
  id: number;
  name: string;
  color: string;
  points: [number, number][];
}

const U = TANGRAM_UNIT;

// 7 classic tangram pieces, sized so all 7 together fill a 4×4-unit (160×160 px) square.
export const PIECE_DEFS: PieceDef[] = [
  {
    id: 0,
    name: 'Großes Dreieck rot',
    color: '#ef4444',
    points: [
      [0, 0],
      [4 * U, 0],
      [2 * U, 2 * U],
    ],
  },
  {
    id: 1,
    name: 'Großes Dreieck blau',
    color: '#3b82f6',
    points: [
      [0, 0],
      [4 * U, 0],
      [2 * U, 2 * U],
    ],
  },
  {
    id: 2,
    name: 'Mittleres Dreieck grün',
    color: '#10b981',
    points: [
      [0, 0],
      [2 * U, 0],
      [0, 2 * U],
    ],
  },
  {
    id: 3,
    name: 'Kleines Dreieck gelb',
    color: '#f59e0b',
    points: [
      [0, 0],
      [2 * U, 0],
      [U, U],
    ],
  },
  {
    id: 4,
    name: 'Kleines Dreieck violett',
    color: '#a855f7',
    points: [
      [0, 0],
      [2 * U, 0],
      [U, U],
    ],
  },
  {
    id: 5,
    name: 'Quadrat türkis',
    color: '#06b6d4',
    points: [
      [U, 0],
      [2 * U, U],
      [U, 2 * U],
      [0, U],
    ],
  },
  {
    id: 6,
    name: 'Parallelogramm pink',
    color: '#ec4899',
    points: [
      [0, 0],
      [2 * U, 0],
      [3 * U, U],
      [U, U],
    ],
  },
];

export interface Puzzle {
  name: string;
  // Polygon in unit space (4×4 = total piece area). Auto-scaled to fit.
  poly: [number, number][];
}

export const PUZZLES: Puzzle[] = [
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

export interface PieceState {
  id: number;
  x: number;
  y: number;
  rotation: number; // radians
}

export function initialPieces(): PieceState[] {
  // Arrange pieces in a tray along the bottom of the canvas.
  return PIECE_DEFS.map((p, i) => ({
    id: p.id,
    x: 20 + i * 80,
    y: 380,
    rotation: 0,
  }));
}

export function centroidOfPoints(points: [number, number][]): [number, number] {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

export function rotatedPiece(def: PieceDef, state: PieceState): [number, number][] {
  const [cx, cy] = centroidOfPoints(def.points);
  const cos = Math.cos(state.rotation);
  const sin = Math.sin(state.rotation);
  return def.points.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    return [state.x + cx + dx * cos - dy * sin, state.y + cy + dx * sin + dy * cos];
  });
}

export function polygonArea(poly: [number, number][]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j]![0] * poly[i]![1] - poly[i]![0] * poly[j]![1];
  }
  return Math.abs(a) / 2;
}

export function fitPuzzlePoints(puzzle: Puzzle): [number, number][] {
  // Total piece area = 16 unit² (a 4×4 square at S=40 → 160×160 px).
  // Auto-scale each puzzle polygon so its area equals 16 unit² when drawn at S=40.
  const rawArea = polygonArea(puzzle.poly);
  const targetArea = 16;
  const scale = TANGRAM_UNIT * Math.sqrt(targetArea / rawArea);
  const cx = puzzle.poly.reduce((a, p) => a + p[0], 0) / puzzle.poly.length;
  const cy = puzzle.poly.reduce((a, p) => a + p[1], 0) / puzzle.poly.length;
  // Center the polygon in the upper-middle of the canvas.
  const targetCx = TANGRAM_VIEW_W / 2;
  const targetCy = 170;
  return puzzle.poly.map(([x, y]) => [(x - cx) * scale + targetCx, (y - cy) * scale + targetCy]);
}

export function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
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
