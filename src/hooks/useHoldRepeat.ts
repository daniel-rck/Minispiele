import { useCallback, useEffect, useRef } from 'react';

interface UseHoldRepeatOptions {
  initialDelayMs?: number;
  repeatMs?: number;
}

/**
 * Press-and-hold auto-repeat for on-screen buttons (d-pads etc.).
 * Fires `action` once on pointerdown, then repeats while held.
 * Keyboard activation (Enter/Space → click with detail 0) still works.
 * Spread the returned handlers onto a <button>; do not add your own onClick.
 */
export function useHoldRepeat(
  action: () => void,
  { initialDelayMs = 220, repeatMs = 90 }: UseHoldRepeatOptions = {},
) {
  const actionRef = useRef(action);
  actionRef.current = action;
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stop();
      actionRef.current();
      const schedule = (delay: number) => {
        timerRef.current = window.setTimeout(() => {
          actionRef.current();
          schedule(repeatMs);
        }, delay);
      };
      schedule(initialDelayMs);
    },
    [initialDelayMs, repeatMs, stop],
  );

  const onClick = useCallback((e: React.MouseEvent) => {
    // detail === 0 → keyboard activation (Enter/Space); pointer taps already
    // fired via onPointerDown and must not double-trigger here
    if (e.detail === 0) actionRef.current();
  }, []);

  return {
    onPointerDown,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick,
  };
}
