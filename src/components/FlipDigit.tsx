import { useEffect, useRef, useState } from 'react';

const FLIP_DURATION_MS = 300;

interface Props {
  digit: string;
  animate: boolean;
}

export default function FlipDigit({ digit, animate }: Props) {
  const [shown, setShown] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const swapRef = useRef<number | null>(null);
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (digit === shown) return;
    if (!animate) {
      setShown(digit);
      return;
    }
    if (swapRef.current !== null) window.clearTimeout(swapRef.current);
    if (endRef.current !== null) window.clearTimeout(endRef.current);
    setFlipping(true);
    swapRef.current = window.setTimeout(() => setShown(digit), FLIP_DURATION_MS / 2);
    endRef.current = window.setTimeout(() => setFlipping(false), FLIP_DURATION_MS);
  }, [digit, shown, animate]);

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
