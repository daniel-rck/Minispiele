import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/constants';
import { useFavorites } from './useFavorites';

describe('useFavorites', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite('snake')).toBe(false);
  });

  it('toggle adds and removes', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite('snake'));
    expect(result.current.isFavorite('snake')).toBe(true);
    act(() => result.current.toggleFavorite('snake'));
    expect(result.current.isFavorite('snake')).toBe(false);
  });

  it('caps at 64 favorites', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      for (let i = 0; i < 70; i++) {
        result.current.toggleFavorite(`g-${i}`);
      }
    });
    expect(result.current.favorites).toHaveLength(64);
  });

  it('ignores empty slug', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite(''));
    expect(result.current.favorites).toEqual([]);
  });

  it('persists in localStorage', () => {
    const { result, unmount } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite('snake'));
    unmount();
    const raw = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
    expect(raw).toBe(JSON.stringify(['snake']));
  });

  it('recovers from corrupt data', () => {
    window.localStorage.setItem(STORAGE_KEYS.FAVORITES, '{}');
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });
});
