import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg transition-all duration-150';

  const variants = {
    default: 'border border-[#D9E2EC] shadow-2xs',
    outline: 'border border-[#E5EAF0]',
    flat: 'bg-[#F8FAFC] border border-[#E5EAF0]',
    interactive: 'border border-[#D9E2EC] shadow-2xs hover:border-[#0652CC] hover:shadow-sm cursor-pointer',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], paddings[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
