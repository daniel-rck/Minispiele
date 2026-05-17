import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { CategoryAccent } from './Card';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  accent?: CategoryAccent;
  icon?: ReactNode;
}

const accentActiveBg: Record<CategoryAccent, string> = {
  logik: 'bg-[var(--color-cat-logik)] text-white border-[var(--color-cat-logik)]',
  wort: 'bg-[var(--color-cat-wort)] text-white border-[var(--color-cat-wort)]',
  action: 'bg-[var(--color-cat-action)] text-white border-[var(--color-cat-action)]',
  gehirntraining:
    'bg-[var(--color-cat-gehirntraining)] text-white border-[var(--color-cat-gehirntraining)]',
  karten: 'bg-[var(--color-cat-karten)] text-white border-[var(--color-cat-karten)]',
  werkzeuge: 'bg-[var(--color-cat-werkzeuge)] text-white border-[var(--color-cat-werkzeuge)]',
};

const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active = false, accent, icon, className = '', children, type = 'button', ...rest },
  ref,
) {
  const base =
    'inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors duration-150';
  const activeStyle = accent
    ? accentActiveBg[accent]
    : 'border-primary-500 bg-primary-500 text-white';
  const inactiveStyle =
    'border-surface-200 bg-white text-surface-700 hover:border-primary-400 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-400';
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={`${base} ${active ? activeStyle : inactiveStyle} ${className}`.trim()}
      {...rest}
    >
      {icon ? (
        <span aria-hidden className="inline-flex">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

export default Chip;
