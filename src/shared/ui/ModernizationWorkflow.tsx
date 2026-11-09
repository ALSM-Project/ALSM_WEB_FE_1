import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export type WorkflowStepId =
  | 'upload'
  | 'analyze'
  | 'analysis'
  | 'mapping'
  | 'convert'
  | 'conversion'
  | 'validate'
  | 'validation'
  | 'review'
  | 'result'
  | 'export';

export interface WorkflowStep {
  id: string;
  label: string;
  sublabel: string;
  description: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'upload',
    label: 'Upload',
    sublabel: 'Source ingestion',
    description: 'Ingest legacy BMS/DSPF screen maps and COBOL source files.',
  },
  {
    id: 'convert',
    label: 'Convert',
    sublabel: 'Target code generation',
    description: 'The modernization engine generates target React components and DTOs.',
  },
  {
    id: 'validate',
    label: 'Validate',
    sublabel: 'Rule-based validation',
    description: 'Rule-based validation of generated components and data bindings.',
  },
  {
    id: 'export',
    label: 'Export',
    sublabel: 'Modernization package',
    description: 'Package modernized components and code artifacts for deployment.',
  },
];

// Helper to normalize legacy step IDs to 0-indexed step number
function getStepIndex(stepId: WorkflowStepId): number {
  switch (stepId) {
    case 'upload':
      return 0;
    case 'convert':
    case 'conversion':
    case 'analyze':
    case 'analysis':
    case 'mapping':
      return 1;
    case 'validate':
    case 'validation':
    case 'review':
      return 2;
    case 'result':
    case 'export':
      return 3;
    default:
      return 0;
  }
}

export interface ModernizationWorkflowProps {
  currentStep: WorkflowStepId;
  completedSteps?: WorkflowStepId[];
  onStepClick?: (stepId: WorkflowStepId) => void;
  onActionClick?: () => void;
  actionLabel?: string;
  className?: string;
}

export const ModernizationWorkflow: React.FC<ModernizationWorkflowProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
  onActionClick,
  actionLabel,
  className = '',
}) => {
  const currentIndex = getStepIndex(currentStep);
  const currentStepInfo = WORKFLOW_STEPS[currentIndex] ?? WORKFLOW_STEPS[0];

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs w-full ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Modernization Workflow
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Deterministic stage progression for legacy assets
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-1 rounded-full text-xs font-semibold text-[#1D4ED8]">
          <span>Stage {currentIndex + 1} of {WORKFLOW_STEPS.length}</span>
          <span className="text-[#93C5FD]">•</span>
          <span>{currentStepInfo.label}</span>
        </div>
      </div>

      {/* Stepper Body */}
      <div className="p-6 lg:p-7">
        {/* Desktop / Tablet Horizontal Stepper */}
        <div className="hidden md:flex items-center justify-between relative">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex || completedSteps.includes(step.id as WorkflowStepId);
            const isCurrent = idx === currentIndex;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id as WorkflowStepId)}
                  disabled={!onStepClick}
                  className={`flex items-start space-x-3 text-left transition-colors group ${
                    onStepClick ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* Step Indicator */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-2xs">
                        <Check className="w-4 h-4 stroke-2" aria-hidden="true" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs ring-4 ring-[#DBEAFE]">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white border border-[#CBD5E1] text-[#94A3B8] flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
                      </div>
                    )}
                  </div>

                  {/* Step Labels */}
                  <div className="leading-tight min-w-0">
                    <p
                      className={`text-sm font-bold transition-colors ${
                        isCurrent
                          ? 'text-[#2563EB]'
                          : isCompleted
                          ? 'text-[#0F172A]'
                          : 'text-[#64748B] group-hover:text-[#0F172A]'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs font-normal text-[#64748B] truncate mt-1">
                      {step.sublabel}
                    </p>
                  </div>
                </button>

                {/* Connector line */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-4 lg:mx-6 rounded-full transition-colors ${
                      idx < currentIndex ? 'bg-emerald-400' : 'bg-[#E2E8F0]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="md:hidden space-y-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step.id as WorkflowStepId)}
                disabled={!onStepClick}
                className={`w-full flex items-center space-x-3.5 p-3 rounded-lg text-left transition-colors ${
                  isCurrent
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-2" aria-hidden="true" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{step.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{step.sublabel}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Stage Summary */}
      <div className="px-6 py-4 bg-white border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
        <div className="space-y-0.5">
          <p className="text-[#0F172A] font-semibold text-sm">
            Current stage: <span className="text-[#2563EB] font-bold">{currentStepInfo.label}</span>
          </p>
          <p className="text-[#475569] text-xs sm:text-sm leading-normal max-w-xl font-normal">{currentStepInfo.description}</p>
        </div>

        {(onActionClick || actionLabel) && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center space-x-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold h-9 px-4 rounded-lg shadow-xs hover:shadow-sm shrink-0 cursor-pointer transition-all active:scale-[0.98] group"
          >
            <span>{actionLabel ?? 'Open Project'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ModernizationWorkflow;
