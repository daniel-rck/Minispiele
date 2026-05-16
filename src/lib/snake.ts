export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: Point[];
  food: Point;
  dir: Direction;
  pendingDir: Direction;
  cols: number;
  rows: number;
  alive: boolean;
  score: number;
  tick: number;
}

const DIR_DELTA: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function createInitialState(
  cols: number,
  rows: number,
  rng: () => number = Math.random,
): SnakeState {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const snake: Point[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  const base: SnakeState = {
    snake,
    food: { x: 0, y: 0 },
    dir: 'right',
    pendingDir: 'right',
    cols,
    rows,
    alive: true,
    score: 0,
    tick: 0,
  };
  return spawnFood(base, rng);
}

export function spawnFood(state: SnakeState, rng: () => number = Math.random): SnakeState {
  const occupied = new Set<number>();
  for (const s of state.snake) occupied.add(s.y * state.cols + s.x);
  const empty: number[] = [];
  for (let i = 0; i < state.cols * state.rows; i++) {
    if (!occupied.has(i)) empty.push(i);
  }
  if (empty.length === 0) return state;
  const pick = empty[Math.floor(rng() * empty.length)]!;
  return { ...state, food: { x: pick % state.cols, y: Math.floor(pick / state.cols) } };
}

export function queueDirection(state: SnakeState, dir: Direction): SnakeState {
  if (!state.alive) return state;
  if (OPPOSITE[state.dir] === dir) return state;
  if (state.pendingDir === dir) return state;
  return { ...state, pendingDir: dir };
}

export function tick(state: SnakeState, rng: () => number = Math.random): SnakeState {
  if (!state.alive) return state;
  const dir = state.pendingDir;
  const head = state.snake[0]!;
  const delta = DIR_DELTA[dir];
  const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y };

  if (newHead.x < 0 || newHead.x >= state.cols || newHead.y < 0 || newHead.y >= state.rows) {
    return { ...state, dir, alive: false, tick: state.tick + 1 };
  }

  const willEat = newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  for (const s of bodyToCheck) {
    if (s.x === newHead.x && s.y === newHead.y) {
      return { ...state, dir, alive: false, tick: state.tick + 1 };
    }
  }

  const newSnake = [newHead, ...state.snake];
  if (!willEat) newSnake.pop();

  let next: SnakeState = {
    ...state,
    snake: newSnake,
    dir,
    score: willEat ? state.score + 1 : state.score,
    tick: state.tick + 1,
  };

  if (willEat) next = spawnFood(next, rng);
  return next;
}

export function tickIntervalMs(score: number, base = 180, min = 80, step = 4): number {
  return Math.max(min, base - score * step);
}
