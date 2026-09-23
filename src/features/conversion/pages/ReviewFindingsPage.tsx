import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  LoaderCircle,
  Play,
  Sliders,
} from 'lucide-react';
import { ApiError } from '@/services/api/apiError';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { StatusBadge } from '@/shared/ui/Badge';
import { useConversionJob } from '../queries/useConversionJob';
import {
  useTriggerAiValidation,
  useValidationFindings,
  useValidationRun,
  useValidationRuns,
} from '../queries/useValidation';
import { ValidationFindingStatus, ValidationRunStatus } from '../types/validation';
import {
  deriveReviewFindingsPageState,
  selectLatestValidationRun,
} from './reviewFindingsState';

const CONVERSION_STATUS_MESSAGES = {
  QUEUED: 'Conversion is still in progress. AI validation will be available after it completes.',
  PROCESSING:
    'Conversion is still in progress. AI validation will be available after it completes.',
  FAILED: 'The conversion failed and is not eligible for AI validation.',
  DEAD: 'The conversion could not be completed and is not eligible for AI validation.',
  CANCELLED: 'The conversion was cancelled and is not eligible for AI validation.',
  COMPLETED: '',
} as const;

function triggerErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof ApiError)) return 'AI validation could not be started. Please try again.';
  const messages: Record<number, string> = {
    400: 'Conversion is not eligible for AI validation.',
    403: 'You do not have permission to run validation.',
    404: 'Conversion or project could not be found.',
    503: 'AI validation is currently unavailable.',
  };
  return messages[error.status] ?? 'AI validation could not be started. Please try again.';
}

function StatePanel({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const ReviewFindingsPage: React.FC = () => {
  const { projectId = '', screenId = '' } = useParams();
  const navigate = useNavigate();
  const conversionQuery = useConversionJob(projectId, screenId);
  const conversion = conversionQuery.data;
  const conversionCompleted = conversion?.status === 'COMPLETED';
  const runsQuery = useValidationRuns(projectId, conversion?.id, conversionCompleted);
  const triggerValidation = useTriggerAiValidation(projectId, conversion?.id);

  const latestListedRun = useMemo(
    () => selectLatestValidationRun(runsQuery.data ?? []),
    [runsQuery.data],
  );
  const selectedRun = triggerValidation.data ?? latestListedRun;
  const runQuery = useValidationRun(projectId, selectedRun?.id, Boolean(selectedRun));
  const currentRun = runQuery.data ?? selectedRun;
  const completedRun = currentRun?.status === ValidationRunStatus.COMPLETED;
  const findingsQuery = useValidationFindings(projectId, currentRun?.id, completedRun);

  const pageState = deriveReviewFindingsPageState({
    conversion,
    conversionLoading: conversionQuery.isLoading,
    validationRunsLoading: runsQuery.isLoading,
    validationRun: currentRun,
    findings: findingsQuery.data,
    findingsLoading: findingsQuery.isLoading,
  });
  const findings = findingsQuery.data ?? [];
  const reviewedCount = findings.filter(
    (finding) => finding.status !== ValidationFindingStatus.PENDING,
  ).length;
  const validationActive =
    currentRun?.status === ValidationRunStatus.QUEUED ||
    currentRun?.status === ValidationRunStatus.PROCESSING;
  const continueDisabled = validationActive || triggerValidation.isPending;
  const triggerError = triggerErrorMessage(triggerValidation.error);

  const runValidationButton = (label: string) => (
    <Button
      type="button"
      variant="ai"
      onClick={() => triggerValidation.mutate()}
      isLoading={triggerValidation.isPending}
      disabled={!conversionCompleted || validationActive}
      className="space-x-2"
    >
      <Play className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );

  const renderState = () => {
    if (runsQuery.isError || runQuery.isError || findingsQuery.isError) {
      return (
        <StatePanel icon={<AlertCircle className="h-5 w-5" />} title="Validation data unavailable">
          The latest validation state could not be loaded. Refresh the page to try again.
        </StatePanel>
      );
    }

    switch (pageState) {
      case 'LOADING_CONVERSION':
        return (
          <StatePanel
            icon={<LoaderCircle className="h-5 w-5 animate-spin" />}
            title="Loading conversion"
          >
            Resolving the latest conversion for this screen.
          </StatePanel>
        );
      case 'NO_CONVERSION':
        return (
          <StatePanel icon={<AlertCircle className="h-5 w-5" />} title="No conversion available">
            Run a conversion for this screen before starting AI validation.
          </StatePanel>
        );
      case 'CONVERSION_NOT_READY':
        return (
          <StatePanel
            icon={<Clock3 className="h-5 w-5" />}
            title={
              conversion?.status === 'QUEUED' || conversion?.status === 'PROCESSING'
                ? 'Conversion is still in progress'
                : 'Conversion unavailable'
            }
          >
            {conversion ? CONVERSION_STATUS_MESSAGES[conversion.status] : ''}
          </StatePanel>
        );
      case 'LOADING_VALIDATION':
        return (
          <StatePanel
            icon={<LoaderCircle className="h-5 w-5 animate-spin" />}
            title="Loading validation history"
          >
            Checking for validation runs associated with this conversion.
          </StatePanel>
        );
      case 'NO_VALIDATION_RUN':
        return (
          <StatePanel
            icon={<Bot className="h-5 w-5" />}
            title="AI Validation has not been run for this conversion"
            action={runValidationButton('Run AI Validation')}
          >
            Start an asynchronous AI-assisted semantic comparison when you are ready.
            {triggerError && (
              <p className="mt-3 font-semibold text-rose-700" role="alert">
                {triggerError}
              </p>
            )}
          </StatePanel>
        );
      case 'VALIDATION_QUEUED':
        return (
          <StatePanel icon={<Clock3 className="h-5 w-5" />} title="Status: Queued">
            The validation request is waiting to be processed.
          </StatePanel>
        );
      case 'VALIDATION_PROCESSING':
        return (
          <StatePanel
            icon={<LoaderCircle className="h-5 w-5 animate-spin" />}
            title="Status: Processing"
          >
            AI-assisted semantic comparison is in progress.
          </StatePanel>
        );
      case 'LOADING_FINDINGS':
        return (
          <StatePanel
            icon={<LoaderCircle className="h-5 w-5 animate-spin" />}
            title="Loading findings"
          >
            Loading the persisted findings for this validation run.
          </StatePanel>
        );
      case 'VALIDATION_COMPLETED_EMPTY':
        return (
          <StatePanel icon={<CheckCircle2 className="h-5 w-5" />} title="AI validation completed">
            <p>No semantic findings were detected in this validation run.</p>
            <p className="mt-2 font-medium text-slate-700">
              AI validation does not guarantee semantic equivalence. Human review is still
              recommended.
            </p>
          </StatePanel>
        );
      case 'VALIDATION_FAILED':
        return (
          <StatePanel
            icon={<AlertCircle className="h-5 w-5" />}
            title="AI validation failed"
            action={runValidationButton('Run Validation Again')}
          >
            <p>{currentRun?.failureMessage ?? 'The validation run could not be completed.'}</p>
            {currentRun?.failureCode && (
              <p className="mt-2 font-mono text-xs text-slate-500">{currentRun.failureCode}</p>
            )}
            {triggerError && (
              <p className="mt-3 font-semibold text-rose-700" role="alert">
                {triggerError}
              </p>
            )}
          </StatePanel>
        );
      case 'VALIDATION_COMPLETED_WITH_FINDINGS':
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Validation Finding Summary</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewedCount} of {findings.length} findings reviewed
                </p>
              </div>
              <StatusBadge status="Completed" />
            </div>
            <div className="space-y-3">
              {findings.map((finding) => (
                <article key={finding.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">
                      {finding.source}
                    </span>
                    <span className="rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">
                      {finding.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{finding.category}</span>
                    <span className="ml-auto text-xs font-bold text-slate-600">{finding.status}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{finding.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{finding.explanation}</p>
                </article>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col space-y-6 bg-slate-50/30 pb-24">
      <ModernizationWorkflow
        currentStep="validation"
        completedSteps={['upload', 'conversion']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, screenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Validation &amp; Human Review
              </h1>
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Human Review Required
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              AI-generated findings are advisory. Final review decisions are made by human
              reviewers.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
            className="space-x-1.5 text-xs"
          >
            <Sliders className="h-4 w-4 text-brand-600" />
            <span>Edit Mapping &amp; Re-convert</span>
          </Button>
        </div>
      </header>

      {renderState()}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-6 py-4 shadow-2xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{reviewedCount} of {findings.length} findings reviewed</span>
            <span className="text-slate-400">Review decisions are saved automatically.</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
              className="space-x-1.5 text-xs"
            >
              <Sliders className="h-3.5 w-3.5 text-brand-600" />
              <span>Correct Mapping &amp; Re-convert</span>
            </Button>
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
              disabled={continueDisabled}
              className="space-x-1.5 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>Finalize &amp; Export</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewFindingsPage;
