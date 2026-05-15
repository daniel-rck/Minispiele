import { useEffect, useState } from 'react';
import { ANIMATION } from '../lib/constants';

interface Props {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export default function AriaLive({ message, politeness = 'polite' }: Props) {
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (!message) {
      setDebounced('');
      return;
    }
    const id = window.setTimeout(() => setDebounced(message), ANIMATION.ARIA_LIVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  return (
    <div role="status" aria-live={politeness} aria-atomic="true" className="sr-only">
      {debounced}
    </div>
  );
}
