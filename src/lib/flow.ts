export interface FlowLevel {
  size: number;
  endpoints: { color: number; cells: [number, number] }[]; // pair of indices
}

const COLORS_HEX = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export function colorHex(idx: number): string {
  return COLORS_HEX[idx % COLORS_HEX.length]!;
}

// Hand-crafted levels (small, solvable). Indices are 0-based row*size+col.
export const LEVELS: FlowLevel[] = [
  // 5x5 levels
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 14] }, // 0,0 to 2,4
      { color: 1, cells: [4, 20] }, // 0,4 to 4,0
      { color: 2, cells: [2, 24] }, // 0,2 to 4,4
    ],
  },
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 24] },
      { color: 1, cells: [4, 20] },
      { color: 2, cells: [2, 22] },
      { color: 3, cells: [11, 13] },
    ],
  },
  // 6x6
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 35] },
      { color: 1, cells: [5, 30] },
      { color: 2, cells: [7, 28] },
      { color: 3, cells: [14, 21] },
      { color: 4, cells: [3, 32] },
    ],
  },
  // 7x7
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 48] },
      { color: 1, cells: [6, 42] },
      { color: 2, cells: [10, 38] },
      { color: 3, cells: [16, 32] },
      { color: 4, cells: [22, 26] },
    ],
  },
];

export interface FlowState {
  level: FlowLevel;
  paths: Record<number, number[]>; // color -> path of cell indices
}

export function createState(level: FlowLevel): FlowState {
  const paths: Record<number, number[]> = {};
  for (const ep of level.endpoints) paths[ep.color] = [];
  return { level, paths };
}

export function endpointFor(level: FlowLevel, idx: number): number | null {
  for (const ep of level.endpoints) {
    if (ep.cells[0] === idx || ep.cells[1] === idx) return ep.color;
  }
  return null;
}

export function isAdjacent(size: number, a: number, b: number): boolean {
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

export function cellOwner(state: FlowState, idx: number): number | null {
  for (const [color, path] of Object.entries(state.paths)) {
    if (path.includes(idx)) return Number(color);
  }
  return null;
}

export function startPath(state: FlowState, color: number, idx: number): FlowState {
  // Reset this color's path to just the start cell; leave other colors intact.
  const fresh: Record<number, number[]> = {};
  for (const c of Object.keys(state.paths)) {
    fresh[Number(c)] = Number(c) === color ? [idx] : state.paths[Number(c)]!.slice();
  }
  return { ...state, paths: fresh };
}

export function extendPath(state: FlowState, color: number, idx: number): FlowState | null {
  const path = state.paths[color];
  if (!path || path.length === 0) return null;
  const last = path[path.length - 1]!;
  if (idx === last) return null;
  // Allow backtrack
  const existingPos = path.indexOf(idx);
  if (existingPos !== -1) {
    const truncated = path.slice(0, existingPos + 1);
    return { ...state, paths: { ...state.paths, [color]: truncated } };
  }
  if (!isAdjacent(state.level.size, last, idx)) return null;
  // Cannot enter an endpoint of a different color
  const epColor = endpointFor(state.level, idx);
  if (epColor !== null && epColor !== color) return null;
  // Cannot enter a cell already owned by another color
  for (const [c, p] of Object.entries(state.paths)) {
    if (Number(c) !== color && p.includes(idx)) {
      // overwrite that cell — remove from that color
      const otherTrimmed = p.slice(0, p.indexOf(idx));
      const nextPaths = { ...state.paths, [Number(c)]: otherTrimmed, [color]: [...path, idx] };
      return { ...state, paths: nextPaths };
    }
  }
  return { ...state, paths: { ...state.paths, [color]: [...path, idx] } };
}

export function isSolved(state: FlowState): boolean {
  const totalCells = state.level.size * state.level.size;
  let used = 0;
  for (const ep of state.level.endpoints) {
    const path = state.paths[ep.color] ?? [];
    const start = path[0];
    const end = path[path.length - 1];
    if (path.length < 2) return false;
    const epSet = new Set(ep.cells);
    if (!epSet.has(start!) || !epSet.has(end!)) return false;
    used += path.length;
  }
  return used === totalCells;
}
