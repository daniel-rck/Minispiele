import { useCallback, useRef } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface UseSwipeDetectionOptions {
  threshold?: number;
  onSwipe: (direction: SwipeDirection) => void;
}

export function useSwipeDetection({ threshold = 24, onSwipe }: UseSwipeDetectionOptions) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = startRef.current;
      const t = e.changedTouches[0];
      startRef.current = null;
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < threshold) return;
      if (adx > ady) {
        onSwipe(dx > 0 ? 'right' : 'left');
      } else {
        onSwipe(dy > 0 ? 'down' : 'up');
      }
    },
    [threshold, onSwipe],
  );

  const onTouchCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
