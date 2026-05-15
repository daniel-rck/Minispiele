export const MIN_TIMER_SECONDS = 1;
export const MAX_TIMER_SECONDS = 99 * 60 + 59;

export function clampSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_TIMER_SECONDS;
  const rounded = Math.floor(seconds);
  if (rounded < MIN_TIMER_SECONDS) return MIN_TIMER_SECONDS;
  if (rounded > MAX_TIMER_SECONDS) return MAX_TIMER_SECONDS;
  return rounded;
}

export function formatRemaining(ms: number): string {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function splitSeconds(seconds: number): { minutes: number; seconds: number } {
  const safe = clampSeconds(seconds);
  return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
}

export function joinSeconds(minutes: number, seconds: number): number {
  const m = Math.max(0, Math.floor(minutes));
  const s = Math.max(0, Math.floor(seconds));
  return clampSeconds(m * 60 + s);
}
