export type TrafficJamDifficulty = 'easy' | 'medium' | 'hard';
export type Orientation = 'h' | 'v';
export type Direction = 'up' | 'down' | 'left' | 'right';

export const BOARD_SIZE = 6;
export const EXIT_ROW = 2;
export const TARGET_ID = 'A';

export interface Car {
  id: string;
  row: number;
  col: number;
  length: 2 | 3;
  orientation: Orientation;
  facing: Direction;
  isTarget: boolean;
}

export interface TrafficJamState {
  cars: Car[];
  difficulty: TrafficJamDifficulty;
  puzzleIndex: number;
  moves: number;
  won: boolean;
}

interface PuzzleDef {
  id: string;
  encoded: string;
  facings: Record<string, Direction>;
}

// Standard Rush Hour board encoding: 36 chars row-major, '.' empty, 'A' target.
// Each car has a fixed `facing` direction: clicking it drives it as far as
// possible in that direction. Horizontal cars face left/right, vertical face up/down.
// The target car A always faces right (toward the exit).
export const PUZZLES: Record<TrafficJamDifficulty, PuzzleDef[]> = {
  easy: [
    {
      id: 'easy-01',
      encoded: '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......',
      facings: { A: 'right', C: 'down' },
    },
    {
      id: 'easy-02',
      encoded: '..B..C' + '..B..C' + 'AAB..C' + '......' + '......' + '......',
      facings: { A: 'right', B: 'down', C: 'down' },
    },
    {
      id: 'easy-03',
      encoded: 'DD....' + '...B..' + 'AA.B..' + '...B..' + '......' + '......',
      facings: { A: 'right', B: 'down', D: 'right' },
    },
    {
      id: 'easy-04',
      encoded: '..B...' + '..B...' + 'AAC...' + '..C...' + '......' + '......',
      facings: { A: 'right', B: 'up', C: 'down' },
    },
    {
      id: 'easy-05',
      encoded: 'BB.C.D' + '...C.D' + 'AA.C.D' + '......' + '.EE...' + '......',
      facings: { A: 'right', B: 'right', C: 'down', D: 'down', E: 'right' },
    },
  ],
  medium: [
    {
      id: 'medium-01',
      encoded: 'BB.C..' + '...C..' + 'AA.C.D' + '.....D' + '.....D' + 'EE....',
      facings: { A: 'right', B: 'right', C: 'down', D: 'down', E: 'right' },
    },
    {
      id: 'medium-02',
      // C wants to descend but row 5 col 3 is blocked by E — E must drive left first.
      encoded: '...C..' + '...C..' + 'AA.C.D' + '.....D' + '.....D' + '...EE.',
      facings: { A: 'right', C: 'down', D: 'down', E: 'left' },
    },
    {
      id: 'medium-03',
      encoded: '..BCD.' + '..BCD.' + 'AABCD.' + '......' + 'EE....' + '......',
      facings: { A: 'right', B: 'down', C: 'down', D: 'down', E: 'right' },
    },
    {
      id: 'medium-04',
      encoded: 'BB....' + '...C..' + 'AA.C.D' + '...C.D' + '....ED' + '....E.',
      facings: { A: 'right', B: 'right', C: 'down', D: 'down', E: 'down' },
    },
    {
      id: 'medium-05',
      encoded: '..B..C' + '..B..C' + 'AA...C' + '..D...' + '..D...' + '..D...',
      facings: { A: 'right', B: 'up', C: 'down', D: 'down' },
    },
  ],
  hard: [
    {
      id: 'hard-01',
      encoded: 'BB.C..' + '...C.D' + 'AA.C.D' + '.....D' + '.FF...' + '......',
      facings: { A: 'right', B: 'right', C: 'down', D: 'down', F: 'right' },
    },
    {
      id: 'hard-02',
      // F must drive left to free col 2 row 5, then B can descend.
      // G must drive left to free col 5 row 5, then D can descend.
      encoded: '..B.CC' + '..B...' + 'AAB..D' + '.....D' + 'EE...D' + '..FFGG',
      facings: { A: 'right', B: 'down', C: 'right', D: 'down', E: 'right', F: 'left', G: 'left' },
    },
    {
      id: 'hard-03',
      encoded: 'BBC..E' + '..C..E' + 'AAC..E' + '.F....' + '.F....' + 'GG.HH.',
      facings: {
        A: 'right',
        B: 'right',
        C: 'down',
        E: 'down',
        F: 'down',
        G: 'right',
        H: 'right',
      },
    },
    {
      id: 'hard-04',
      // E must drive left to free col 4 row 4, then F can drive left to free
      // col 5 row 4, then D can descend.
      encoded: '..BBB.' + 'C....D' + 'CAA..D' + 'C....D' + '..EEFF' + 'GG....',
      facings: { A: 'right', B: 'right', C: 'down', D: 'down', E: 'left', F: 'left', G: 'right' },
    },
    {
      id: 'hard-05',
      // F must drive right to clear col 2 row 5; D drives down (col 5 free).
      encoded: '..B.CC' + '..B...' + 'AAB..D' + '.....D' + '.E...D' + '.E....',
      facings: { A: 'right', B: 'down', C: 'right', D: 'down', E: 'down' },
    },
  ],
};

function defaultFacingFor(orientation: Orientation): Direction {
  return orientation === 'h' ? 'right' : 'down';
}

export function parsePuzzle(encoded: string, facings: Record<string, Direction> = {}): Car[] {
  if (encoded.length !== BOARD_SIZE * BOARD_SIZE) {
    throw new Error(
      `Puzzle string must be ${BOARD_SIZE * BOARD_SIZE} chars, got ${encoded.length}`,
    );
  }
  const seen = new Set<string>();
  const cars: Car[] = [];
  for (let i = 0; i < encoded.length; i++) {
    const ch = encoded[i];
    if (!ch || ch === '.') continue;
    if (seen.has(ch)) continue;
    if (!/^[A-Z]$/.test(ch)) {
      throw new Error(`Invalid puzzle char "${ch}" at index ${i}`);
    }
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    const rightChar = col + 1 < BOARD_SIZE ? encoded[i + 1] : undefined;
    const downChar = row + 1 < BOARD_SIZE ? encoded[i + BOARD_SIZE] : undefined;
    let orientation: Orientation;
    if (rightChar === ch) orientation = 'h';
    else if (downChar === ch) orientation = 'v';
    else throw new Error(`Car "${ch}" has no neighbor — minimum length is 2`);
    let length = 1;
    if (orientation === 'h') {
      while (col + length < BOARD_SIZE && encoded[i + length] === ch) length++;
    } else {
      while (row + length < BOARD_SIZE && encoded[i + length * BOARD_SIZE] === ch) length++;
    }
    if (length !== 2 && length !== 3) {
      throw new Error(`Car "${ch}" has invalid length ${length}`);
    }
    const isTarget = ch === TARGET_ID;
    if (isTarget) {
      if (orientation !== 'h' || length !== 2 || row !== EXIT_ROW) {
        throw new Error(`Target car "${TARGET_ID}" must be horizontal length-2 in row ${EXIT_ROW}`);
      }
    }
    const facing = facings[ch] ?? defaultFacingFor(orientation);
    // Validate facing matches orientation
    if (orientation === 'h' && facing !== 'left' && facing !== 'right') {
      throw new Error(`Horizontal car "${ch}" cannot face "${facing}"`);
    }
    if (orientation === 'v' && facing !== 'up' && facing !== 'down') {
      throw new Error(`Vertical car "${ch}" cannot face "${facing}"`);
    }
    cars.push({
      id: ch,
      row,
      col,
      length: length as 2 | 3,
      orientation,
      facing,
      isTarget,
    });
    seen.add(ch);
  }
  if (!cars.some((c) => c.isTarget)) {
    throw new Error(`Puzzle missing target car "${TARGET_ID}"`);
  }
  // Reject disconnected duplicates.
  const counts = new Map<string, number>();
  for (const ch of encoded) {
    if (ch === '.') continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  for (const car of cars) {
    const total = counts.get(car.id) ?? 0;
    if (total !== car.length) {
      throw new Error(
        `Car "${car.id}" has ${total} cells in the puzzle string but parsed length ${car.length} — cells must be contiguous`,
      );
    }
  }
  return cars.sort((a, b) => a.id.localeCompare(b.id));
}

export function buildGrid(cars: readonly Car[]): (string | null)[] {
  const grid: (string | null)[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null);
  for (const car of cars) {
    for (let k = 0; k < car.length; k++) {
      const r = car.orientation === 'v' ? car.row + k : car.row;
      const c = car.orientation === 'h' ? car.col + k : car.col;
      grid[r * BOARD_SIZE + c] = car.id;
    }
  }
  return grid;
}

export function isBlocked(cars: readonly Car[], r: number, c: number, excludeId: string): boolean {
  for (const car of cars) {
    if (car.id === excludeId) continue;
    for (let k = 0; k < car.length; k++) {
      const cr = car.orientation === 'v' ? car.row + k : car.row;
      const cc = car.orientation === 'h' ? car.col + k : car.col;
      if (cr === r && cc === c) return true;
    }
  }
  return false;
}

// Internal: try to shift a single car by exactly one cell in `dir`.
// Used by driveCar and the BFS solver. Increments no counter — caller does.
function shiftOne(
  cars: readonly Car[],
  carId: string,
  dir: Direction,
): { cars: Car[]; exited: boolean } | null {
  const car = cars.find((c) => c.id === carId);
  if (!car) return null;
  const axisH = car.orientation === 'h';
  const wrongAxis = axisH ? dir !== 'left' && dir !== 'right' : dir !== 'up' && dir !== 'down';
  if (wrongAxis) return null;

  const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const newRow = car.row + dr;
  const newCol = car.col + dc;

  // Target exit: the right edge slides off the board.
  if (car.isTarget && dir === 'right' && newCol + car.length > BOARD_SIZE) {
    if (car.col + car.length !== BOARD_SIZE) return null;
    return { cars: cars.filter((c) => c.id !== carId), exited: true };
  }

  const spanR = axisH ? 1 : car.length;
  const spanC = axisH ? car.length : 1;
  if (newRow < 0 || newCol < 0 || newRow + spanR > BOARD_SIZE || newCol + spanC > BOARD_SIZE) {
    return null;
  }

  const enterR = axisH ? car.row : dr > 0 ? car.row + car.length : car.row - 1;
  const enterC = axisH ? (dc > 0 ? car.col + car.length : car.col - 1) : car.col;
  if (isBlocked(cars, enterR, enterC, carId)) return null;

  const next = cars.map((c) => (c.id === carId ? { ...c, row: newRow, col: newCol } : c));
  return { cars: next, exited: false };
}

// Drive a car as far as possible in its facing direction. One click = one move
// regardless of how many cells it travels. If the car can't move at all,
// returns the same state object (no-op).
export function driveCar(state: TrafficJamState, carId: string): TrafficJamState {
  if (state.won) return state;
  const car = state.cars.find((c) => c.id === carId);
  if (!car) return state;
  let cars: readonly Car[] = state.cars;
  let exited = false;
  let moved = false;
  while (true) {
    const step = shiftOne(cars, carId, car.facing);
    if (!step) break;
    cars = step.cars;
    moved = true;
    if (step.exited) {
      exited = true;
      break;
    }
  }
  if (!moved) return state;
  return {
    ...state,
    cars: cars as Car[],
    moves: state.moves + 1,
    won: exited || state.won,
  };
}

export function isSolved(state: TrafficJamState): boolean {
  return state.won;
}

export function getPuzzle(difficulty: TrafficJamDifficulty, index: number): PuzzleDef {
  const pool = PUZZLES[difficulty];
  const safe = ((index % pool.length) + pool.length) % pool.length;
  const puzzle = pool[safe];
  if (!puzzle) throw new Error(`No puzzle for ${difficulty} at index ${index}`);
  return puzzle;
}

export function createInitialState(
  difficulty: TrafficJamDifficulty,
  puzzleIndex: number = 0,
): TrafficJamState {
  const pool = PUZZLES[difficulty];
  const safeIndex = ((puzzleIndex % pool.length) + pool.length) % pool.length;
  const puzzle = getPuzzle(difficulty, safeIndex);
  return {
    cars: parsePuzzle(puzzle.encoded, puzzle.facings),
    difficulty,
    puzzleIndex: safeIndex,
    moves: 0,
    won: false,
  };
}

export function pickRandomPuzzleIndex(
  difficulty: TrafficJamDifficulty,
  exclude: number | null = null,
): number {
  const len = PUZZLES[difficulty].length;
  if (len <= 1) return 0;
  let idx = Math.floor(Math.random() * len);
  if (exclude !== null && idx === exclude) idx = (idx + 1) % len;
  return idx;
}

export function encodeBoard(cars: readonly Car[]): string {
  const grid = buildGrid(cars);
  return grid.map((cell) => cell ?? '.').join('');
}

// BFS solver: returns the minimum number of clicks (drive actions) to solve,
// or null if unsolvable within the visit budget.
export function solveBFS(initial: TrafficJamState, maxStates = 200_000): number | null {
  if (initial.won) return 0;
  const startKey = encodeBoard(initial.cars);
  const visited = new Set<string>([startKey]);
  let frontier: { state: TrafficJamState; depth: number }[] = [{ state: initial, depth: 0 }];
  while (frontier.length > 0 && visited.size < maxStates) {
    const next: { state: TrafficJamState; depth: number }[] = [];
    for (const { state, depth } of frontier) {
      for (const car of state.cars) {
        const after = driveCar(state, car.id);
        if (after === state) continue;
        if (after.won) return depth + 1;
        const key = encodeBoard(after.cars);
        if (visited.has(key)) continue;
        visited.add(key);
        next.push({ state: after, depth: depth + 1 });
      }
    }
    frontier = next;
  }
  return null;
}
