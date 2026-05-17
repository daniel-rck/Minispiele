import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonVariant = 'ghost' | 'soft' | 'solid';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  pressed?: boolean;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'size-10',
  md: 'size-11',
  lg: 'size-12',
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    'bg-transparent text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800',
  soft: 'bg-surface-100 text-surface-800 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700',
  solid:
    'bg-primary-500 text-white shadow-[0_3px_0_0_var(--color-primary-700)] hover:bg-primary-400 active:translate-y-0.5 active:shadow-[0_0_0_0_var(--color-primary-700)]',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = 'ghost',
    size = 'md',
    pressed,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={`inline-flex items-center justify-center rounded-full transition-colors duration-150 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
      {...rest}
    >
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
    </button>
  );
});

export default IconButton;
