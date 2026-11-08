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

export const BMS_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'upload',
    label: 'Upload',
    sublabel: 'BMS/DSPF Maps',
    description: 'Ingest legacy IBM 3270 BMS and AS/400 DSPF screen map files.',
  },
  {
    id: 'convert',
    label: 'Convert',
    sublabel: 'React Generation',
    description: 'Modernization engine generates target React 19 TypeScript components.',
  },
  {
    id: 'validate',
    label: 'Validate',
    sublabel: 'UI & Field Rules',
    description: 'Validate screen field bindings, display attributes, and visual layout.',
  },
  {
    id: 'export',
    label: 'Export',
    sublabel: 'React Bundle',
    description: 'Package modernized React components and frontend project artifacts.',
  },
];

export const COBOL_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'upload',
    label: 'Upload Source Files',
    sublabel: 'Source Ingestion',
    description: 'Upload COBOL programs (.cbl, .cob) and copybooks (.cpy).',
  },
  {
    id: 'analyze',
    label: 'Analyze & Prepare',
    sublabel: 'Transpiler Passes 1–2.4',
    description: 'Project index, CICS normalization, preprocessing, AST parsing, symbol resolution, and control flow analysis.',
  },
  {
    id: 'convert',
    label: 'Convert to Java',
    sublabel: 'Code Generation',
    description: 'Transpile COBOL divisions, statements, and SQL into Java Spring Boot components using Cobol2Java.',
  },
  {
    id: 'validate',
    label: 'Validate & Build',
    sublabel: 'Scaffold & Compiler',
    description: 'Assemble Spring Batch scaffold and verify compilation with Maven build verification.',
  },
  {
    id: 'review',
    label: 'Review Results',
    sublabel: 'Findings & Reports',
    description: 'Inspect generated Java classes, method mappings, conversion diagnostics, and technical reports.',
  },
  {
    id: 'export',
    label: 'Export Java Project',
    sublabel: 'Deployable Artifacts',
    description: 'Download complete modernized Spring Boot Maven project bundle and conversion reports.',
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = BMS_WORKFLOW_STEPS;

// Helper to normalize legacy step IDs to 0-indexed step number
function getStepIndex(stepId: WorkflowStepId, isCobol = false): number {
  if (isCobol) {
    switch (stepId) {
      case 'upload':
        return 0;
      case 'analyze':
      case 'analysis':
      case 'mapping':
        return 1;
      case 'convert':
      case 'conversion':
        return 2;
      case 'validate':
      case 'validation':
        return 3;
      case 'review':
      case 'result':
        return 4;
      case 'export':
        return 5;
      default:
        return 0;
    }
  }
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
  workflowType?: 'SCREENS' | 'PROGRAMS' | 'COBOL_TO_JAVA' | 'BMS_DSPF_TO_REACT' | 'BMS_DSPF_TO_FRONTEND';
}

export const ModernizationWorkflow: React.FC<ModernizationWorkflowProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
  onActionClick,
  actionLabel,
  className = '',
  workflowType,
}) => {
  const steps =
    workflowType === 'PROGRAMS' || workflowType === 'COBOL_TO_JAVA'
      ? COBOL_WORKFLOW_STEPS
      : BMS_WORKFLOW_STEPS;
  const isCobolWorkflow = workflowType === 'PROGRAMS' || workflowType === 'COBOL_TO_JAVA';
  const currentIndex = getStepIndex(currentStep, isCobolWorkflow);
  const currentStepInfo = steps[currentIndex] ?? steps[0];

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
        <div className="inline-flex items-center space-x-1.5 bg-[#F0F4F8] border border-[#DCE3EC] px-3 py-1 rounded-full text-xs font-semibold text-[#244A70]">
          <span>Stage {currentIndex + 1} of {steps.length}</span>
          <span className="text-[#8491A3]">•</span>
          <span>{currentStepInfo.label}</span>
        </div>
      </div>

      {/* Stepper Body */}
      <div className="p-6 lg:p-7">
        {/* Desktop / Tablet Horizontal Stepper */}
        <div className="hidden md:flex items-center justify-between relative">
          {steps.map((step, idx) => {
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
                      <div className="w-7 h-7 rounded-full bg-[#244A70] text-white flex items-center justify-center shadow-xs ring-4 ring-[#DCE3EC]">
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
                          ? 'text-[#244A70]'
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
                {idx < steps.length - 1 && (
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
          {steps.map((step, idx) => {
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
                    ? 'bg-[#F0F4F8] text-[#244A70]'
                    : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-2" aria-hidden="true" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-[#244A70] text-white flex items-center justify-center">
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
            Current stage: <span className="text-[#244A70] font-bold">{currentStepInfo.label}</span>
          </p>
          <p className="text-[#475569] text-xs sm:text-sm leading-normal max-w-xl font-normal">{currentStepInfo.description}</p>
        </div>

        {(onActionClick || actionLabel) && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center space-x-1.5 bg-[#244A70] hover:bg-[#1B3856] text-white text-xs sm:text-sm font-semibold h-9 px-4 rounded-lg shadow-xs hover:shadow-sm shrink-0 cursor-pointer transition-all active:scale-[0.98] group"
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
