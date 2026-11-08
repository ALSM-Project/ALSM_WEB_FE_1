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
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#244A70] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs';

  const variants = {
    primary:
      'bg-[#244A70] hover:bg-[#1B3856] active:bg-[#13283E] text-white shadow-xs',
    secondary:
      'bg-[#EEF1F6] text-[#244A70] hover:bg-[#DCE3EC] border border-[#DCE3EC] shadow-xs',
    outline:
      'bg-white border border-[#DCE3EC] hover:border-[#B8C7D9] hover:bg-[#F4F7FB] text-[#17263A] shadow-xs',
    ghost:
      'hover:bg-[#EEF1F6] text-[#17263A] hover:text-[#17263A] shadow-none',
    danger:
      'bg-rose-700 hover:bg-rose-800 text-white shadow-xs',
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
