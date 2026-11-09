import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--alsm-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs';

  const variants = {
    primary:
      'bg-[var(--alsm-primary)] hover:bg-[var(--alsm-primary-hover)] active:bg-[var(--alsm-primary-hover)] text-[var(--alsm-surface)]',
    secondary:
      'bg-[var(--alsm-primary-soft)] text-[var(--alsm-primary)] hover:bg-[var(--alsm-primary)] hover:text-[var(--alsm-surface)] border border-transparent',
    outline:
      'bg-[var(--alsm-surface)] border border-[var(--alsm-border)] hover:border-[var(--alsm-text-muted)] text-[var(--alsm-text)] hover:bg-[var(--alsm-bg)]',
    ghost:
      'hover:bg-[var(--alsm-bg)] text-[var(--alsm-text-muted)] hover:text-[var(--alsm-text)] shadow-none',
    danger:
      'bg-[var(--alsm-danger)] hover:opacity-90 text-[var(--alsm-surface)]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
