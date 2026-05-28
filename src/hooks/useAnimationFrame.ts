import { useEffect, useRef } from 'react';

// Clamp the per-frame delta. requestAnimationFrame pauses while the tab is
// hidden, so the first frame after returning would otherwise report the entire
// hidden duration as one delta — making time-based physics teleport. Capping at
// ~100ms (a few dropped frames) keeps motion continuous without a jump.
const MAX_FRAME_DELTA_MS = 100;

export function useAnimationFrame(
  callback: (deltaMs: number) => void,
  active: boolean = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined') return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - prev, MAX_FRAME_DELTA_MS);
      prev = now;
      callbackRef.current(delta);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [active]);
}
