// Gfrett — Color Block Jam: slide colored blocks off the grid, match three of a
// color in the side-line. Pure rules; UI lives in components/GfrettGame.tsx.

export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';
export type Orientation = 'horizontal' | 'vertical';
export type Dir = 'up' | 'down' | 'left' | 'right';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];

export interface Block {
  id: string;
  color: Color | 'joker';
  orientation: Orientation;
  length: 2 | 3;
  /** Leftmost cell for horizontal, topmost for vertical. */
  anchor: { r: number; c: number };
  locked: boolean;
  /** When set, this block unlocks once a block with id === unlockKey is removed. */
  unlockKey?: string;
}

export type Cell =
  | { kind: 'floor' }
  | { kind: 'wall' }
  | { kind: 'exit'; dir: Dir }
  | { kind: 'arrow'; out: Dir };

export interface Grid {
  rows: number;
  cols: number;
  cells: Cell[];
}

export interface MatchSlot {
  color: Color | 'joker';
}

export interface MatchArea {
  slots: (MatchSlot | null)[];
  capacity: 7 | 8;
}

export interface PowerUps {
  undo: number;
  shuffle: number;
  expand: number;
}

export type Status = 'playing' | 'won' | 'lost' | 'gridlock';

interface Snapshot {
  blocks: Block[];
  matchArea: MatchArea;
  moves: number;
  powerUps: PowerUps;
  status: Status;
}

export interface GameState {
  level: number;
  grid: Grid;
  blocks: Block[];
  matchArea: MatchArea;
  moves: number;
  moveLimit: number | null;
  powerUps: PowerUps;
  history: Snapshot[];
  status: Status;
}

export interface BlockSpec {
  id: string;
  color: Color | 'joker';
  orientation: Orientation;
  length: 2 | 3;
  anchor: { r: number; c: number };
  locked?: boolean;
  unlockKey?: string;
}

export interface Level {
  rows: number;
  cols: number;
  layout: string[];
  blocks: BlockSpec[];
  moveLimit?: number;
  powerUps?: Partial<PowerUps>;
  hint?: string;
}

// ---------------------------------------------------------------------------
// Level data (~10 hand-crafted levels of progressive difficulty).
//
// Layout grammar:
//   '.' = floor
//   '#' = wall
//   '^' = exit on top edge, dir 'up'
//   'v' = exit on bottom edge, dir 'down'
//   '<' = exit on left edge, dir 'left'
//   '>' = exit on right edge, dir 'right'
//   'U' = arrow redirecting to 'up'
//   'D' = arrow redirecting to 'down'
//   'L' = arrow redirecting to 'left'
//   'R' = arrow redirecting to 'right'
// ---------------------------------------------------------------------------

export const LEVELS: Level[] = [
  // 1 — intro: three reds slide right, each through its own exit. Match-3 pops.
  {
    rows: 5,
    cols: 5,
    layout: ['#####', '#...>', '#...>', '#...>', '#####'],
    blocks: [
      { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      { id: 'b2', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      { id: 'b3', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 1 } },
    ],
    moveLimit: 6,
    powerUps: { undo: 3, shuffle: 0, expand: 0 },
    hint: 'Schiebe alle drei Blöcke nach rechts aus dem Spielfeld.',
  },

  // 2 — two colors, match-3 happens twice. Each row holds two blocks; the
  // rightmost on each row has to exit before the inner one can pass.
  {
    rows: 5,
    cols: 7,
    layout: ['#######', '#.....>', '#.....>', '#.....>', '#######'],
    blocks: [
      { id: 'r1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      { id: 'b1', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 3 } },
      { id: 'r2', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      { id: 'b2', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 3 } },
      { id: 'r3', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 1 } },
      { id: 'b3', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 3 } },
    ],
    moveLimit: 12,
    powerUps: { undo: 3, shuffle: 1, expand: 0 },
    hint: 'Drei gleiche Farben in der Leiste lösen sich auf.',
  },

  // 3 — lock + key. Lock unlocks when its named key block is removed.
  // Player must exit `key` before the locked block can move.
  {
    rows: 4,
    cols: 7,
    layout: ['#######', '#.....>', '#.....>', '#######'],
    blocks: [
      {
        id: 'lockA',
        color: 'red',
        orientation: 'horizontal',
        length: 2,
        anchor: { r: 1, c: 1 },
        locked: true,
        unlockKey: 'key',
      },
      { id: 'key', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 3 } },
      { id: 'r3', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
    ],
    moveLimit: 8,
    powerUps: { undo: 3, shuffle: 1, expand: 0 },
    hint: 'Der eingesperrte Block öffnet sich, sobald sein Schlüssel weg ist.',
  },

  // 4 — lock unlocks by adjacent match-3 pop. The locked blue sits directly
  // below row 3; popping the three reds vacates (3,1)/(3,2), which is
  // adjacent to the lockedB at (4,1).
  {
    rows: 7,
    cols: 7,
    layout: ['#######', '#.....>', '#.....>', '#.....>', '#.....>', '#.....>', '#######'],
    blocks: [
      { id: 'r1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      { id: 'r2', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      { id: 'r3', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 1 } },
      {
        id: 'lockB',
        color: 'blue',
        orientation: 'horizontal',
        length: 2,
        anchor: { r: 4, c: 1 },
        locked: true,
      },
      { id: 'b2', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 5, c: 1 } },
      { id: 'b3', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 5, c: 3 } },
    ],
    moveLimit: 12,
    powerUps: { undo: 3, shuffle: 1, expand: 0 },
    hint: 'Lasse drei gleiche Farben in der Leiste poppen — das öffnet benachbarte Schlösser.',
  },

  // 5 — joker (★) acts as wildcard so two reds + one joker complete a triple.
  {
    rows: 4,
    cols: 7,
    layout: ['#######', '#.....>', '#.....>', '#######'],
    blocks: [
      { id: 'r1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      { id: 'b1', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 3 } },
      { id: 'r2', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      { id: 'j1', color: 'joker', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 3 } },
    ],
    moveLimit: 8,
    powerUps: { undo: 3, shuffle: 1, expand: 1 },
    hint: 'Der bunte Block passt zu jeder Farbe.',
  },

  // 6 — many blocks, tighter move limit. Pure logic puzzle.
  {
    rows: 5,
    cols: 7,
    layout: ['#######', '#.....>', '#.....>', '#.....>', '#######'],
    blocks: [
      { id: 'g1', color: 'green', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      { id: 'g2', color: 'green', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 3 } },
      { id: 'y1', color: 'yellow', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      { id: 'j1', color: 'joker', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 3 } },
      { id: 'g3', color: 'green', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 1 } },
      { id: 'y2', color: 'yellow', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 3 } },
    ],
    moveLimit: 8,
    powerUps: { undo: 2, shuffle: 1, expand: 1 },
  },

  // 7 — arrow redirect: horizontal block hits a 'D' (down) arrow and turns
  // 90° toward a bottom exit.
  {
    rows: 6,
    cols: 6,
    layout: ['######', '#..D.#', '#....#', '#....#', '###v##', '######'],
    blocks: [
      { id: 'r1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
    ],
    moveLimit: 4,
    powerUps: { undo: 3, shuffle: 1, expand: 0 },
    hint: 'Pfeile zwingen den Block in eine 90°-Kurve.',
  },

  // 8 — length-3 block uses an arrow. The arrow becomes the pivot cell.
  {
    rows: 7,
    cols: 7,
    layout: ['#######', '#.....#', '#...D.#', '#.....#', '#.....#', '####v##', '#######'],
    blocks: [
      { id: 'big', color: 'orange', orientation: 'horizontal', length: 3, anchor: { r: 2, c: 1 } },
    ],
    moveLimit: 5,
    powerUps: { undo: 3, shuffle: 1, expand: 0 },
    hint: 'Auch lange Blöcke nehmen die Kurve.',
  },
];

// ---------------------------------------------------------------------------
// Grid + block utilities
// ---------------------------------------------------------------------------

function inBounds(grid: Grid, r: number, c: number): boolean {
  return r >= 0 && r < grid.rows && c >= 0 && c < grid.cols;
}

function cellAt(grid: Grid, r: number, c: number): Cell {
  return grid.cells[r * grid.cols + c]!;
}

export function blockCells(b: Block): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let i = 0; i < b.length; i++) {
    if (b.orientation === 'horizontal') cells.push({ r: b.anchor.r, c: b.anchor.c + i });
    else cells.push({ r: b.anchor.r + i, c: b.anchor.c });
  }
  return cells;
}

function blockOccupiesSet(blocks: Block[], excludeId?: string): Set<number> {
  const occ = new Set<number>();
  for (const b of blocks) {
    if (b.id === excludeId) continue;
    for (const { r, c } of blockCells(b)) {
      occ.add(r * 100000 + c);
    }
  }
  return occ;
}

function key(r: number, c: number): number {
  return r * 100000 + c;
}

function parseLayout(layout: string[], rows: number, cols: number): Grid {
  const cells: Cell[] = new Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    const line = layout[r] ?? '';
    for (let c = 0; c < cols; c++) {
      const ch = line[c] ?? '#';
      const idx = r * cols + c;
      switch (ch) {
        case '.':
          cells[idx] = { kind: 'floor' };
          break;
        case '#':
          cells[idx] = { kind: 'wall' };
          break;
        case '^':
          cells[idx] = { kind: 'exit', dir: 'up' };
          break;
        case 'v':
          cells[idx] = { kind: 'exit', dir: 'down' };
          break;
        case '<':
          cells[idx] = { kind: 'exit', dir: 'left' };
          break;
        case '>':
          cells[idx] = { kind: 'exit', dir: 'right' };
          break;
        case 'U':
          cells[idx] = { kind: 'arrow', out: 'up' };
          break;
        case 'D':
          cells[idx] = { kind: 'arrow', out: 'down' };
          break;
        case 'L':
          cells[idx] = { kind: 'arrow', out: 'left' };
          break;
        case 'R':
          cells[idx] = { kind: 'arrow', out: 'right' };
          break;
        default:
          cells[idx] = { kind: 'wall' };
      }
    }
  }
  return { rows, cols, cells };
}

export function buildState(level: Level, levelIdx = 0): GameState {
  const grid = parseLayout(level.layout, level.rows, level.cols);
  const blocks: Block[] = level.blocks.map((b) => ({
    id: b.id,
    color: b.color,
    orientation: b.orientation,
    length: b.length,
    anchor: { r: b.anchor.r, c: b.anchor.c },
    locked: !!b.locked,
    unlockKey: b.unlockKey,
  }));
  return {
    level: levelIdx,
    grid,
    blocks,
    matchArea: { slots: new Array(7).fill(null), capacity: 7 },
    moves: 0,
    moveLimit: level.moveLimit ?? null,
    powerUps: {
      undo: level.powerUps?.undo ?? 3,
      shuffle: level.powerUps?.shuffle ?? 0,
      expand: level.powerUps?.expand ?? 0,
    },
    history: [],
    status: 'playing',
  };
}

export function loadLevel(levelIdx: number): GameState {
  const idx = ((levelIdx % LEVELS.length) + LEVELS.length) % LEVELS.length;
  return buildState(LEVELS[idx]!, levelIdx);
}

// ---------------------------------------------------------------------------
// Slide mechanics
// ---------------------------------------------------------------------------

function unitFor(orientation: Orientation, sign: -1 | 1): { dr: number; dc: number } {
  if (orientation === 'horizontal') return { dr: 0, dc: sign };
  return { dr: sign, dc: 0 };
}

function dirToUnit(d: Dir): { dr: number; dc: number; orientation: Orientation; sign: -1 | 1 } {
  switch (d) {
    case 'up':
      return { dr: -1, dc: 0, orientation: 'vertical', sign: -1 };
    case 'down':
      return { dr: 1, dc: 0, orientation: 'vertical', sign: 1 };
    case 'left':
      return { dr: 0, dc: -1, orientation: 'horizontal', sign: -1 };
    case 'right':
      return { dr: 0, dc: 1, orientation: 'horizontal', sign: 1 };
  }
}

function leadingCell(b: Block, sign: -1 | 1): { r: number; c: number } {
  if (b.orientation === 'horizontal') {
    return sign > 0
      ? { r: b.anchor.r, c: b.anchor.c + b.length - 1 }
      : { r: b.anchor.r, c: b.anchor.c };
  }
  return sign > 0
    ? { r: b.anchor.r + b.length - 1, c: b.anchor.c }
    : { r: b.anchor.r, c: b.anchor.c };
}

function shiftAnchor(b: Block, sign: -1 | 1): Block {
  const u = unitFor(b.orientation, sign);
  return { ...b, anchor: { r: b.anchor.r + u.dr, c: b.anchor.c + u.dc } };
}

/** Cells a block would occupy if pivoted to the given orientation with the
 *  arrow cell at the *back* end (length 2) or *center* (length 3) of the new
 *  axis pointing in `out`. Returns null if any cell would be off-grid. */
function pivotCells(
  arrowCell: { r: number; c: number },
  newOrientation: Orientation,
  out: Dir,
  length: 2 | 3,
  grid: Grid,
): { anchor: { r: number; c: number }; cells: { r: number; c: number }[] } | null {
  const { dr, dc } = dirToUnit(out);
  const cells: { r: number; c: number }[] = [];
  let anchor: { r: number; c: number };
  if (length === 3) {
    // Arrow is the center; one cell on each side along `out`.
    const back = { r: arrowCell.r - dr, c: arrowCell.c - dc };
    const front = { r: arrowCell.r + dr, c: arrowCell.c + dc };
    cells.push(back, arrowCell, front);
    // Anchor = leftmost (h) or topmost (v).
    anchor =
      newOrientation === 'horizontal'
        ? { r: arrowCell.r, c: Math.min(back.c, arrowCell.c, front.c) }
        : { r: Math.min(back.r, arrowCell.r, front.r), c: arrowCell.c };
  } else {
    // Length 2: arrow is the back; front is one cell in `out` direction.
    const front = { r: arrowCell.r + dr, c: arrowCell.c + dc };
    cells.push(arrowCell, front);
    anchor =
      newOrientation === 'horizontal'
        ? { r: arrowCell.r, c: Math.min(arrowCell.c, front.c) }
        : { r: Math.min(arrowCell.r, front.r), c: arrowCell.c };
  }
  for (const cell of cells) {
    if (!inBounds(grid, cell.r, cell.c)) return null;
  }
  return { anchor, cells };
}

function isPerpendicular(orientation: Orientation, out: Dir): boolean {
  if (orientation === 'horizontal') return out === 'up' || out === 'down';
  return out === 'left' || out === 'right';
}

function pushSlot(area: MatchArea, color: Color | 'joker'): MatchArea {
  const slots = area.slots.slice();
  const free = slots.indexOf(null);
  if (free === -1) {
    return area; // caller is responsible for detecting overflow via isLost
  }
  slots[free] = { color };
  return { ...area, slots };
}

function compactSlots(slots: (MatchSlot | null)[]): (MatchSlot | null)[] {
  const filled = slots.filter((s): s is MatchSlot => s !== null);
  const out: (MatchSlot | null)[] = new Array(slots.length).fill(null);
  for (let i = 0; i < filled.length; i++) out[i] = filled[i]!;
  return out;
}

/** Pop a single resolvable triple if any. Returns new slots + popped colors
 *  (the colors of the three slots, in left-to-right order) or null when no
 *  match is available. A joker substitutes for any color. */
function popOne(
  slots: (MatchSlot | null)[],
): { slots: (MatchSlot | null)[]; popped: (Color | 'joker')[] } | null {
  const filled = slots
    .map((s, i) => ({ s, i }))
    .filter((x): x is { s: MatchSlot; i: number } => x.s !== null);
  if (filled.length < 3) return null;
  // Try every combination of 3; resolve as one color if jokers fill the rest.
  for (let a = 0; a < filled.length - 2; a++) {
    for (let b = a + 1; b < filled.length - 1; b++) {
      for (let c = b + 1; c < filled.length; c++) {
        const trio = [filled[a]!.s.color, filled[b]!.s.color, filled[c]!.s.color];
        const nonJoker = trio.filter((x) => x !== 'joker');
        if (nonJoker.length === 0) {
          // 3 jokers — pop together as joker-triple.
          const out = slots.slice();
          out[filled[a]!.i] = null;
          out[filled[b]!.i] = null;
          out[filled[c]!.i] = null;
          return { slots: compactSlots(out), popped: trio };
        }
        const first = nonJoker[0]!;
        if (nonJoker.every((x) => x === first)) {
          const out = slots.slice();
          out[filled[a]!.i] = null;
          out[filled[b]!.i] = null;
          out[filled[c]!.i] = null;
          return { slots: compactSlots(out), popped: trio };
        }
      }
    }
  }
  return null;
}

export function popMatches(state: GameState): { state: GameState; poppedAny: boolean } {
  let slots = state.matchArea.slots;
  let popped = false;
  while (true) {
    const res = popOne(slots);
    if (!res) break;
    slots = res.slots;
    popped = true;
  }
  if (!popped) return { state, poppedAny: false };
  return {
    state: { ...state, matchArea: { ...state.matchArea, slots } },
    poppedAny: true,
  };
}

function releaseLocks(state: GameState, removedBlockIds: string[]): GameState {
  if (!state.blocks.some((b) => b.locked)) return state;
  // Compute set of cells that were occupied by removed blocks (for adjacency).
  // We don't have the prior positions here (block was removed), but locks via
  // unlockKey only need the id match — which works regardless.
  const updated = state.blocks.map((b) => {
    if (!b.locked) return b;
    if (b.unlockKey && removedBlockIds.includes(b.unlockKey)) {
      return { ...b, locked: false, unlockKey: undefined };
    }
    return b;
  });
  if (updated.every((b, i) => b === state.blocks[i])) return state;
  return { ...state, blocks: updated };
}

function releaseLocksOnPop(state: GameState): GameState {
  if (!state.blocks.some((b) => b.locked && !b.unlockKey)) return state;
  const updated = state.blocks.map((b) => (b.locked && !b.unlockKey ? { ...b, locked: false } : b));
  return { ...state, blocks: updated };
}

function snapshot(state: GameState): Snapshot {
  return {
    blocks: state.blocks.map((b) => ({ ...b, anchor: { ...b.anchor } })),
    matchArea: { ...state.matchArea, slots: state.matchArea.slots.slice() },
    moves: state.moves,
    powerUps: { ...state.powerUps },
    status: state.status,
  };
}

interface SlideResult {
  blocks: Block[];
  matchArea: MatchArea;
  removed: string[];
  movedSteps: number;
}

/** Simulate a slide of the given block by `steps` cells (signed) along its
 *  current axis. Returns the new block list, match area, and accounting info.
 *  Handles cell-by-cell collision, exits, and arrow redirects. */
function simulateSlide(
  blocks: Block[],
  matchArea: MatchArea,
  grid: Grid,
  blockId: string,
  steps: number,
): SlideResult {
  let curBlocks = blocks.slice();
  let curArea = matchArea;
  const removed: string[] = [];
  let movedSteps = 0;

  let block = curBlocks.find((b) => b.id === blockId);
  if (!block || block.locked || steps === 0) {
    return { blocks: curBlocks, matchArea: curArea, removed, movedSteps };
  }

  let sign: -1 | 1 = steps > 0 ? 1 : -1;
  let stepsLeft = Math.abs(steps);

  while (stepsLeft > 0 && block) {
    const lead = leadingCell(block, sign);
    const u = unitFor(block.orientation, sign);
    const next = { r: lead.r + u.dr, c: lead.c + u.dc };

    if (!inBounds(grid, next.r, next.c)) {
      // Leading edge is at the grid boundary. If `lead` itself is an exit
      // matching our direction, the block has already transited on the prior
      // step; otherwise we cannot step further.
      break;
    }

    const cell = cellAt(grid, next.r, next.c);

    // Collision with another block?
    const occ = blockOccupiesSet(curBlocks, block.id);
    if (occ.has(key(next.r, next.c))) break;

    if (cell.kind === 'wall') break;

    if (cell.kind === 'exit') {
      const blockDir: Dir =
        block.orientation === 'horizontal'
          ? sign === 1
            ? 'right'
            : 'left'
          : sign === 1
            ? 'down'
            : 'up';
      if (cell.dir !== blockDir) break;
      // Transit: remove block, push to match area.
      curBlocks = curBlocks.filter((b) => b.id !== block!.id);
      curArea = pushSlot(curArea, block.color);
      removed.push(block.id);
      movedSteps += 1;
      stepsLeft = 0;
      block = undefined;
      break;
    }

    if (cell.kind === 'arrow') {
      // Advance one cell to align the leading edge on the arrow cell.
      const advanced = shiftAnchor(block, sign);
      // Replace in list.
      curBlocks = curBlocks.map((b) => (b.id === block!.id ? advanced : b));
      block = advanced;
      movedSteps += 1;
      stepsLeft -= 1;

      if (!isPerpendicular(block.orientation, cell.out)) {
        // Arrow points along the current axis — treat as floor, do not turn.
        continue;
      }
      // Pivot.
      const newOrientation: Orientation =
        cell.out === 'up' || cell.out === 'down' ? 'vertical' : 'horizontal';
      const pivot = pivotCells(
        { r: next.r, c: next.c },
        newOrientation,
        cell.out,
        block.length,
        grid,
      );
      if (!pivot) {
        // Off-grid: reject turn, stop.
        break;
      }
      // Validate rotated cells: must be floor/exit/arrow and not occupied by others.
      const others = blockOccupiesSet(curBlocks, block.id);
      let ok = true;
      for (const pc of pivot.cells) {
        if (others.has(key(pc.r, pc.c))) {
          ok = false;
          break;
        }
        const k = cellAt(grid, pc.r, pc.c);
        if (k.kind === 'wall') {
          ok = false;
          break;
        }
      }
      if (!ok) break;
      const rotated: Block = { ...block, orientation: newOrientation, anchor: pivot.anchor };
      curBlocks = curBlocks.map((b) => (b.id === block!.id ? rotated : b));
      block = rotated;
      sign = cell.out === 'down' || cell.out === 'right' ? 1 : -1;
      continue;
    }

    // Floor — just advance.
    const advanced = shiftAnchor(block, sign);
    curBlocks = curBlocks.map((b) => (b.id === block!.id ? advanced : b));
    block = advanced;
    movedSteps += 1;
    stepsLeft -= 1;
  }

  return { blocks: curBlocks, matchArea: curArea, removed, movedSteps };
}

export function maxSlide(state: GameState, blockId: string, sign: -1 | 1): number {
  // Probe by simulating a very long slide. Returns the achievable step count
  // (does not account for transit — i.e. if the block exits it returns the
  // step count up to and including the exit cell).
  const res = simulateSlide(state.blocks, state.matchArea, state.grid, blockId, sign * 999);
  return res.movedSteps;
}

export function slide(state: GameState, blockId: string, steps: number): GameState {
  if (state.status !== 'playing') return state;
  if (steps === 0) return state;
  const block = state.blocks.find((b) => b.id === blockId);
  if (!block || block.locked) return state;

  const snap = snapshot(state);
  const res = simulateSlide(state.blocks, state.matchArea, state.grid, blockId, steps);
  if (res.movedSteps === 0) return state;

  let next: GameState = {
    ...state,
    blocks: res.blocks,
    matchArea: res.matchArea,
    moves: state.moves + 1,
    history: [...state.history.slice(-19), snap],
  };

  if (res.removed.length > 0) {
    next = releaseLocks(next, res.removed);
  }

  const popResult = popMatches(next);
  next = popResult.state;
  if (popResult.poppedAny) {
    // Lock-release on match-3: any keyless locked block unlocks when a pop
    // happens. (Locks with unlockKey unlocked above by id-match.)
    next = releaseLocksOnPop(next);
  }

  // Status updates.
  if (next.blocks.length === 0) {
    next = { ...next, status: 'won' };
  } else if (next.moveLimit !== null && next.moves >= next.moveLimit && next.blocks.length > 0) {
    next = { ...next, status: 'lost' };
  } else if (isGridlock(next)) {
    next = { ...next, status: 'gridlock' };
  }
  return next;
}

function isGridlock(state: GameState): boolean {
  const allFilled = state.matchArea.slots.every((s) => s !== null);
  if (!allFilled) return false;
  const probe = popMatches(state);
  return !probe.poppedAny;
}

export function isWon(state: GameState): boolean {
  return state.status === 'won' || state.blocks.length === 0;
}

export function isLost(state: GameState): boolean {
  return state.status === 'lost' || state.status === 'gridlock';
}

export function undo(state: GameState): GameState {
  if (state.history.length === 0) return state;
  if (state.powerUps.undo <= 0) return state;
  const prev = state.history[state.history.length - 1]!;
  const history = state.history.slice(0, -1);
  return {
    ...state,
    blocks: prev.blocks.map((b) => ({ ...b, anchor: { ...b.anchor } })),
    matchArea: { ...prev.matchArea, slots: prev.matchArea.slots.slice() },
    moves: prev.moves,
    powerUps: { ...state.powerUps, undo: state.powerUps.undo - 1 },
    status: prev.status,
    history,
  };
}

export function shuffle(state: GameState, rng: () => number = Math.random): GameState {
  if (state.powerUps.shuffle <= 0) return state;
  if (state.blocks.length === 0) return state;
  // Collect every floor/exit/arrow cell available.
  const free: { r: number; c: number }[] = [];
  for (let r = 0; r < state.grid.rows; r++) {
    for (let c = 0; c < state.grid.cols; c++) {
      const cell = cellAt(state.grid, r, c);
      if (cell.kind === 'floor' || cell.kind === 'arrow') free.push({ r, c });
    }
  }
  // Try a few placement attempts; preserve color/length/orientation/lock.
  for (let attempt = 0; attempt < 60; attempt++) {
    const occupied = new Set<number>();
    const newBlocks: Block[] = [];
    let ok = true;
    // Place blocks in random order.
    const order = state.blocks.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    for (const i of order) {
      const b = state.blocks[i]!;
      // Find a random anchor cell.
      const candidates = free.slice();
      for (let k = candidates.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        [candidates[k], candidates[j]] = [candidates[j]!, candidates[k]!];
      }
      let placed: Block | null = null;
      for (const cell of candidates) {
        const probe: Block = { ...b, anchor: { r: cell.r, c: cell.c } };
        const probeCells = blockCells(probe);
        let fits = true;
        for (const pc of probeCells) {
          if (!inBounds(state.grid, pc.r, pc.c)) {
            fits = false;
            break;
          }
          const cellKind = cellAt(state.grid, pc.r, pc.c).kind;
          if (cellKind === 'wall' || cellKind === 'exit') {
            fits = false;
            break;
          }
          if (occupied.has(key(pc.r, pc.c))) {
            fits = false;
            break;
          }
        }
        if (fits) {
          placed = probe;
          for (const pc of probeCells) occupied.add(key(pc.r, pc.c));
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
      newBlocks.push(placed);
    }
    if (ok) {
      // Re-sort to original id order so React keys remain stable.
      const byId = new Map(newBlocks.map((b) => [b.id, b]));
      const reordered = state.blocks.map((b) => byId.get(b.id) ?? b);
      return {
        ...state,
        blocks: reordered,
        powerUps: { ...state.powerUps, shuffle: state.powerUps.shuffle - 1 },
      };
    }
  }
  return state;
}

export function expandSidebar(state: GameState): GameState {
  if (state.powerUps.expand <= 0) return state;
  if (state.matchArea.capacity === 8) return state;
  return {
    ...state,
    matchArea: {
      ...state.matchArea,
      capacity: 8,
      slots: [...state.matchArea.slots, null],
    },
    powerUps: { ...state.powerUps, expand: state.powerUps.expand - 1 },
  };
}
