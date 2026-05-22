export interface FlowLevel {
  size: number;
  endpoints: { color: number; cells: [number, number] }[]; // pair of indices
}

const COLORS_HEX = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export function colorHex(idx: number): string {
  return COLORS_HEX[idx % COLORS_HEX.length]!;
}

// Verified-solvable levels. Indices are 0-based row*size+col.
// Each color's pair of endpoints is connected by a Hamiltonian sub-path of a
// snake covering the whole grid, so a full-coverage solution provably exists.
export const LEVELS: FlowLevel[] = [
  // Level 1: 5x5, 3 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 3] },
      { color: 1, cells: [4, 12] },
      { color: 2, cells: [13, 24] },
    ],
  },
  // Level 2: 5x5, 3 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 17] },
      { color: 1, cells: [22, 8] },
      { color: 2, cells: [3, 24] },
    ],
  },
  // Level 3: 5x5, 3 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 19] },
      { color: 1, cells: [18, 20] },
      { color: 2, cells: [21, 24] },
    ],
  },
  // Level 4: 5x5, 3 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 20] },
      { color: 1, cells: [21, 3] },
      { color: 2, cells: [4, 24] },
    ],
  },
  // Level 5: 5x5, 3 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 7] },
      { color: 1, cells: [6, 18] },
      { color: 2, cells: [17, 24] },
    ],
  },
  // Level 6: 5x5, 4 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 3] },
      { color: 1, cells: [4, 19] },
      { color: 2, cells: [18, 15] },
      { color: 3, cells: [20, 24] },
    ],
  },
  // Level 7: 5x5, 4 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 16] },
      { color: 1, cells: [11, 23] },
      { color: 2, cells: [18, 4] },
      { color: 3, cells: [9, 24] },
    ],
  },
  // Level 8: 5x5, 4 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 3] },
      { color: 1, cells: [4, 10] },
      { color: 2, cells: [11, 20] },
      { color: 3, cells: [21, 24] },
    ],
  },
  // Level 9: 5x5, 4 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 15] },
      { color: 1, cells: [20, 6] },
      { color: 2, cells: [1, 8] },
      { color: 3, cells: [3, 24] },
    ],
  },
  // Level 10: 5x5, 4 colors
  {
    size: 5,
    endpoints: [
      { color: 0, cells: [0, 3] },
      { color: 1, cells: [4, 18] },
      { color: 2, cells: [17, 20] },
      { color: 3, cells: [21, 24] },
    ],
  },
  // Level 11: 6x6, 4 colors
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 4] },
      { color: 1, cells: [5, 6] },
      { color: 2, cells: [12, 16] },
      { color: 3, cells: [17, 30] },
    ],
  },
  // Level 12: 6x6, 4 colors
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 25] },
      { color: 1, cells: [19, 1] },
      { color: 2, cells: [2, 33] },
      { color: 3, cells: [27, 5] },
    ],
  },
  // Level 13: 6x6, 5 colors
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 4] },
      { color: 1, cells: [5, 16] },
      { color: 2, cells: [17, 20] },
      { color: 3, cells: [19, 27] },
      { color: 4, cells: [28, 30] },
    ],
  },
  // Level 14: 6x6, 5 colors
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 14] },
      { color: 1, cells: [20, 33] },
      { color: 2, cells: [27, 9] },
      { color: 3, cells: [3, 29] },
      { color: 4, cells: [23, 5] },
    ],
  },
  // Level 15: 6x6, 5 colors
  {
    size: 6,
    endpoints: [
      { color: 0, cells: [0, 4] },
      { color: 1, cells: [5, 8] },
      { color: 2, cells: [7, 15] },
      { color: 3, cells: [16, 35] },
      { color: 4, cells: [34, 30] },
    ],
  },
  // Level 16: 7x7, 5 colors
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 3] },
      { color: 1, cells: [4, 14] },
      { color: 2, cells: [15, 26] },
      { color: 3, cells: [25, 29] },
      { color: 4, cells: [30, 48] },
    ],
  },
  // Level 17: 7x7, 5 colors
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 36] },
      { color: 1, cells: [29, 16] },
      { color: 2, cells: [23, 3] },
      { color: 3, cells: [4, 13] },
      { color: 4, cells: [20, 48] },
    ],
  },
  // Level 18: 7x7, 5 colors
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 5] },
      { color: 1, cells: [6, 7] },
      { color: 2, cells: [14, 18] },
      { color: 3, cells: [19, 28] },
      { color: 4, cells: [29, 48] },
    ],
  },
  // Level 19: 7x7, 6 colors
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 36] },
      { color: 1, cells: [29, 44] },
      { color: 2, cells: [45, 3] },
      { color: 3, cells: [4, 39] },
      { color: 4, cells: [46, 26] },
      { color: 5, cells: [19, 48] },
    ],
  },
  // Level 20: 7x7, 6 colors
  {
    size: 7,
    endpoints: [
      { color: 0, cells: [0, 11] },
      { color: 1, cells: [10, 19] },
      { color: 2, cells: [20, 25] },
      { color: 3, cells: [24, 33] },
      { color: 4, cells: [34, 38] },
      { color: 5, cells: [37, 48] },
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
