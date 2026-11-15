import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export interface UnsupportedProjectStateProps {
  conversionType?: string | null;
  backUrl?: string;
  backLabel?: string;
}

export const UnsupportedProjectState: React.FC<UnsupportedProjectStateProps> = ({
  conversionType,
  backUrl = '/projects',
  backLabel = 'Back to Projects List',
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 shadow-2xs space-y-5">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Unsupported Project Conversion Type</h2>
        <p className="text-xs sm:text-sm text-[#42526E] leading-relaxed max-w-md mx-auto">
          {conversionType
            ? `The project specifies an unsupported or invalid conversion type ("${conversionType}").`
            : 'The project is missing a persisted conversion type.'}
          {' '}Modernization workspace tools and conversion operations are disabled for this project.
        </p>
      </div>
      <div className="pt-2">
        <Button
          onClick={() => navigate(backUrl)}
          className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-2 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Button>
      </div>
    </div>
  );
};
