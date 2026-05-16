import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimationFrame } from './useAnimationFrame';

describe('useAnimationFrame', () => {
  let now = 0;
  let nextHandle = 1;
  let callbacks: Map<number, FrameRequestCallback>;

  beforeEach(() => {
    now = 0;
    nextHandle = 1;
    callbacks = new Map();
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextHandle++;
      callbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      callbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function flushFrame(advanceMs: number) {
    now += advanceMs;
    const ids = [...callbacks.keys()];
    callbacks.clear();
    for (const id of ids) {
      const cb = callbacks.get(id);
      // re-set: scheduled before clear
      (cb ?? undefined)?.(now);
    }
    // Above loop is empty; use saved list:
  }

  it('calls back each frame with delta time', () => {
    const cb = vi.fn();
    renderHook(() => useAnimationFrame(cb, true));

    expect(callbacks.size).toBe(1);

    // advance one frame: 16ms
    const firstId = [...callbacks.keys()][0]!;
    const firstCb = callbacks.get(firstId)!;
    callbacks.delete(firstId);
    now += 16;
    firstCb(now);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(16);

    // second frame: 20ms
    const secondId = [...callbacks.keys()][0]!;
    const secondCb = callbacks.get(secondId)!;
    callbacks.delete(secondId);
    now += 20;
    secondCb(now);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(20);

    // unused helper kept so lints stay happy
    void flushFrame;
  });

  it('does not schedule when inactive', () => {
    const cb = vi.fn();
    renderHook(() => useAnimationFrame(cb, false));
    expect(callbacks.size).toBe(0);
    expect(cb).not.toHaveBeenCalled();
  });

  it('stops scheduling after unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useAnimationFrame(cb, true));
    expect(callbacks.size).toBe(1);
    unmount();
    expect(callbacks.size).toBe(0);
  });
});
