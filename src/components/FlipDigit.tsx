import { useEffect, useRef, useState } from 'react';

const FLIP_DURATION_MS = 300;

interface Props {
  digit: string;
  animate: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FlipDigit({ digit, animate }: Props) {
  const [shown, setShown] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const swapRef = useRef<number | null>(null);
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    if (digit === shown) return;
    if (!animate || reducedMotion) {
      setShown(digit);
      return;
    }
    if (swapRef.current !== null) window.clearTimeout(swapRef.current);
    if (endRef.current !== null) window.clearTimeout(endRef.current);
    setFlipping(true);
    swapRef.current = window.setTimeout(() => setShown(digit), FLIP_DURATION_MS / 2);
    endRef.current = window.setTimeout(() => setFlipping(false), FLIP_DURATION_MS);
  }, [digit, shown, animate, reducedMotion]);

  useEffect(
    () => () => {
      if (swapRef.current !== null) window.clearTimeout(swapRef.current);
      if (endRef.current !== null) window.clearTimeout(endRef.current);
    },
    [],
  );

  return (
    <span className={`flip-digit${flipping ? ' flip-digit-active' : ''}`} aria-hidden>
      {shown}
    </span>
  );
}
