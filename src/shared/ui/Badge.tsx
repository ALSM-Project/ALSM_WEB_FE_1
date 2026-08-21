import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'processing' | 'warning' | 'danger' | 'neutral' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-[#ECFDF3] text-[#079455] border-[#ABEFC6]',
    processing: 'bg-[#EFF8FF] text-[#1570EF] border-[#B2DDFF]',
    warning: 'bg-[#FFFAEB] text-[#DC6803] border-[#FEDF89]',
    danger: 'bg-[#FEF3F2] text-[#D92D20] border-[#FECDCA]',
    neutral: 'bg-[#F8FAFC] text-[#344054] border-[#E2E8F0]',
    info: 'bg-[#EFF8FF] text-[#1570EF] border-[#B2DDFF]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
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
  if (['Completed', 'Active', 'Paid', 'Ready', 'Success'].includes(status)) variant = 'success';
  else if (['Processing', 'Uploading', 'Pending Parse', 'Queued'].includes(status)) variant = 'processing';
  else if (['Review Required', 'Warning', 'Trial'].includes(status)) variant = 'warning';
  else if (['Failed', 'Danger', 'Fatal', 'Failed to parse', 'Expired'].includes(status)) variant = 'danger';

  return <Badge variant={variant}>{status}</Badge>;
};
export default Badge;
