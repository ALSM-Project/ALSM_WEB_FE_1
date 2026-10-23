import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai';
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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#0652CC]/25 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-2xs',
    secondary: 'bg-[#F1F5F9] text-[#091E42] hover:bg-[#E2E8F0] border border-[#D9E2EC]',
    outline: 'bg-white border border-[#D9E2EC] hover:border-[#0652CC] text-[#091E42] hover:bg-[#F8FAFC] shadow-2xs',
    ghost: 'text-[#42526E] hover:text-[#091E42] hover:bg-[#F1F5F9]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs',
    ai: 'bg-[#091E42] hover:bg-[#132A52] text-white border border-slate-700 shadow-2xs',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
