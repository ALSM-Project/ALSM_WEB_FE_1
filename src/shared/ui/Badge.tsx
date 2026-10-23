import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'processing' | 'warning' | 'danger' | 'neutral' | 'info' | 'ai';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    processing: 'bg-[#E8F1FF] text-[#0652CC] border-blue-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    neutral: 'bg-[#F8FAFC] text-[#42526E] border-[#D9E2EC]',
    info: 'bg-[#E8F1FF] text-[#0652CC] border-blue-200',
    ai: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border tracking-normal',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant: BadgeProps['variant'] = 'neutral';
  const lower = status.toLowerCase();
  if (['completed', 'passed', 'active', 'ready', 'success', 'converted'].some((s) => lower.includes(s))) {
    variant = 'success';
  } else if (['processing', 'uploading', 'converting', 'analyzing', 'validating', 'queued'].some((s) => lower.includes(s))) {
    variant = 'processing';
  } else if (['review', 'required', 'warning', 'pending'].some((s) => lower.includes(s))) {
    variant = 'warning';
  } else if (['failed', 'error', 'danger', 'fatal'].some((s) => lower.includes(s))) {
    variant = 'danger';
  } else if (['draft'].some((s) => lower.includes(s))) {
    variant = 'neutral';
  }

  return <Badge variant={variant}>{status}</Badge>;
};
export default Badge;
