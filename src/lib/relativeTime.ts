const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeShort(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < MIN) return 'gerade eben';
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `vor ${m} Min`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `vor ${h} Std`;
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY);
    return d === 1 ? 'gestern' : `vor ${d} Tagen`;
  }
  const w = Math.floor(diff / WEEK);
  return w === 1 ? 'vor 1 Woche' : `vor ${w} Wochen`;
}

export function isToday(timestamp: number, now: number = Date.now()): boolean {
  return now - timestamp < DAY;
}
