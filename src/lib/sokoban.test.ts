import { describe, it, expect } from 'vitest';
import { LEVELS, loadLevel, move, undo, isSolved } from './sokoban';

describe('sokoban', () => {
  it('loadLevel parses dimensions, walls, targets, boxes and player', () => {
    const s = loadLevel(0);
    const lvl = LEVELS[0]!;
    expect(s.rows).toBe(lvl.length);
    expect(s.cols).toBe(Math.max(...lvl.map((r) => r.length)));
    expect(s.walls.length).toBe(s.rows * s.cols);
    expect(s.targets.some((t) => t)).toBe(true);
    expect(s.boxes.some((b) => b)).toBe(true);
    expect(s.player).toBeGreaterThanOrEqual(0);
    expect(s.moves).toBe(0);
    expect(s.history).toEqual([]);
  });

  it('loadLevel wraps with modulo when index exceeds LEVELS', () => {
    expect(loadLevel(LEVELS.length).rows).toBe(loadLevel(0).rows);
  });

  it('move into a wall is a no-op', () => {
    // Synthetic 3x3 state: player in centre, walls on every neighbour.
    const wall: import('./sokoban').SokobanState = {
      rows: 3,
      cols: 3,
      walls: [true, true, true, true, false, true, true, true, true],
      targets: new Array(9).fill(false),
      boxes: new Array(9).fill(false),
      player: 4,
      moves: 0,
      history: [],
    };
    expect(move(wall, 'up').moves).toBe(0);
    expect(move(wall, 'down').moves).toBe(0);
    expect(move(wall, 'left').moves).toBe(0);
    expect(move(wall, 'right').moves).toBe(0);
  });

  it('move into open floor advances the player and records history', () => {
    const before = loadLevel(0);
    const after = move(before, 'left');
    if (after === before) {
      const alt = move(before, 'right');
      expect(alt.moves).toBe(1);
      expect(alt.player).not.toBe(before.player);
      expect(alt.history.length).toBe(1);
    } else {
      expect(after.moves).toBe(1);
      expect(after.player).not.toBe(before.player);
      expect(after.history.length).toBe(1);
    }
  });

  it('undo returns to the previous state', () => {
    const before = loadLevel(0);
    const after = move(before, 'right');
    if (after === before) return;
    const back = undo(after);
    expect(back.player).toBe(before.player);
    expect(back.moves).toBe(before.moves);
  });

  it('undo on a fresh state is a no-op', () => {
    const s = loadLevel(0);
    expect(undo(s)).toBe(s);
  });

  it('isSolved is false on a fresh level (boxes off targets)', () => {
    expect(isSolved(loadLevel(0))).toBe(false);
  });

  it('isSolved becomes true when all boxes sit on targets', () => {
    const s = loadLevel(0);
    const solved = {
      ...s,
      boxes: s.targets.slice(),
    };
    expect(isSolved(solved)).toBe(true);
  });
});
