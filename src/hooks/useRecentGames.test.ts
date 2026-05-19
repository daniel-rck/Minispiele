import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/constants';
import { useRecentGames } from './useRecentGames';

describe('useRecentGames', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useRecentGames());
    expect(result.current.recent).toEqual([]);
    expect(result.current.topSlugs).toEqual([]);
  });

  it('records a play and exposes it as topSlug', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => result.current.markPlayed('snake', 100));
    expect(result.current.recent).toEqual([{ slug: 'snake', at: 100 }]);
    expect(result.current.topSlugs).toEqual(['snake']);
  });

  it('moves a re-played game to the front (MRU)', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => result.current.markPlayed('snake', 100));
    act(() => result.current.markPlayed('wordle', 200));
    act(() => result.current.markPlayed('snake', 300));
    expect(result.current.topSlugs).toEqual(['snake', 'wordle']);
    expect(result.current.recent[0]).toEqual({ slug: 'snake', at: 300 });
  });

  it('caps at 20 entries (ring buffer)', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.markPlayed(`game-${i}`, i);
      }
    });
    expect(result.current.recent).toHaveLength(20);
    expect(result.current.recent[0]?.slug).toBe('game-24');
  });

  it('topSlugs returns max 6', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.markPlayed(`game-${i}`, i);
      }
    });
    expect(result.current.topSlugs).toHaveLength(6);
  });

  it('clear empties the list', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => result.current.markPlayed('snake', 100));
    act(() => result.current.clear());
    expect(result.current.recent).toEqual([]);
  });

  it('persists via localStorage and recovers from corrupt data', () => {
    window.localStorage.setItem(STORAGE_KEYS.RECENT_GAMES, 'not-json');
    const { result } = renderHook(() => useRecentGames());
    expect(result.current.recent).toEqual([]);
  });

  it('ignores empty slug', () => {
    const { result } = renderHook(() => useRecentGames());
    act(() => result.current.markPlayed('', 100));
    expect(result.current.recent).toEqual([]);
  });
});
