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
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC]/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-[#F7F9FC] text-[#091E42] border-[#D9E2EC]',
    info: 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC]/30',
    ai: 'bg-[#0652CC]/15 text-[#22D3EE] border-[#22D3EE]/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border tracking-wide',
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
