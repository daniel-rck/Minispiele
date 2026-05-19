import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  buildGrid,
  createInitialState,
  driveCar,
  EXIT_ROW,
  encodeBoard,
  isBlocked,
  PUZZLES,
  parsePuzzle,
  solveBFS,
  TARGET_ID,
} from './trafficJam';

const ALL_PUZZLES = (['easy', 'medium', 'hard'] as const).flatMap((d) =>
  PUZZLES[d].map((p) => ({ difficulty: d, ...p })),
);

describe('parsePuzzle', () => {
  it('rejects strings of the wrong length', () => {
    expect(() => parsePuzzle('A'.repeat(35), {})).toThrow();
    expect(() => parsePuzzle('A'.repeat(37), {})).toThrow();
  });

  it('rejects missing target car', () => {
    const encoded = 'BB....' + '......' + 'CC....' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded, {})).toThrow(/target/i);
  });

  it('rejects target car in wrong row', () => {
    const encoded = 'AA....' + '......' + '......' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded, {})).toThrow(/row 2|target/i);
  });

  it('rejects orphan letters (length 1)', () => {
    const encoded = 'B.....' + '......' + 'AA....' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded, {})).toThrow(/neighbor|length/i);
  });

  it('rejects disconnected duplicate cells for an id', () => {
    const encoded = '......' + '......' + 'AA....' + '......' + '....A.' + '......';
    expect(() => parsePuzzle(encoded, {})).toThrow(/contiguous|cells/i);
  });

  it('rejects horizontal car with vertical facing', () => {
    const encoded = '......' + '......' + 'AA....' + '......' + 'BB....' + '......';
    expect(() => parsePuzzle(encoded, { A: 'right', B: 'down' })).toThrow(/face/i);
  });

  it('rejects vertical car with horizontal facing', () => {
    const encoded = '..B...' + '..B...' + 'AA....' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded, { A: 'right', B: 'left' })).toThrow(/face/i);
  });

  it('parses a simple horizontal target + vertical blocker with facings', () => {
    const encoded = '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded, { A: 'right', C: 'down' });
    expect(cars).toHaveLength(2);
    const target = cars.find((c) => c.isTarget);
    expect(target).toMatchObject({
      id: TARGET_ID,
      row: EXIT_ROW,
      col: 0,
      length: 2,
      orientation: 'h',
      facing: 'right',
    });
    const blocker = cars.find((c) => !c.isTarget);
    expect(blocker).toMatchObject({
      id: 'C',
      row: 0,
      col: 3,
      length: 3,
      orientation: 'v',
      facing: 'down',
    });
  });

  it('assigns default facing when not provided', () => {
    const encoded = '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded);
    expect(cars.find((c) => c.id === 'A')?.facing).toBe('right');
    expect(cars.find((c) => c.id === 'C')?.facing).toBe('down');
  });
});

describe('PUZZLES pool', () => {
  it.each(ALL_PUZZLES)('$difficulty/$id parses with valid structure', ({ encoded, facings }) => {
    const cars = parsePuzzle(encoded, facings);
    const target = cars.find((c) => c.isTarget);
    expect(target).toBeDefined();
    expect(target?.row).toBe(EXIT_ROW);
    expect(target?.length).toBe(2);
    expect(target?.orientation).toBe('h');
    expect(target?.facing).toBe('right');
    const grid = buildGrid(cars);
    const occupied = grid.filter((c) => c !== null);
    const expectedCells = cars.reduce((sum, c) => sum + c.length, 0);
    expect(occupied).toHaveLength(expectedCells);
  });

  it.each(ALL_PUZZLES)('$difficulty/$id is solvable via BFS', ({
    difficulty,
    encoded,
    facings,
  }) => {
    const cars = parsePuzzle(encoded, facings);
    const state = {
      cars,
      difficulty,
      puzzleIndex: 0,
      moves: 0,
      won: false,
    };
    const solution = solveBFS(state);
    expect(solution).not.toBeNull();
    expect(solution).toBeGreaterThan(0);
  });
});

describe('driveCar', () => {
  it('drives a vertical car all the way down in one click', () => {
    const s0 = createInitialState('easy', 0); // ...C.. + ...C.. + AA.C.. + ...
    const s1 = driveCar(s0, 'C');
    const c = s1.cars.find((x) => x.id === 'C');
    expect(c).toMatchObject({ row: 3, col: 3 });
    expect(s1.moves).toBe(1);
  });

  it('counts a multi-cell drive as exactly one move', () => {
    const s0 = createInitialState('easy', 0);
    const s1 = driveCar(s0, 'C');
    expect(s1.moves).toBe(1);
    const s2 = driveCar(s1, 'A');
    // A drives right from col 0 all the way to exit — still 1 move.
    expect(s2.moves).toBe(2);
    expect(s2.won).toBe(true);
  });

  it('is a no-op when the car cannot move', () => {
    // easy-04: B facing 'up' is already at the top — clicking is a no-op.
    const s0 = createInitialState('easy', 3);
    const s1 = driveCar(s0, 'B');
    expect(s1).toBe(s0);
  });

  it('does not move after winning', () => {
    const s0 = createInitialState('easy', 0);
    const won = driveCar(driveCar(s0, 'C'), 'A');
    expect(won.won).toBe(true);
    const after = driveCar(won, 'A');
    expect(after).toBe(won);
  });

  it('returns the same reference on a no-op (car not found)', () => {
    const s0 = createInitialState('easy', 0);
    expect(driveCar(s0, 'Z')).toBe(s0);
  });

  it('drives until blocked by another car', () => {
    // easy-01: A faces right, C blocks col 3. Driving A first should move A
    // from col 0 to col 1 (blocked at col 2 → col 3 by C).
    const s0 = createInitialState('easy', 0);
    const s1 = driveCar(s0, 'A');
    const a = s1.cars.find((c) => c.id === 'A');
    expect(a).toMatchObject({ col: 1 });
    expect(s1.moves).toBe(1);
  });

  it('triggers win when target slides off the right edge', () => {
    const encoded = '......' + '......' + '....AA' + '......' + '......' + '......';
    const state = {
      cars: parsePuzzle(encoded, { A: 'right' }),
      difficulty: 'easy' as const,
      puzzleIndex: 0,
      moves: 0,
      won: false,
    };
    const after = driveCar(state, 'A');
    expect(after.won).toBe(true);
    expect(after.cars.find((c) => c.id === 'A')).toBeUndefined();
  });
});

describe('isBlocked', () => {
  it('detects occupied cells', () => {
    const cars = parsePuzzle('...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......');
    expect(isBlocked(cars, 0, 3, 'X')).toBe(true);
    expect(isBlocked(cars, 0, 0, 'X')).toBe(false);
  });

  it('ignores the excluded car', () => {
    const cars = parsePuzzle('...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......');
    expect(isBlocked(cars, 0, 3, 'C')).toBe(false);
  });
});

describe('createInitialState', () => {
  it('produces a fresh state with zero moves', () => {
    const s = createInitialState('easy', 0);
    expect(s.moves).toBe(0);
    expect(s.won).toBe(false);
  });

  it('wraps puzzleIndex modulo pool size', () => {
    const len = PUZZLES.easy.length;
    const s = createInitialState('easy', len + 1);
    expect(s.puzzleIndex).toBe(1);
  });
});

describe('encodeBoard', () => {
  it('round-trips through parsePuzzle', () => {
    const encoded = '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded);
    expect(encodeBoard(cars)).toBe(encoded);
    expect(BOARD_SIZE).toBe(6);
  });
});

describe('solveBFS', () => {
  it('returns the minimum click count for a clear-path target', () => {
    const encoded = '......' + '......' + 'AA....' + '......' + '......' + '......';
    const state = {
      cars: parsePuzzle(encoded, { A: 'right' }),
      difficulty: 'easy' as const,
      puzzleIndex: 0,
      moves: 0,
      won: false,
    };
    // One click on A drives it all the way off — minimum 1.
    expect(solveBFS(state)).toBe(1);
  });
});
