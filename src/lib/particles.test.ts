import { describe, expect, it } from 'vitest';
import { particleOpacity, spawnBurst, stepParticles } from './particles';

describe('particles', () => {
  it('spawnBurst produces requested count of particles', () => {
    const ps = spawnBurst({ x: 10, y: 20, count: 12, speed: 2, color: '#fff' });
    expect(ps).toHaveLength(12);
    for (const p of ps) {
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
      expect(p.color).toBe('#fff');
      expect(p.life).toBe(p.maxLife);
    }
  });

  it('spawnBurst spreads velocities across the circle', () => {
    const ps = spawnBurst({
      x: 0,
      y: 0,
      count: 16,
      speed: 1,
      color: '#fff',
      rng: () => 0,
    });
    const angles = new Set(ps.map((p) => Math.atan2(p.vy, p.vx).toFixed(2)));
    expect(angles.size).toBeGreaterThan(8);
  });

  it('stepParticles advances position and reduces life', () => {
    const ps = spawnBurst({
      x: 0,
      y: 0,
      count: 4,
      speed: 1,
      color: '#fff',
      lifeMs: 1000,
      rng: () => 0,
    });
    const next = stepParticles(ps, 16);
    expect(next).toHaveLength(4);
    for (let i = 0; i < ps.length; i++) {
      expect(next[i]!.life).toBeLessThan(ps[i]!.life);
    }
  });

  it('stepParticles removes dead particles', () => {
    const ps = spawnBurst({ x: 0, y: 0, count: 3, speed: 0, color: '#fff', lifeMs: 100 });
    const next = stepParticles(ps, 200);
    expect(next).toHaveLength(0);
  });

  it('stepParticles applies gravity to vy', () => {
    const ps = spawnBurst({
      x: 0,
      y: 0,
      count: 1,
      speed: 0,
      color: '#fff',
      lifeMs: 1000,
      rng: () => 0,
    });
    const next = stepParticles(ps, 16, 0.5);
    expect(next[0]!.vy).toBeGreaterThan(ps[0]!.vy);
  });

  it('particleOpacity is 1 at spawn and 0 at death', () => {
    const p = spawnBurst({ x: 0, y: 0, count: 1, speed: 0, color: '#fff', lifeMs: 1000 })[0]!;
    expect(particleOpacity(p)).toBeCloseTo(1, 2);
    expect(particleOpacity({ ...p, life: 0 })).toBe(0);
    expect(particleOpacity({ ...p, life: 500 })).toBeCloseTo(0.5, 2);
  });
});
