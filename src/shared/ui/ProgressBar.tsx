import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
  color?: 'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'indigo',
  showPercentage = false,
}) => {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    indigo: 'bg-gradient-to-r from-[#0652CC] to-[#0655FF]',
    cyan: 'bg-gradient-to-r from-[#0655FF] to-[#22D3EE]',
    emerald: 'bg-gradient-to-r from-[#10B981] to-[#34D399]',
    rose: 'bg-gradient-to-r from-rose-600 to-rose-400',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-300',
  };

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full flex items-center space-x-3">
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full transition-all duration-500 rounded-full ${colors[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showPercentage && <span className="text-xs font-mono font-medium text-slate-600 min-w-[36px] text-right">{clamped}%</span>}
    </div>
  );
};
export default ProgressBar;
