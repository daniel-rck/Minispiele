import { describe, it, expect } from 'vitest';
import {
  LEVELS,
  cellOwner,
  colorHex,
  createState,
  endpointFor,
  extendPath,
  isAdjacent,
  isSolved,
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
});
