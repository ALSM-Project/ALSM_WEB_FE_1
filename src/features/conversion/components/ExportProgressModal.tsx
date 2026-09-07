import React from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  Terminal,
  ArrowRight,
  Sparkles,
  FileArchive,
} from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

export interface ExportProgressModalProps {
  isOpen: boolean;
  progressPercent: number;
  currentStepLabel: string;
  isComplete: boolean;
  error: string | null;
  bundleFilename: string;
  bundleSizeKb: number;
  screensCount: number;
  onDownloadAgain: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progressPercent,
  currentStepLabel,
  isComplete,
  error,
  bundleFilename,
  bundleSizeKb,
  screensCount,
  onDownloadAgain,
  onClose,
  onRetry,
}) => {
  const steps = [
    { label: 'Verify export eligibility & dependencies', threshold: 10 },
    { label: 'Synthesize React components & TypeScript types', threshold: 35 },
    { label: 'Package build configuration and tooling', threshold: 65 },
    { label: 'Compress ZIP bundle and optimize assets', threshold: 90 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isComplete || !!error ? onClose : () => {}}
      title={
        error
          ? 'Export Failed'
          : isComplete
          ? 'Code Package Ready'
          : 'Generating Code Package'
      }
      maxWidth="lg"
    >
      <div className="space-y-6 py-2">
        {error ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Bundle generation failed</h4>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onRetry}>Try Again</Button>
            </div>
          </div>
        ) : !isComplete ? (
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentStepLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  Packaging {screensCount} screens into standalone project bundle...
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Progress</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist of steps */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {steps.map((step, idx) => {
                const isPassed = progressPercent > step.threshold;
                const isCurrent =
                  progressPercent >= (idx === 0 ? 0 : steps[idx - 1].threshold) &&
                  progressPercent <= step.threshold;

                return (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 text-xs"
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" />
                    )}
                    <span
                      className={
                        isPassed
                          ? 'text-slate-700 font-medium'
                          : isCurrent
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-400'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center space-x-1.5">
                  <span>Download Started</span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </h3>
                <p className="text-xs text-emerald-800 font-mono mt-0.5">
                  {bundleFilename} (~{bundleSizeKb} KB)
                </p>
              </div>
            </div>

            {/* Next Steps Guide */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Next steps to run your code</span>
              </div>
              <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-xs space-y-1.5 border border-slate-800 shadow-inner">
                <p className="text-slate-400"># 1. Unzip the package</p>
                <p className="text-cyan-400 font-bold">
                  tar -xf {bundleFilename}
                </p>
                <p className="text-slate-400 pt-1"># 2. Install dependencies & run</p>
                <p className="text-emerald-400 font-bold">
                  npm install && npm run dev
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAgain}
                className="space-x-1.5 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Again</span>
              </Button>

              <Button
                onClick={onClose}
                className="space-x-1.5 text-xs font-semibold"
              >
                <span>Back to Screens</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
