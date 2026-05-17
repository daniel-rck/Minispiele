import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm rounded-xl',
  md: 'min-h-12 px-5 text-sm rounded-2xl',
  lg: 'min-h-14 px-6 text-base rounded-2xl',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white shadow-[0_4px_0_0_var(--color-primary-700)] hover:bg-primary-400 active:translate-y-1 active:shadow-[0_0_0_0_var(--color-primary-700)] dark:shadow-[0_4px_0_0_var(--color-primary-800)] dark:active:shadow-[0_0_0_0_var(--color-primary-800)]',
  secondary:
    'bg-surface-100 text-surface-800 shadow-[0_3px_0_0_var(--color-surface-300)] hover:bg-surface-200 active:translate-y-0.5 active:shadow-[0_0_0_0_var(--color-surface-300)] dark:bg-surface-800 dark:text-surface-100 dark:shadow-[0_3px_0_0_var(--color-surface-900)] dark:active:shadow-[0_0_0_0_var(--color-surface-900)]',
  accent:
    'bg-accent-500 text-white shadow-[0_4px_0_0_var(--color-accent-700)] hover:bg-accent-400 active:translate-y-1 active:shadow-[0_0_0_0_var(--color-accent-700)]',
  success:
    'bg-success-500 text-white shadow-[0_4px_0_0_var(--color-success-700)] hover:bg-success-400 active:translate-y-1 active:shadow-[0_0_0_0_var(--color-success-700)]',
  danger:
    'bg-danger-500 text-white shadow-[0_4px_0_0_var(--color-danger-700)] hover:bg-danger-400 active:translate-y-1 active:shadow-[0_0_0_0_var(--color-danger-700)]',
  ghost:
    'bg-transparent text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    block = false,
    icon,
    loading = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-extrabold whitespace-nowrap transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-snappy)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0';
  const width = block ? 'w-full' : '';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${width} ${className}`.trim()}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon ? (
        <span aria-hidden className="-ml-0.5 inline-flex">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

export default Button;
