import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type SwipeDirection, useSwipeDetection } from './useSwipeDetection';

function makeTouchEvent(x: number, y: number): React.TouchEvent {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  } as unknown as React.TouchEvent;
}

function fireSwipe(
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  },
  from: [number, number],
  to: [number, number],
) {
  act(() => {
    handlers.onTouchStart(makeTouchEvent(from[0], from[1]));
    handlers.onTouchEnd(makeTouchEvent(to[0], to[1]));
  });
}

describe('useSwipeDetection', () => {
  it('detects a right swipe when horizontal delta exceeds threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe }));
    fireSwipe(result.current, [0, 0], [50, 5]);
    expect(onSwipe).toHaveBeenCalledWith<[SwipeDirection]>('right');
  });

  it('detects a left swipe', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe }));
    fireSwipe(result.current, [100, 0], [40, 5]);
    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('detects a down swipe when vertical delta dominates', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe }));
    fireSwipe(result.current, [0, 0], [10, 60]);
    expect(onSwipe).toHaveBeenCalledWith('down');
  });

  it('detects an up swipe', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe }));
    fireSwipe(result.current, [0, 100], [5, 30]);
    expect(onSwipe).toHaveBeenCalledWith('up');
  });

  it('does not fire when movement is below threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe, threshold: 24 }));
    fireSwipe(result.current, [0, 0], [10, 10]);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('respects a custom threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeDetection({ onSwipe, threshold: 100 }));
    fireSwipe(result.current, [0, 0], [50, 0]);
    expect(onSwipe).not.toHaveBeenCalled();
    fireSwipe(result.current, [0, 0], [120, 0]);
    expect(onSwipe).toHaveBeenCalledWith('right');
  });
});
