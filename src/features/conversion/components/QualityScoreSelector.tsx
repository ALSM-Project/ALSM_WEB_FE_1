import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface QualityScoreSelectorProps {
  value: number | undefined;
  onChange: (score: number | undefined) => void;
  disabled?: boolean;
}

const SCORE_LABELS: Record<number, string> = {
  1: '1 - Very Poor',
  2: '2 - Poor',
  3: '3 - Fair / Average',
  4: '4 - Good',
  5: '5 - Excellent',
};

export const QualityScoreSelector: React.FC<QualityScoreSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const activeScore = hovered !== null ? hovered : value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Initial Conversion Quality Score">
        {[1, 2, 3, 4, 5].map((score) => {
          const isFilled = activeScore !== undefined && score <= activeScore;
          const isSelected = value === score;

          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={SCORE_LABELS[score]}
              disabled={disabled}
              onClick={() => {
                // If user clicks currently selected score, allow unselecting (optional) or setting
                onChange(value === score ? undefined : score);
              }}
              onMouseEnter={() => !disabled && setHovered(score)}
              onMouseLeave={() => !disabled && setHovered(null)}
              className={`p-1.5 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                disabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:scale-110 active:scale-95 cursor-pointer'
              }`}
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 dark:text-slate-600 hover:text-amber-200'
                }`}
              />
            </button>
          );
        })}
      </div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[1.25rem]">
        {activeScore ? SCORE_LABELS[activeScore] : <span className="text-slate-400 dark:text-slate-500 font-normal">Select a rating (optional)</span>}
      </div>
    </div>
  );
};
