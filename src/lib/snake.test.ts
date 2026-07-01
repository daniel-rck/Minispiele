import { describe, expect, it } from 'vitest';
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
    expect(next.snake[0]).toMatchObject({ x: head.x + 1, y: head.y });
  });

  it('queueDirection refuses 180° reversals', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    // dir is 'right', so queuing 'left' should be a no-op
    const a = queueDirection(s, 'left');
    expect(a.dirQueue).toEqual([]);
    const b = queueDirection(s, 'up');
    expect(b.dirQueue).toEqual(['up']);
  });

  it('queueDirection validates against the last queued direction, not just the committed one', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    // dir is 'right'; queue 'up' then 'down' — 'down' reverses the queued 'up'
    const a = queueDirection(s, 'up');
    const b = queueDirection(a, 'down');
    expect(b.dirQueue).toEqual(['up']);
    // duplicates of the effective direction are ignored too
    const c = queueDirection(a, 'up');
    expect(c.dirQueue).toEqual(['up']);
  });

  it('keeps a two-turn combo and plays it out over two ticks', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    const head = s.snake[0]!;
    // moving right: quickly queue 'up' then 'left' (a fast corner maneuver)
    const queued = queueDirection(queueDirection(s, 'up'), 'left');
    expect(queued.dirQueue).toEqual(['up', 'left']);
    const t1 = tick(queued, seq([0.9]));
    expect(t1.dir).toBe('up');
    expect(t1.snake[0]).toMatchObject({ x: head.x, y: head.y - 1 });
    const t2 = tick(t1, seq([0.9]));
    expect(t2.dir).toBe('left');
    expect(t2.snake[0]).toMatchObject({ x: head.x - 1, y: head.y - 1 });
  });

  it('caps the direction queue at two entries', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    const q = queueDirection(queueDirection(queueDirection(s, 'up'), 'left'), 'down');
    expect(q.dirQueue).toEqual(['up', 'left']);
  });

  it('queueDirection is a no-op when dead', () => {
    const s = { ...createInitialState(10, 10, seq([0.9])), alive: false };
    expect(queueDirection(s, 'up')).toBe(s);
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
        { x: 5, y: 5, id: 0 },
        { x: 4, y: 5, id: 1 },
        { x: 4, y: 4, id: 2 },
        { x: 5, y: 4, id: 3 }, // <- target of the next move
        { x: 6, y: 4, id: 4 },
        { x: 6, y: 5, id: 5 },
      ],
      food: { x: 9, y: 9 },
      dir: 'up' as const,
      dirQueue: [],
      cols: 10,
      rows: 10,
      alive: true,
      score: 0,
      tick: 0,
      nextSegId: 6,
    };
    const next = tick(state, seq([0.5]));
    expect(next.alive).toBe(false);
  });

  it('assigns each new head segment a fresh stable id', () => {
    const s = createInitialState(10, 10, seq([0.9]));
    const next = tick(s, seq([0.9]));
    expect(next.snake[0]!.id).toBe(s.nextSegId);
    // the surviving body keeps its ids
    expect(next.snake.slice(1).map((seg) => seg.id)).toEqual(
      s.snake.slice(0, -1).map((seg) => seg.id),
    );
    const ids = new Set(next.snake.map((seg) => seg.id));
    expect(ids.size).toBe(next.snake.length);
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
