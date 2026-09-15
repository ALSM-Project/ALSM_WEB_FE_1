import React from 'react';
import { Check, ChevronRight, UploadCloud, FileSearch, Layers, Cpu, ShieldCheck, Eye, Download } from 'lucide-react';

export type WorkflowStepId = 'upload' | 'analysis' | 'mapping' | 'conversion' | 'validation' | 'review' | 'result' | 'export';

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'upload', label: '1. Upload', sublabel: 'Source Ingestion', icon: UploadCloud },
  { id: 'analysis', label: '2. Analysis', sublabel: 'AST Parsing', icon: FileSearch },
  { id: 'mapping', label: '3. Mapping', sublabel: 'Field & Paragraph', icon: Layers },
  { id: 'conversion', label: '4. Conversion', sublabel: 'Engine Generation', icon: Cpu },
  { id: 'validation', label: '5. Validation', sublabel: 'Rule Findings', icon: ShieldCheck },
  { id: 'result', label: '6. Result', sublabel: 'Code Preview', icon: Eye },
  { id: 'export', label: '7. Export', sublabel: 'Package Bundle', icon: Download },
];

export interface ModernizationWorkflowProps {
  currentStep: WorkflowStepId;
  completedSteps?: WorkflowStepId[];
  onStepClick?: (stepId: WorkflowStepId) => void;
  className?: string;
}

export const ModernizationWorkflow: React.FC<ModernizationWorkflowProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
  className = '',
}) => {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={`bg-white border border-[#D9E2EC] rounded-2xl p-4 sm:p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0652CC] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
            Legacy Modernization Workflow
          </span>
          <h3 className="text-base font-bold text-[#091E42] mt-1">
            PoC Modernization Pipeline
          </h3>
        </div>
        <div className="text-xs font-semibold text-[#42526E] hidden sm:block">
          Step <span className="text-[#0652CC] font-bold">{currentIndex + 1}</span> of {WORKFLOW_STEPS.length}
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center min-w-[700px] justify-between">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id) || idx < currentIndex;
            const isCurrent = step.id === currentStep;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!onStepClick}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-[#0652CC] text-white shadow-sm'
                      : isCompleted
                      ? 'bg-[#E8F1FF] text-[#0652CC] hover:bg-[#D1E0FF]'
                      : 'bg-[#F7F9FC] text-[#42526E] hover:bg-slate-100'
                  } ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-[#0652CC] text-white'
                        : 'bg-[#D9E2EC] text-[#42526E]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-3.5 h-3.5" />}
                  </div>

                  <div className="leading-tight">
                    <div className="text-xs font-bold truncate max-w-[100px] sm:max-w-none">
                      {step.label}
                    </div>
                    {step.sublabel && (
                      <div
                        className={`text-[10px] font-medium truncate max-w-[90px] sm:max-w-none ${
                          isCurrent ? 'text-white/80' : 'text-[#6B778C]'
                        }`}
                      >
                        {step.sublabel}
                      </div>
                    )}
                  </div>
                </button>

                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mx-0.5 ${
                      idx < currentIndex ? 'text-[#0652CC]' : 'text-[#D9E2EC]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModernizationWorkflow;
