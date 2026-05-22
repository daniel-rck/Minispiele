import { describe, expect, it } from 'vitest';
import {
  cellOwner,
  colorHex,
  createState,
  endpointFor,
  extendPath,
  isAdjacent,
  isSolved,
  LEVELS,
  startPath,
} from './flow';

describe('flow', () => {
  it('colorHex cycles through the palette', () => {
    expect(colorHex(0)).toMatch(/^#/);
    expect(colorHex(6)).toBe(colorHex(0));
  });

  it('endpointFor finds the colour at endpoint cells', () => {
    const level = LEVELS[0]!;
    const firstEp = level.endpoints[0]!;
    expect(endpointFor(level, firstEp.cells[0])).toBe(firstEp.color);
    expect(endpointFor(level, firstEp.cells[1])).toBe(firstEp.color);
    // Some inner cell is unlikely to be an endpoint
    expect(endpointFor(level, 7)).toBeNull();
  });

  it('isAdjacent detects 4-neighbourhood', () => {
    expect(isAdjacent(5, 0, 1)).toBe(true);
    expect(isAdjacent(5, 0, 5)).toBe(true);
    expect(isAdjacent(5, 0, 6)).toBe(false); // diagonal
    expect(isAdjacent(5, 0, 2)).toBe(false);
  });

  it('startPath seeds only the chosen colour, leaving others untouched', () => {
    const level = LEVELS[0]!;
    let state = createState(level);
    const [a, b, c] = level.endpoints;
    state = startPath(state, a!.color, a!.cells[0]);
    state = startPath(state, b!.color, b!.cells[0]);
    expect(state.paths[a!.color]).toEqual([a!.cells[0]]);
    expect(state.paths[b!.color]).toEqual([b!.cells[0]]);
    expect(state.paths[c!.color]).toEqual([]);
  });

  it('extendPath grows along an adjacent cell and supports backtracking', () => {
    const level = LEVELS[0]!;
    let state = createState(level);
    const ep = level.endpoints[0]!;
    state = startPath(state, ep.color, ep.cells[0]);
    // Move to the right neighbour
    const neighbour = ep.cells[0] + 1;
    const grown = extendPath(state, ep.color, neighbour);
    expect(grown).not.toBeNull();
    expect(grown!.paths[ep.color]).toEqual([ep.cells[0], neighbour]);
    // Backtrack
    const back = extendPath(grown!, ep.color, ep.cells[0]);
    expect(back!.paths[ep.color]).toEqual([ep.cells[0]]);
    // Same cell as last → null
    expect(extendPath(grown!, ep.color, neighbour)).toBeNull();
  });

  it('extendPath rejects non-adjacent moves and other colours’ endpoints', () => {
    const level = LEVELS[0]!;
    let state = createState(level);
    const [a, b] = level.endpoints;
    state = startPath(state, a!.color, a!.cells[0]);
    // Non-adjacent move
    const far = a!.cells[0] + 5 * 2; // two rows away
    expect(extendPath(state, a!.color, far)).toBeNull();
    // Cannot enter another colour's endpoint
    if (isAdjacent(level.size, a!.cells[0], b!.cells[0])) {
      expect(extendPath(state, a!.color, b!.cells[0])).toBeNull();
    }
  });

  it('cellOwner reports which colour occupies a cell', () => {
    const level = LEVELS[0]!;
    const ep = level.endpoints[0]!;
    let state = createState(level);
    state = startPath(state, ep.color, ep.cells[0]);
    expect(cellOwner(state, ep.cells[0])).toBe(ep.color);
    expect(cellOwner(state, 99)).toBeNull();
  });

  it('isSolved is false on a fresh state', () => {
    expect(isSolved(createState(LEVELS[0]!))).toBe(false);
  });

  describe('LEVELS', () => {
    it('all levels are well-formed', () => {
      for (let i = 0; i < LEVELS.length; i++) {
        const lvl = LEVELS[i]!;
        const totalCells = lvl.size * lvl.size;
        const seen = new Set<number>();
        for (const ep of lvl.endpoints) {
          for (const c of ep.cells) {
            expect(c, `Level ${i + 1} cell ${c} out of bounds`).toBeGreaterThanOrEqual(0);
            expect(c, `Level ${i + 1} cell ${c} out of bounds`).toBeLessThan(totalCells);
            expect(seen.has(c), `Level ${i + 1} cell ${c} used by multiple endpoints`).toBe(false);
            seen.add(c);
          }
          expect(ep.cells[0]).not.toBe(ep.cells[1]);
        }
      }
    });

    // Sanity check: each level admits a full-coverage solution where every cell
    // belongs to some color's path. The brute-force DFS is fast in dev (<1s
    // total) but coverage instrumentation in CI inflates it ~10×, so the
    // timeout is bumped well above the worst observed runtime.
    it('every level has at least one full-coverage solution', () => {
      for (let i = 0; i < LEVELS.length; i++) {
        const lvl = LEVELS[i]!;
        expect(canSolve(lvl), `Level ${i + 1} (${lvl.size}x${lvl.size}) is unsolvable`).toBe(true);
      }
    }, 60_000);
  });
});

function canSolve(level: {
  size: number;
  endpoints: { color: number; cells: [number, number] }[];
}): boolean {
  const N = level.size;
  const total = N * N;
  const board = new Int8Array(total).fill(-1);
  for (const ep of level.endpoints) {
    board[ep.cells[0]] = ep.color;
    board[ep.cells[1]] = ep.color;
  }
  const neighbors = (i: number): number[] => {
    const r = (i / N) | 0;
    const c = i % N;
    const n: number[] = [];
    if (r > 0) n.push(i - N);
    if (r < N - 1) n.push(i + N);
    if (c > 0) n.push(i - 1);
    if (c < N - 1) n.push(i + 1);
    return n;
  };
  const colors = level.endpoints.map((e) => e.color);
  let found = false;
  const tryColor = (idx: number): void => {
    if (found) return;
    if (idx === colors.length) {
      for (let i = 0; i < total; i++) if (board[i] === -1) return;
      found = true;
      return;
    }
    const color = colors[idx]!;
    const ep = level.endpoints.find((e) => e.color === color)!;
    const [start, end] = ep.cells;
    const visited = new Uint8Array(total);
    visited[start] = 1;
    const path: number[] = [start];
    const dfs = (cur: number): void => {
      if (found) return;
      if (cur === end && path.length >= 2) {
        const written: number[] = [];
        for (let k = 1; k < path.length - 1; k++) {
          board[path[k]!] = color;
          written.push(path[k]!);
        }
        tryColor(idx + 1);
        for (const w of written) board[w] = -1;
        return;
      }
      for (const nb of neighbors(cur)) {
        if (visited[nb]) continue;
        if (nb === end) {
          visited[nb] = 1;
          path.push(nb);
          dfs(nb);
          path.pop();
          visited[nb] = 0;
          continue;
        }
        if (board[nb] !== -1) continue;
        visited[nb] = 1;
        path.push(nb);
        dfs(nb);
        path.pop();
        visited[nb] = 0;
      }
    };
    dfs(start);
  };
  tryColor(0);
  return found;
}
