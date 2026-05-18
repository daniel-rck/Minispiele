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
  isTarget: boolean;
}

export interface TrafficJamState {
  cars: Car[];
  difficulty: TrafficJamDifficulty;
  puzzleIndex: number;
  moves: number;
  selectedCarId: string | null;
  won: boolean;
}

interface PuzzleDef {
  id: string;
  encoded: string;
}

// Standard Rush Hour board encoding: 36 chars row-major, '.' empty,
// 'A' = red target car (length 2, horizontal, row 2), 'B'..'K' = other cars.
// Each puzzle is laid out as six 6-char row strings for visual review.
export const PUZZLES: Record<TrafficJamDifficulty, PuzzleDef[]> = {
  easy: [
    {
      id: 'easy-01',
      // A single vertical blocker at col 3.
      encoded: '...C..' + '...C..' + 'AA.C..' + '......' + '......' + '......',
    },
    {
      id: 'easy-02',
      // Two vertical blockers, both length-3, at col 2 and col 5.
      encoded: '..B..C' + '..B..C' + 'AAB..C' + '......' + '......' + '......',
    },
    {
      id: 'easy-03',
      // Vertical blocker with extra horizontal car (decoration).
      encoded: 'DD....' + '...B..' + 'AA.B..' + '...B..' + '......' + '......',
    },
    {
      id: 'easy-04',
      // Two short vertical cars in column 2 — must move down out of row 2.
      encoded: '..B...' + '..B...' + 'AAC...' + '..C...' + '......' + '......',
    },
    {
      id: 'easy-05',
      // Vertical at col 3 and col 5, with extra horizontals.
      encoded: 'BB.C.D' + '...C.D' + 'AA.C.D' + '......' + '.EE...' + '......',
    },
  ],
  medium: [
    {
      id: 'medium-01',
      // C blocks col 3, D blocks col 5; both must descend.
      encoded: 'BB.C..' + '...C..' + 'AA.C.D' + '.....D' + '.....D' + 'EE....',
    },
    {
      id: 'medium-02',
      // C at col 3, D at col 5, E blocks C's down-path on row 5.
      encoded: '...C..' + '...C..' + 'AA.C.D' + '.....D' + '.....D' + '...EE.',
    },
    {
      id: 'medium-03',
      // Three adjacent vertical trucks blocking row 2.
      encoded: '..BCD.' + '..BCD.' + 'AABCD.' + '......' + 'EE....' + '......',
    },
    {
      id: 'medium-04',
      // Mixed: vertical truck blocks exit, horizontal blocks path down.
      encoded: 'BB....' + '...C..' + 'AA.C.D' + '...C.D' + '....ED' + '....E.',
    },
    {
      id: 'medium-05',
      // Two trucks blocking; need to clear via top and bottom.
      encoded: '..B..C' + '..B..C' + 'AA...C' + '..D...' + '..D...' + '..D...',
    },
  ],
  hard: [
    {
      id: 'hard-01',
      // Vertical blocker chain with horizontal decoration.
      encoded: 'BB.C..' + '...C.D' + 'AA.C.D' + '.....D' + '.FF...' + '......',
    },
    {
      id: 'hard-02',
      // Two trucks + cascading blockers.
      encoded: '..B.CC' + '..B...' + 'AAB..D' + '.....D' + 'EE...D' + '..FFGG',
    },
    {
      id: 'hard-03',
      // Three vertical blockers spanning the upper half.
      encoded: 'BBC..E' + '..C..E' + 'AAC..E' + '.F....' + '.F....' + 'GG.HH.',
    },
    {
      id: 'hard-04',
      // Truck at top, blocker chain.
      encoded: '..BBB.' + 'C....D' + 'CAA..D' + 'C....D' + '..EEFF' + 'GG....',
    },
    {
      id: 'hard-05',
      // Mid-board horizontal blocker must shift before B descends.
      encoded: '..B.CC' + '..B...' + 'AAB..D' + '.....D' + '.E...D' + '.EFF..',
    },
  ],
};

export function parsePuzzle(encoded: string): Car[] {
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
    cars.push({ id: ch, row, col, length: length as 2 | 3, orientation, isTarget });
    seen.add(ch);
  }
  if (!cars.some((c) => c.isTarget)) {
    throw new Error(`Puzzle missing target car "${TARGET_ID}"`);
  }
  // Reject disconnected duplicates: every occurrence of each id must belong to
  // the single contiguous car we parsed.
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

function directionDelta(dir: Direction): [number, number] {
  switch (dir) {
    case 'up':
      return [-1, 0];
    case 'down':
      return [1, 0];
    case 'left':
      return [0, -1];
    case 'right':
      return [0, 1];
  }
}

export function slideCar(state: TrafficJamState, carId: string, dir: Direction): TrafficJamState {
  if (state.won) return state;
  const car = state.cars.find((c) => c.id === carId);
  if (!car) return state;
  const axisH = car.orientation === 'h';
  const [dr, dc] = directionDelta(dir);
  if (axisH ? dr !== 0 : dc !== 0) return state;

  const newRow = car.row + dr;
  const newCol = car.col + dc;

  // Target car exits the right edge when its right end passes col 5.
  if (car.isTarget && dir === 'right' && newCol + car.length > BOARD_SIZE) {
    if (car.col + car.length !== BOARD_SIZE) return state;
    return {
      ...state,
      cars: state.cars.filter((c) => c.id !== carId),
      moves: state.moves + 1,
      selectedCarId: null,
      won: true,
    };
  }

  const spanR = axisH ? 1 : car.length;
  const spanC = axisH ? car.length : 1;
  if (newRow < 0 || newCol < 0 || newRow + spanR > BOARD_SIZE || newCol + spanC > BOARD_SIZE) {
    return state;
  }

  const enterR = axisH ? car.row : dr > 0 ? car.row + car.length : car.row - 1;
  const enterC = axisH ? (dc > 0 ? car.col + car.length : car.col - 1) : car.col;
  if (isBlocked(state.cars, enterR, enterC, carId)) return state;

  return {
    ...state,
    cars: state.cars.map((c) => (c.id === carId ? { ...c, row: newRow, col: newCol } : c)),
    moves: state.moves + 1,
  };
}

export function moveSelected(state: TrafficJamState, dir: Direction): TrafficJamState {
  if (!state.selectedCarId) return state;
  return slideCar(state, state.selectedCarId, dir);
}

export function selectCar(state: TrafficJamState, carId: string | null): TrafficJamState {
  if (state.selectedCarId === carId) return state;
  return { ...state, selectedCarId: carId };
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
    cars: parsePuzzle(puzzle.encoded),
    difficulty,
    puzzleIndex: safeIndex,
    moves: 0,
    selectedCarId: null,
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

// Serialize the current car layout back to a 36-char board string. Useful for
// BFS solvability checks in tests.
export function encodeBoard(cars: readonly Car[]): string {
  const grid = buildGrid(cars);
  return grid.map((cell) => cell ?? '.').join('');
}

// BFS solver: returns minimum move count (1 cell = 1 move) or null if unsolvable.
// Used by tests to verify every shipped puzzle is solvable. The winning state is
// produced naturally by `slideCar` when the target crosses the exit, so each
// right-slide on the target counts as one move.
export function solveBFS(initial: TrafficJamState, maxStates = 200_000): number | null {
  if (initial.won) return 0;
  const startKey = encodeBoard(initial.cars);
  const visited = new Set<string>([startKey]);
  let frontier: { state: TrafficJamState; depth: number }[] = [{ state: initial, depth: 0 }];
  while (frontier.length > 0 && visited.size < maxStates) {
    const next: { state: TrafficJamState; depth: number }[] = [];
    for (const { state, depth } of frontier) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      for (const car of state.cars) {
        for (const dir of dirs) {
          const after = slideCar(state, car.id, dir);
          if (after === state) continue;
          if (after.won) return depth + 1;
          const key = encodeBoard(after.cars);
          if (visited.has(key)) continue;
          visited.add(key);
          next.push({ state: after, depth: depth + 1 });
        }
      }
    }
    frontier = next;
  }
  return null;
}
