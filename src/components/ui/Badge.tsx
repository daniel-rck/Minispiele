import type { HTMLAttributes } from 'react';

type BadgeVariant = 'neutral' | 'primary' | 'accent' | 'success' | 'danger';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-200',
  accent: 'bg-accent-500 text-white',
  success: 'bg-success-500 text-white',
  danger: 'bg-danger-500 text-white',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] rounded-full',
  md: 'px-2.5 py-1 text-xs rounded-full',
};

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-bold ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
