import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export type CategoryAccent =
  | 'logik'
  | 'wort'
  | 'action'
  | 'gehirntraining'
  | 'karten'
  | 'werkzeuge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accent?: CategoryAccent;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const accentBg: Record<CategoryAccent, string> = {
  logik: 'bg-[var(--color-cat-logik-soft)]',
  wort: 'bg-[var(--color-cat-wort-soft)]',
  action: 'bg-[var(--color-cat-action-soft)]',
  gehirntraining: 'bg-[var(--color-cat-gehirntraining-soft)]',
  karten: 'bg-[var(--color-cat-karten-soft)]',
  werkzeuge: 'bg-[var(--color-cat-werkzeuge-soft)]',
};

const accentBorder: Record<CategoryAccent, string> = {
  logik: 'border-l-[var(--color-cat-logik)]',
  wort: 'border-l-[var(--color-cat-wort)]',
  action: 'border-l-[var(--color-cat-action)]',
  gehirntraining: 'border-l-[var(--color-cat-gehirntraining)]',
  karten: 'border-l-[var(--color-cat-karten)]',
  werkzeuge: 'border-l-[var(--color-cat-werkzeuge)]',
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, accent, padding = 'none', className = '', children, ...rest },
  ref,
) {
  const base = 'block rounded-2xl overflow-hidden transition-[transform,box-shadow]';
  const bg = accent ? accentBg[accent] : 'bg-white dark:bg-surface-900';
  const border = accent
    ? `border border-surface-200/60 border-l-4 ${accentBorder[accent]} dark:border-surface-700`
    : 'border border-surface-200 dark:border-surface-800';
  const hover = interactive
    ? 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_oklch(0_0_0/0.18)] cursor-pointer'
    : '';
  return (
    <div
      ref={ref}
      className={`${base} ${bg} ${border} ${paddingClasses[padding]} ${hover} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
