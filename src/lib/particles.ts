export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface BurstOptions {
  x: number;
  y: number;
  count: number;
  speed: number;
  color: string;
  lifeMs?: number;
  size?: number;
  rng?: () => number;
}

export function spawnBurst(opts: BurstOptions): Particle[] {
  const rng = opts.rng ?? Math.random;
  const lifeMs = opts.lifeMs ?? 600;
  const size = opts.size ?? 3;
  const particles: Particle[] = [];
  for (let i = 0; i < opts.count; i++) {
    const angle = (i / opts.count) * Math.PI * 2 + rng() * 0.6;
    const speed = opts.speed * (0.6 + rng() * 0.8);
    particles.push({
      x: opts.x,
      y: opts.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: lifeMs,
      maxLife: lifeMs,
      color: opts.color,
      size,
    });
  }
  return particles;
}

export function stepParticles(
  particles: Particle[],
  deltaMs: number,
  gravity: number = 0,
): Particle[] {
  const dt = deltaMs / 16.6667; // normalize to ~60fps frame
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - deltaMs;
    if (life <= 0) continue;
    next.push({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + gravity * dt,
      life,
    });
  }
  return next;
}

export function particleOpacity(p: Particle): number {
  return Math.max(0, Math.min(1, p.life / p.maxLife));
}
