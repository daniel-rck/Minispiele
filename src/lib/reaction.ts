export const REACTION_MIN_WAIT_MS = 1200;
export const REACTION_MAX_WAIT_MS = 3800;

export function pickWaitDelay(
  min: number = REACTION_MIN_WAIT_MS,
  max: number = REACTION_MAX_WAIT_MS,
  rng: () => number = Math.random,
): number {
  return min + rng() * (max - min);
}

export function computeBest(currentMs: number, best: number | null): number | null {
  if (best === null || currentMs < best) return currentMs;
  return null;
}
