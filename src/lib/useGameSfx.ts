import { useEffect, useRef } from 'react';
import { GameSfx } from './gameSfx';

/** Lazy-creates a single GameSfx instance per component and disposes it on unmount. */
export function useGameSfx(): GameSfx {
  const ref = useRef<GameSfx | null>(null);
  if (ref.current === null) ref.current = new GameSfx();
  useEffect(
    () => () => {
      ref.current?.dispose();
      ref.current = null;
    },
    [],
  );
  return ref.current;
}
