// Sokoban with a small set of hand-crafted levels.
// Tiles: # = wall, . = floor, $ = box, * = box on target, @ = player, + = player on target, T = target

export const LEVELS: string[][] = [
  ['########', '#  .   #', '#  $   #', '#  @   #', '#      #', '########'],
  ['#######', '#.    #', '# $$  #', '# @   #', '#   ..#', '#######'],
  ['########', '#......#', '#......#', '#$$$ @ #', '#......#', '########'],
  ['########', '#  #   #', '# .$.  #', '# $@$  #', '# .$.  #', '#  #   #', '########'],
  ['#########', '#   #   #', '# $ . $ #', '#   @   #', '# $ . $ #', '#   #   #', '#########'],
  ['#########', '#.......#', '# $$$$$ #', '# .....@#', '#       #', '#########'],
];

export interface SokobanState {
  rows: number;
  cols: number;
  walls: boolean[];
  targets: boolean[];
  boxes: boolean[];
  player: number;
  moves: number;
  history: SokobanState[];
}

function parseLevel(level: string[]): SokobanState {
  const rows = level.length;
  const cols = Math.max(...level.map((r) => r.length));
  const walls: boolean[] = new Array(rows * cols).fill(false);
  const targets: boolean[] = new Array(rows * cols).fill(false);
  const boxes: boolean[] = new Array(rows * cols).fill(false);
  let player = 0;
  for (let r = 0; r < rows; r++) {
    const line = level[r]!;
    for (let c = 0; c < cols; c++) {
      const ch = line[c] ?? ' ';
      const idx = r * cols + c;
      switch (ch) {
        case '#':
          walls[idx] = true;
          break;
        case '.':
        case 'T':
          targets[idx] = true;
          break;
        case '$':
          boxes[idx] = true;
          break;
        case '*':
          boxes[idx] = true;
          targets[idx] = true;
          break;
        case '@':
          player = idx;
          break;
        case '+':
          player = idx;
          targets[idx] = true;
          break;
      }
    }
  }
  return { rows, cols, walls, targets, boxes, player, moves: 0, history: [] };
}

export function loadLevel(levelIdx: number): SokobanState {
  const lvl = LEVELS[levelIdx % LEVELS.length]!;
  return parseLevel(lvl);
}

export type SokobanDirection = 'up' | 'down' | 'left' | 'right';

export function move(state: SokobanState, dir: SokobanDirection): SokobanState {
  const delta: Record<SokobanDirection, number> = {
    up: -state.cols,
    down: state.cols,
    left: -1,
    right: 1,
  };
  const d = delta[dir];
  const target = state.player + d;
  if (target < 0 || target >= state.rows * state.cols) return state;
  if (dir === 'left' && state.player % state.cols === 0) return state;
  if (dir === 'right' && (state.player + 1) % state.cols === 0) return state;
  if (state.walls[target]) return state;
  let boxes = state.boxes;
  if (state.boxes[target]) {
    const past = target + d;
    if (past < 0 || past >= state.rows * state.cols) return state;
    if (dir === 'left' && target % state.cols === 0) return state;
    if (dir === 'right' && (target + 1) % state.cols === 0) return state;
    if (state.walls[past] || state.boxes[past]) return state;
    boxes = state.boxes.slice();
    boxes[target] = false;
    boxes[past] = true;
  }
  const history = [...state.history.slice(-30), { ...state }];
  return {
    ...state,
    boxes,
    player: target,
    moves: state.moves + 1,
    history,
  };
}

export function undo(state: SokobanState): SokobanState {
  const prev = state.history[state.history.length - 1];
  if (!prev) return state;
  return prev;
}

export function isSolved(state: SokobanState): boolean {
  for (let i = 0; i < state.boxes.length; i++) {
    if (state.boxes[i] && !state.targets[i]) return false;
  }
  return state.boxes.some((b) => b);
}
