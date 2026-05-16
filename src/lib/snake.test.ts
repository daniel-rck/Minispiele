import { describe, it, expect } from 'vitest';
import { createInitialState, queueDirection, spawnFood, tick, tickIntervalMs } from './snake';

function seq(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe('snake', () => {
  it('createInitialState produces a 3-segment snake facing right with food spawned', () => {
    const s = createInitialState(10, 10, seq([0]));
    expect(s.snake).toHaveLength(3);
    expect(s.dir).toBe('right');
    expect(s.alive).toBe(true);
    expect(s.score).toBe(0);
    expect(s.food.x).toBeGreaterThanOrEqual(0);
    expect(s.food.y).toBeGreaterThanOrEqual(0);
    // Food must not start under the snake
    expect(s.snake.some((seg) => seg.x === s.food.x && seg.y === s.food.y)).toBe(false);
  });

  it('tick advances the head by one cell in the current direction', () => {
    const s = createInitialState(10, 10, seq([0.9])); // food in a corner away from snake
    const head = s.snake[0]!;
    const next = tick(s, seq([0.9]));
    expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
  });

  it('queueDirection refuses 180° reversals', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    // dir is 'right', so queuing 'left' should be a no-op
    const a = queueDirection(s, 'left');
    expect(a.pendingDir).toBe('right');
    const b = queueDirection(s, 'up');
    expect(b.pendingDir).toBe('up');
  });

  it('eating food grows the snake by one and increments the score', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    // Force food to be directly in front of the head
    const head = s.snake[0]!;
    const placed = { ...s, food: { x: head.x + 1, y: head.y } };
    const next = tick(placed, seq([0.5]));
    expect(next.snake).toHaveLength(s.snake.length + 1);
    expect(next.score).toBe(1);
    expect(next.alive).toBe(true);
  });

  it('walking off the grid sets alive=false', () => {
    const s = createInitialState(4, 4, seq([0.99])); // small board
    // Move right until we hit the wall
    let working = s;
    for (let i = 0; i < 4; i++) working = tick(working, seq([0.5]));
    expect(working.alive).toBe(false);
  });

  it('crashing into a non-tail body segment sets alive=false', () => {
    // Snake forms a U; moving the head up lands on a body segment that is
    // not the tail, so it does not vacate before the head arrives.
    const state = {
      snake: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 4 }, // <- target of the next move
        { x: 6, y: 4 },
        { x: 6, y: 5 },
      ],
      food: { x: 9, y: 9 },
      dir: 'up' as const,
      pendingDir: 'up' as const,
      cols: 10,
      rows: 10,
      alive: true,
      score: 0,
      tick: 0,
    };
    const next = tick(state, seq([0.5]));
    expect(next.alive).toBe(false);
  });

  it('spawnFood never places food on the snake', () => {
    let s = createInitialState(10, 10, seq([0.0]));
    for (let i = 0; i < 20; i++) {
      s = spawnFood(s, seq([Math.random()]));
      expect(s.snake.some((seg) => seg.x === s.food.x && seg.y === s.food.y)).toBe(false);
    }
  });

  it('tickIntervalMs shortens with score and clamps at min', () => {
    expect(tickIntervalMs(0)).toBe(180);
    expect(tickIntervalMs(10)).toBe(140);
    expect(tickIntervalMs(50)).toBe(80);
    expect(tickIntervalMs(500)).toBe(80);
  });

  it('tick is a no-op when not alive', () => {
    const s = createInitialState(10, 10, seq([0.5]));
    const dead = { ...s, alive: false };
    expect(tick(dead, seq([0.5]))).toBe(dead);
  });
});
