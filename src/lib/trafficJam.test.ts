import { describe, it, expect } from 'vitest';
import {
  BOARD_SIZE,
  EXIT_ROW,
  PUZZLES,
  TARGET_ID,
  buildGrid,
  createInitialState,
  encodeBoard,
  isBlocked,
  moveSelected,
  parsePuzzle,
  selectCar,
  slideCar,
  solveBFS,
} from './trafficJam';

const ALL_PUZZLES = (['easy', 'medium', 'hard'] as const).flatMap((d) =>
  PUZZLES[d].map((p) => ({ difficulty: d, ...p })),
);

describe('parsePuzzle', () => {
  it('rejects strings of the wrong length', () => {
    expect(() => parsePuzzle('A'.repeat(35))).toThrow();
    expect(() => parsePuzzle('A'.repeat(37))).toThrow();
  });

  it('rejects missing target car', () => {
    const encoded = 'BB....' + '......' + 'CC....' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded)).toThrow(/target/i);
  });

  it('rejects target car in wrong row', () => {
    const encoded = 'AA....' + '......' + '......' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded)).toThrow(/row 2|target/i);
  });

  it('rejects orphan letters (length 1)', () => {
    const encoded = 'B.....' + '......' + 'AA....' + '......' + '......' + '......';
    expect(() => parsePuzzle(encoded)).toThrow(/neighbor|length/i);
  });

  it('rejects disconnected duplicate cells for an id', () => {
    // A appears as a valid 2-car in row 2 (cols 0-1) AND as an extra disconnected
    // cell at (4,4). Must throw rather than silently dropping the stray cell.
    const encoded = '......' + '......' + 'AA....' + '......' + '....A.' + '......';
    expect(() => parsePuzzle(encoded)).toThrow(/contiguous|cells/i);
  });

  it('parses a simple horizontal target + vertical blocker', () => {
    const encoded = '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded);
    expect(cars).toHaveLength(2);
    const target = cars.find((c) => c.isTarget);
    expect(target).toMatchObject({
      id: TARGET_ID,
      row: EXIT_ROW,
      col: 0,
      length: 2,
      orientation: 'h',
    });
    const blocker = cars.find((c) => !c.isTarget);
    expect(blocker).toMatchObject({
      id: 'C',
      row: 0,
      col: 3,
      length: 3,
      orientation: 'v',
    });
  });
});

describe('PUZZLES pool', () => {
  it.each(ALL_PUZZLES)('$difficulty/$id parses with valid structure', ({ encoded }) => {
    const cars = parsePuzzle(encoded);
    const target = cars.find((c) => c.isTarget);
    expect(target).toBeDefined();
    expect(target?.row).toBe(EXIT_ROW);
    expect(target?.length).toBe(2);
    expect(target?.orientation).toBe('h');
    // No overlapping cells
    const grid = buildGrid(cars);
    const occupied = grid.filter((c) => c !== null);
    const expected = cars.reduce((sum, c) => sum + c.length, 0);
    expect(occupied).toHaveLength(expected);
  });

  it.each(ALL_PUZZLES)('$difficulty/$id is solvable via BFS', ({ encoded, difficulty }) => {
    const cars = parsePuzzle(encoded);
    const state = {
      cars,
      difficulty,
      puzzleIndex: 0,
      moves: 0,
      selectedCarId: null,
      won: false,
    };
    const solution = solveBFS(state);
    expect(solution).not.toBeNull();
    expect(solution).toBeGreaterThan(0);
  });
});

describe('solveBFS', () => {
  it('counts the required right-slides even when the path is clear from the start', () => {
    // Target at col 0, path completely clear; minimum is 5 right moves
    // (4 to reach col 4 + 1 to slide off the right edge).
    const encoded = '......' + '......' + 'AA....' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded);
    const state = {
      cars,
      difficulty: 'easy' as const,
      puzzleIndex: 0,
      moves: 0,
      selectedCarId: null,
      won: false,
    };
    expect(solveBFS(state)).toBe(5);
  });
});

describe('slideCar', () => {
  const baseEncoded = '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......';
  const baseState = () => createInitialState('easy', 0);

  it('moves a vertical car down by one cell, incrementing moves', () => {
    void baseEncoded;
    const s0 = baseState();
    const s1 = slideCar(s0, 'C', 'down');
    expect(s1.moves).toBe(1);
    const c = s1.cars.find((x) => x.id === 'C');
    expect(c).toMatchObject({ row: 1 });
  });

  it('returns same state on wrong-axis direction', () => {
    const s0 = baseState();
    const s1 = slideCar(s0, 'C', 'left');
    expect(s1).toBe(s0);
  });

  it('returns same state when out of bounds', () => {
    const s0 = baseState();
    const s1 = slideCar(s0, 'C', 'up');
    expect(s1).toBe(s0);
  });

  it('returns same state on collision', () => {
    // C is at col 3 rows 0-2 length 3 in easy-01. A at row 2 cols 0-1.
    // Try to move A right — col 2 is empty so first right move is valid.
    const s0 = baseState();
    const s1 = slideCar(s0, 'A', 'right');
    expect(s1.moves).toBe(1);
    expect(s1.cars.find((c) => c.id === 'A')?.col).toBe(1);
    // Now col 2 has A, col 3 has C. Next right move blocked.
    const s2 = slideCar(s1, 'A', 'right');
    expect(s2).toBe(s1);
  });

  it('target car exits the board when its right edge crosses the exit', () => {
    // Build a state where A is already at col 4 (right end at col 5) with clear right.
    const encoded = '......' + '......' + '....AA' + '......' + '......' + '......';
    const cars = parsePuzzle(encoded);
    const state = {
      cars,
      difficulty: 'easy' as const,
      puzzleIndex: 0,
      moves: 0,
      selectedCarId: null,
      won: false,
    };
    const after = slideCar(state, 'A', 'right');
    expect(after.won).toBe(true);
    expect(after.cars.find((c) => c.id === 'A')).toBeUndefined();
    expect(after.moves).toBe(1);
  });

  it('does not allow exit move when target not yet at the right edge', () => {
    const s0 = createInitialState('easy', 0);
    const after = slideCar(s0, 'A', 'right');
    // First right move just shifts A by 1, does not win
    expect(after.won).toBe(false);
  });

  it('no further moves are allowed after winning', () => {
    const encoded = '......' + '......' + '....AA' + '......' + '......' + '......';
    const state = {
      cars: parsePuzzle(encoded),
      difficulty: 'easy' as const,
      puzzleIndex: 0,
      moves: 0,
      selectedCarId: null,
      won: false,
    };
    const won = slideCar(state, 'A', 'right');
    const after = slideCar(won, 'A', 'right');
    expect(after).toBe(won);
  });
});

describe('moveSelected', () => {
  it('is a no-op when no car is selected', () => {
    const s0 = createInitialState('easy', 0);
    const s1 = moveSelected(s0, 'down');
    expect(s1).toBe(s0);
  });

  it('moves the selected car when valid', () => {
    const s0 = selectCar(createInitialState('easy', 0), 'C');
    const s1 = moveSelected(s0, 'down');
    expect(s1.moves).toBe(1);
  });
});

describe('selectCar', () => {
  it('updates selectedCarId', () => {
    const s0 = createInitialState('easy', 0);
    const s1 = selectCar(s0, 'C');
    expect(s1.selectedCarId).toBe('C');
  });

  it('returns same state when selecting same car', () => {
    const s0 = selectCar(createInitialState('easy', 0), 'C');
    const s1 = selectCar(s0, 'C');
    expect(s1).toBe(s0);
  });

  it('clears selection with null', () => {
    const s0 = selectCar(createInitialState('easy', 0), 'C');
    const s1 = selectCar(s0, null);
    expect(s1.selectedCarId).toBeNull();
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
    expect(s.selectedCarId).toBeNull();
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
