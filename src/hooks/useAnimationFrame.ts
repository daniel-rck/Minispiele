import { useEffect, useRef } from 'react';

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
      const delta = now - prev;
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
