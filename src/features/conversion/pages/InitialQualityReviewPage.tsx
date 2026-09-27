import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCode,
  Flag,
  LoaderCircle,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { ApiError } from '@/services/api/apiError';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { CodeViewer } from '../components/CodeViewer';
import { QualityScoreSelector } from '../components/QualityScoreSelector';
import { useConversionJob } from '../queries/useConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import { useConversionQualityReview, useSubmitQualityReview } from '../queries/useQualityReview';
import {
  ConversionQualityReviewStatus,
  type HumanQualityReviewTargetStatus,
} from '../types/quality-review';

const STATUS_DISPLAY_LABEL: Record<ConversionQualityReviewStatus, string> = {
  [ConversionQualityReviewStatus.PENDING]: 'Pending Review',
  [ConversionQualityReviewStatus.ACCEPTED]: 'Accepted',
  [ConversionQualityReviewStatus.NEEDS_REWORK]: 'Needs Rework',
  [ConversionQualityReviewStatus.FLAGGED]: 'Flagged for Escalation',
};

export const InitialQualityReviewPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  // Selected file index for code preview
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Form states
  const [selectedScore, setSelectedScore] = useState<number | undefined>(undefined);
  const [reviewNote, setReviewNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [conflictError, setConflictError] = useState(false);

  // 1. Fetch latest conversion job for this screen
  const {
    data: job,
    isLoading: jobLoading,
    refetch: refetchJob,
  } = useConversionJob(projectId, screenId);

  // 2. Fetch quality review status & file summary from backend
  const {
    data: qualityReviewData,
    isLoading: reviewLoading,
    refetch: refetchReview,
  } = useConversionQualityReview(
    projectId,
    job?.id,
    Boolean(job && job.status === 'COMPLETED'),
  );

  // 3. Fetch generated code bundle for preview
  const { data: bundle } = useConversionResult(
    job?.id,
    Boolean(job && job.status === 'COMPLETED'),
  );

  // 4. Mutation hook for submitting quality review
  const submitMutation = useSubmitQualityReview(projectId, job?.id);

  // Populate form defaults from existing review once loaded
  React.useEffect(() => {
    if (qualityReviewData?.review && !formInitialized) {
      if (qualityReviewData.review.qualityScore !== undefined) {
        setSelectedScore(qualityReviewData.review.qualityScore);
      }
      if (qualityReviewData.review.reviewNote) {
        setReviewNote(qualityReviewData.review.reviewNote);
      }
      setFormInitialized(true);
    }
  }, [qualityReviewData, formInitialized]);

  const files = useMemo(() => bundle?.files ?? [], [bundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0];

  const currentStatus = qualityReviewData?.review?.status ?? ConversionQualityReviewStatus.PENDING;
  const isReviewed = currentStatus !== ConversionQualityReviewStatus.PENDING;

  // Handle Action Submit
  const handleDecision = async (status: HumanQualityReviewTargetStatus) => {
    setValidationError(null);
    setConflictError(false);

    // Client-side validation: Note is required if NEEDS_REWORK or FLAGGED
    if ((status === ConversionQualityReviewStatus.NEEDS_REWORK || status === ConversionQualityReviewStatus.FLAGGED) && !reviewNote.trim()) {
      setValidationError('A review note is required when requesting rework or flagging issues.');
      return;
    }

    if (reviewNote.length > 2000) {
      setValidationError('Review note must not exceed 2000 characters.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        status,
        qualityScore: selectedScore,
        reviewNote: reviewNote.trim() || undefined,
      });
      // If user accepted, they can continue to validation
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictError(true);
        refetchReview();
      } else if (err instanceof ApiError && err.status === 403) {
        setValidationError('You do not have permission to submit a review decision. Role Member or higher is required.');
      } else if (err instanceof ApiError) {
        setValidationError(err.message || 'An error occurred while submitting your review.');
      } else {
        setValidationError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // State: Loading
  if (jobLoading || (job && job.status === 'COMPLETED' && reviewLoading && !qualityReviewData)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ModernizationWorkflow currentStep="convert" completedSteps={['upload']} />
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <LoaderCircle className="w-8 h-8 text-[#0652CC] animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading conversion quality details...</p>
        </div>
      </div>
    );
  }

  // State: No job found
  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ModernizationWorkflow currentStep="convert" completedSteps={['upload']} />
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">No Conversion Job Found</h2>
          <p className="text-sm text-slate-500 max-w-md">
            There is no record of a conversion job for this screen. Please convert the screen first.
          </p>
          <Button onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId))}>
            Go to Screen Conversion
          </Button>
        </div>
      </div>
    );
  }

  // State: Job Not Completed
  if (job.status !== 'COMPLETED') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ModernizationWorkflow currentStep="convert" completedSteps={['upload']} />
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <Clock3 className="w-10 h-10 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Conversion In Progress or Not Complete</h2>
          <p className="text-sm text-slate-500 max-w-md">
            The conversion job is currently <span className="font-semibold">{job.status}</span>. Initial quality review is available once the conversion completes successfully.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => refetchJob()} className="space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </Button>
            <Button onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}>
              View Job Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fileSummary = qualityReviewData?.fileSummary ?? {
    fileCount: files.length,
    totalLines: files.reduce((acc, f) => acc + f.content.split('\n').length, 0),
    toolVersion: job.toolVersion,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Stepper Header */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={['upload']}
        onStepClick={(step) => {
          if (step === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (step === 'validate' || step === 'validation' || step === 'review')
            navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
          if (step === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      {/* Main Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Initial Conversion Quality Review</h1>
            <StatusBadge status={STATUS_DISPLAY_LABEL[currentStatus]} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Screen: <span className="font-semibold text-slate-700">{screenId}</span> · Job ID:{' '}
            <span className="font-mono text-slate-700">{job.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Mapping</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId))}
            className="space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-convert Screen</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {conflictError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start space-x-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Review modified concurrently</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Another team member submitted changes to this quality review. The latest state has been loaded.
            </p>
          </div>
        </div>
      )}

      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Review Submission Notice</p>
            <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {submitMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between space-x-3 text-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Quality review recorded successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your decision (<span className="font-bold">{STATUS_DISPLAY_LABEL[currentStatus]}</span>) has been saved.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))}
            className="space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          >
            <span>Proceed to AI Validation &rarr;</span>
          </Button>
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Form & Metrics (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Conversion Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0652CC]" />
              Conversion Artifacts Summary
            </h2>
            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Generated Files</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{fileSummary.fileCount}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Total Lines of Code</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{fileSummary.totalLines.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Engine Version</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono truncate">
                  {fileSummary.toolVersion || 'v1.0.0'}
                </p>
              </div>
            </div>
          </div>

          {/* Quality Assessment & Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Quality Assessment Decision</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluate the structure and conversion fidelity before proceeding to deep AI validation.
              </p>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Overall Quality Rating</label>
              <QualityScoreSelector
                value={selectedScore}
                onChange={setSelectedScore}
                disabled={submitMutation.isPending}
              />
            </div>

            {/* Note Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Review Notes & Guidance
                  <span className="text-slate-400 font-normal ml-1">(Required for Rework or Flag)</span>
                </label>
                <span
                  className={`text-[11px] ${
                    reviewNote.length > 2000 ? 'text-rose-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {reviewNote.length} / 2000
                </span>
              </div>
              <textarea
                rows={4}
                value={reviewNote}
                onChange={(e) => {
                  setReviewNote(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={submitMutation.isPending}
                placeholder="Add comments on structure, missing fields, or reasons for rework..."
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0652CC] focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              <Button
                variant="primary"
                onClick={() => handleDecision(ConversionQualityReviewStatus.ACCEPTED)}
                isLoading={submitMutation.isPending && submitMutation.variables?.status === ConversionQualityReviewStatus.ACCEPTED}
                disabled={submitMutation.isPending}
                className="flex-1 space-x-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Quality</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDecision(ConversionQualityReviewStatus.NEEDS_REWORK)}
                isLoading={submitMutation.isPending && submitMutation.variables?.status === ConversionQualityReviewStatus.NEEDS_REWORK}
                disabled={submitMutation.isPending}
                className="flex-1 space-x-1.5 text-xs font-bold border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Needs Rework</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDecision(ConversionQualityReviewStatus.FLAGGED)}
                isLoading={submitMutation.isPending && submitMutation.variables?.status === ConversionQualityReviewStatus.FLAGGED}
                disabled={submitMutation.isPending}
                className="flex-1 space-x-1.5 text-xs font-bold border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
              >
                <Flag className="w-4 h-4" />
                <span>Flag Issue</span>
              </Button>
            </div>

            {isReviewed && qualityReviewData?.review.reviewedAt && (
              <p className="text-[11px] text-slate-400 text-center pt-1">
                Last reviewed on{' '}
                <span className="font-medium text-slate-600">
                  {new Date(qualityReviewData.review.reviewedAt).toLocaleString()}
                </span>
                {qualityReviewData.review.reviewedBy && (
                  <> by user <span className="font-mono text-slate-600">{qualityReviewData.review.reviewedBy}</span></>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Code Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-[#0652CC]" />
              <span>Generated Code Preview</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {files.length} file{files.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {files.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <button
                  key={file.relativePath}
                  onClick={() => setSelectedFileIndex(index)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                    index === selectedFileIndex
                      ? 'bg-blue-50 border-[#0652CC] text-[#0652CC] font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {file.relativePath}
                </button>
              ))}
            </div>
          )}

          {files.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
              No code files found in result bundle.
            </div>
          ) : (
            <CodeViewer
              code={selectedFile?.content ?? ''}
              filename={selectedFile?.relativePath ?? 'GeneratedCode.java'}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
          className="space-x-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Result Inspection</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
            className="space-x-1.5 text-xs font-semibold"
          >
            <span>Preview UI Screen</span>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))}
            className="space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white"
          >
            <span>Continue to AI Validation</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InitialQualityReviewPage;
