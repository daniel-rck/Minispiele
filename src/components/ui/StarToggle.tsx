import { type MouseEvent, useState } from 'react';
import { useVibration } from '../../hooks/useVibration';

interface StarToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
}

export default function StarToggle({ active, onToggle, label }: StarToggleProps) {
  const [pop, setPop] = useState(false);
  const { vibrate } = useVibration();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPop(false);
    requestAnimationFrame(() => setPop(true));
    vibrate(10);
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm transition-colors hover:bg-white dark:bg-surface-900/70 dark:hover:bg-surface-900"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? 'var(--color-accent-500)' : 'none'}
        stroke={active ? 'var(--color-accent-600)' : 'var(--color-surface-500)'}
        strokeWidth="2"
        strokeLinejoin="round"
        className={pop ? 'star-pop' : ''}
        onAnimationEnd={() => setPop(false)}
        aria-hidden
      >
        <path d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.57L12 17.6l-5.9 3.1 1.13-6.57L2.45 9.46l6.6-.96L12 2.5z" />
      </svg>
    </button>
  );
}
