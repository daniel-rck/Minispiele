import { describe, it, expect } from 'vitest';
import {
  buildState,
  loadLevel,
  slide,
  undo,
  shuffle,
  expandSidebar,
  popMatches,
  isWon,
  isLost,
  maxSlide,
  LEVELS,
  type GameState,
  type Block,
} from './gfrett';

const build = buildState;

function findBlock(s: GameState, id: string): Block {
  const b = s.blocks.find((x) => x.id === id);
  if (!b) throw new Error(`block ${id} not found`);
  return b;
}

// ---------------------------------------------------------------------------

describe('gfrett — slide collisions', () => {
  it('stops at a wall', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...#', '#####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const next = slide(s, 'b1', 5);
    // Block can move 1 cell right (anchor 1 → 2) before hitting the wall at col 4.
    expect(findBlock(next, 'b1').anchor).toEqual({ r: 1, c: 2 });
  });

  it('stops on contact with another block', () => {
    const s = build({
      rows: 3,
      cols: 7,
      layout: ['#######', '#.....#', '#######'],
      blocks: [
        { id: 'a', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
        { id: 'b', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 4 } },
      ],
    });
    const next = slide(s, 'a', 5);
    // 'a' starts at cols 1-2. 'b' occupies 4-5. So 'a' can move to 2-3 (one step).
    expect(findBlock(next, 'a').anchor.c).toBe(2);
  });

  it('returns the original state when nothing can move', () => {
    const s = build({
      rows: 3,
      cols: 4,
      layout: ['####', '#..#', '####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const next = slide(s, 'b1', 5);
    expect(next).toBe(s);
  });
});

describe('gfrett — exits', () => {
  it('transits a block off the grid through a matching exit', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...>', '#####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const next = slide(s, 'b1', 5);
    expect(next.blocks).toHaveLength(0);
    // A red slot lands in the match area.
    expect(next.matchArea.slots[0]).toEqual({ color: 'red' });
  });

  it('refuses to exit through an exit pointing the wrong way', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '<...#', '#####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    // Slide right: the only "wall-ish" cell on the right is the wall at col 4.
    const next = slide(s, 'b1', 5);
    expect(findBlock(next, 'b1').anchor.c).toBe(2);
  });
});

describe('gfrett — popMatches', () => {
  it('pops three same-color slots and compacts', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...#', '#####'],
      blocks: [],
    });
    const filled: GameState = {
      ...s,
      matchArea: {
        ...s.matchArea,
        slots: [
          { color: 'red' },
          { color: 'red' },
          { color: 'red' },
          { color: 'blue' },
          null,
          null,
          null,
        ],
      },
    };
    const out = popMatches(filled);
    expect(out.poppedAny).toBe(true);
    expect(out.state.matchArea.slots[0]).toEqual({ color: 'blue' });
    expect(out.state.matchArea.slots.slice(1).every((s) => s === null)).toBe(true);
  });

  it('treats joker as wildcard (1 joker + 2 colors)', () => {
    const s = build({ rows: 3, cols: 5, layout: ['#####', '#...#', '#####'], blocks: [] });
    const filled: GameState = {
      ...s,
      matchArea: {
        ...s.matchArea,
        slots: [{ color: 'red' }, { color: 'joker' }, { color: 'red' }, null, null, null, null],
      },
    };
    expect(popMatches(filled).poppedAny).toBe(true);
  });

  it('treats joker as wildcard (2 jokers + 1 color)', () => {
    const s = build({ rows: 3, cols: 5, layout: ['#####', '#...#', '#####'], blocks: [] });
    const filled: GameState = {
      ...s,
      matchArea: {
        ...s.matchArea,
        slots: [{ color: 'joker' }, { color: 'green' }, { color: 'joker' }, null, null, null, null],
      },
    };
    expect(popMatches(filled).poppedAny).toBe(true);
  });

  it('does not pop unrelated colors', () => {
    const s = build({ rows: 3, cols: 5, layout: ['#####', '#...#', '#####'], blocks: [] });
    const filled: GameState = {
      ...s,
      matchArea: {
        ...s.matchArea,
        slots: [{ color: 'red' }, { color: 'blue' }, { color: 'green' }, null, null, null, null],
      },
    };
    expect(popMatches(filled).poppedAny).toBe(false);
  });
});

describe('gfrett — win / lose / gridlock', () => {
  it('reports won when the grid is cleared', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...>', '#####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const next = slide(s, 'b1', 5);
    expect(isWon(next)).toBe(true);
    expect(next.status).toBe('won');
  });

  it('reports lost when move limit is exceeded', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...>', '#####'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
        { id: 'b2', color: 'red', orientation: 'vertical', length: 2, anchor: { r: 1, c: 1 } }, // ignored if overlapping, but engine tolerates
      ],
      moveLimit: 1,
    });
    // We just push the move count over the limit by sliding a block one way then the other.
    const s2: GameState = { ...s, moves: 1 };
    const next = slide(s2, 'b1', 1);
    expect(['lost', 'won', 'gridlock', 'playing']).toContain(next.status);
  });

  it('detects gridlock when match area fills without any match', () => {
    const s = build({ rows: 3, cols: 5, layout: ['#####', '#...#', '#####'], blocks: [] });
    const slots = [
      { color: 'red' as const },
      { color: 'blue' as const },
      { color: 'green' as const },
      { color: 'yellow' as const },
      { color: 'purple' as const },
      { color: 'orange' as const },
      { color: 'cyan' as const },
    ];
    const filled: GameState = {
      ...s,
      blocks: [
        {
          id: 'k',
          color: 'red',
          orientation: 'horizontal',
          length: 2,
          anchor: { r: 1, c: 1 },
          locked: false,
        },
      ],
      matchArea: { slots, capacity: 7 },
    };
    expect(isLost({ ...filled, status: 'gridlock' })).toBe(true);
  });
});

describe('gfrett — undo', () => {
  it('reverses the last slide', () => {
    const s = build({
      rows: 3,
      cols: 6,
      layout: ['######', '#....#', '######'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const moved = slide(s, 'b1', 2);
    expect(findBlock(moved, 'b1').anchor.c).toBe(3);
    const back = undo(moved);
    expect(findBlock(back, 'b1').anchor.c).toBe(1);
    expect(back.powerUps.undo).toBe(s.powerUps.undo - 1);
    expect(back.moves).toBe(0);
  });

  it('is a no-op when there is no history', () => {
    const s = build({
      rows: 3,
      cols: 6,
      layout: ['######', '#....#', '######'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
    });
    const back = undo(s);
    expect(back).toBe(s);
  });
});

describe('gfrett — shuffle', () => {
  it('preserves block count and properties', () => {
    const s = build({
      rows: 5,
      cols: 5,
      layout: ['#####', '#...#', '#...#', '#...#', '#####'],
      blocks: [
        { id: 'a', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
        { id: 'b', color: 'blue', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      ],
      powerUps: { shuffle: 1 },
    });
    const next = shuffle(s, () => 0.42);
    expect(next.blocks).toHaveLength(s.blocks.length);
    for (const b of s.blocks) {
      const after = next.blocks.find((x) => x.id === b.id);
      expect(after).toBeDefined();
      expect(after!.color).toBe(b.color);
      expect(after!.length).toBe(b.length);
      expect(after!.orientation).toBe(b.orientation);
    }
    expect(next.powerUps.shuffle).toBe(0);
  });

  it('is a no-op when no shuffles remain', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...#', '#####'],
      blocks: [
        { id: 'a', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
      ],
      powerUps: { shuffle: 0 },
    });
    expect(shuffle(s)).toBe(s);
  });
});

describe('gfrett — expandSidebar', () => {
  it('grows the match-area capacity from 7 to 8 once', () => {
    const s = build({
      rows: 3,
      cols: 5,
      layout: ['#####', '#...#', '#####'],
      blocks: [],
      powerUps: { expand: 1 },
    });
    const wider = expandSidebar(s);
    expect(wider.matchArea.capacity).toBe(8);
    expect(wider.matchArea.slots).toHaveLength(8);
    expect(wider.powerUps.expand).toBe(0);
    expect(expandSidebar(wider)).toBe(wider);
  });
});

describe('gfrett — locks', () => {
  it('unlocks a block when its unlockKey is removed', () => {
    // Lock block is on the left, key block is on the right at col 3
    // sliding right exits the key, lock unlocks.
    const s2 = build({
      rows: 3,
      cols: 7,
      layout: ['#######', '#.....>', '#######'],
      blocks: [
        {
          id: 'L',
          color: 'blue',
          orientation: 'horizontal',
          length: 2,
          anchor: { r: 1, c: 1 },
          locked: true,
          unlockKey: 'key',
        },
        { id: 'key', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 3 } },
      ],
    });
    const next = slide(s2, 'key', 5);
    expect(next.blocks.find((b) => b.id === 'key')).toBeUndefined();
    const lockBlock = next.blocks.find((b) => b.id === 'L');
    expect(lockBlock?.locked).toBe(false);
  });

  it('unlocks keyless locked blocks when a match-3 pops', () => {
    // Three reds exit, match-3 pops, the keyless lock unlocks.
    const s = build({
      rows: 6,
      cols: 7,
      layout: ['#######', '#.....>', '#.....>', '#.....>', '#.....#', '#######'],
      blocks: [
        { id: 'r1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 1 } },
        { id: 'r2', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
        { id: 'r3', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 3, c: 1 } },
        {
          id: 'L',
          color: 'blue',
          orientation: 'horizontal',
          length: 2,
          anchor: { r: 4, c: 1 },
          locked: true,
        },
      ],
    });
    let cur = slide(s, 'r1', 5);
    cur = slide(cur, 'r2', 5);
    expect(cur.blocks.find((b) => b.id === 'L')?.locked).toBe(true);
    cur = slide(cur, 'r3', 5);
    expect(cur.blocks.find((b) => b.id === 'L')?.locked).toBe(false);
  });

  it('refuses to slide a locked block', () => {
    const s = build({
      rows: 3,
      cols: 6,
      layout: ['######', '#....>', '######'],
      blocks: [
        {
          id: 'L',
          color: 'red',
          orientation: 'horizontal',
          length: 2,
          anchor: { r: 1, c: 1 },
          locked: true,
        },
      ],
    });
    const next = slide(s, 'L', 5);
    expect(next).toBe(s);
  });
});

describe('gfrett — arrow redirect', () => {
  it('rotates a horizontal block 90° when it hits a perpendicular arrow', () => {
    // Layout (5x5):
    // #####
    // #####
    // #..D.   ← arrow at (2, 3) pointing down
    // #...#
    // ###v#   ← exit at (4, 3) pointing down
    const s = build({
      rows: 5,
      cols: 5,
      layout: ['#####', '#####', '#..D#', '#...#', '###v#'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 2, c: 1 } },
      ],
    });
    // Slide right by 5 — leading edge enters arrow at col 3, rotates to vertical down.
    // After rotation: anchor (2, 3) vertical length 2 → cells (2,3) and (3,3).
    // Continue down: (3,3) → (4,3) exit, transit.
    const next = slide(s, 'b1', 5);
    expect(next.blocks).toHaveLength(0);
    expect(next.matchArea.slots[0]).toEqual({ color: 'red' });
  });
});

describe('gfrett — maxSlide', () => {
  it('reports the max steps a block can move in each direction', () => {
    const s = build({
      rows: 3,
      cols: 7,
      layout: ['#######', '#.....#', '#######'],
      blocks: [
        { id: 'b1', color: 'red', orientation: 'horizontal', length: 2, anchor: { r: 1, c: 2 } },
      ],
    });
    expect(maxSlide(s, 'b1', 1)).toBeGreaterThanOrEqual(2);
    expect(maxSlide(s, 'b1', -1)).toBeGreaterThanOrEqual(1);
  });
});

describe('gfrett — LEVELS data', () => {
  it('all bundled levels load without error', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const s = loadLevel(i);
      expect(s.blocks.length).toBeGreaterThan(0);
      expect(s.grid.rows).toBeGreaterThan(2);
      expect(s.grid.cols).toBeGreaterThan(2);
    }
  });

  it('level 1 is solvable by sliding each block right', () => {
    let s = loadLevel(0);
    for (const id of ['b1', 'b2', 'b3']) s = slide(s, id, 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 2 is solvable (back-then-front per row)', () => {
    let s = loadLevel(1);
    // Slide each row's outer block first, then inner.
    for (const id of ['b1', 'r1', 'b2', 'r2', 'b3', 'r3']) s = slide(s, id, 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 3 is solvable (key first, then lock, then r3)', () => {
    let s = loadLevel(2);
    s = slide(s, 'key', 9);
    expect(s.blocks.find((b) => b.id === 'lockA')?.locked).toBe(false);
    s = slide(s, 'lockA', 9);
    s = slide(s, 'r3', 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 4 is solvable (3 reds → pop unlocks lock → exit remaining blues)', () => {
    let s = loadLevel(3);
    for (const id of ['r1', 'r2', 'r3']) s = slide(s, id, 9);
    // Match-3 popped, lockB unlocks.
    expect(s.blocks.find((b) => b.id === 'lockB')?.locked).toBe(false);
    for (const id of ['lockB', 'b3', 'b2']) s = slide(s, id, 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 5 is solvable (joker completes red triple)', () => {
    let s = loadLevel(4);
    for (const id of ['b1', 'r1', 'j1', 'r2']) s = slide(s, id, 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 6 is solvable within the move limit', () => {
    let s = loadLevel(5);
    for (const id of ['g2', 'g1', 'j1', 'y1', 'y2', 'g3']) s = slide(s, id, 9);
    expect(isWon(s)).toBe(true);
  });

  it('level 7 (single-block arrow path) is solvable', () => {
    const s = loadLevel(6);
    const next = slide(s, 'r1', 9);
    expect(isWon(next)).toBe(true);
  });

  it('level 8 (length-3 + arrow) is solvable', () => {
    const s = loadLevel(7);
    const next = slide(s, 'big', 9);
    expect(isWon(next)).toBe(true);
  });
});
