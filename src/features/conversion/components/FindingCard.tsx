import React from 'react';
import { ValidationFindingStatus, type CodeLocation, type HumanReviewTargetStatus, type ValidationFinding } from '../types/validation';
import { Tooltip } from '@/shared/ui/Tooltip';

const SOURCE_LABELS: Record<ValidationFinding['source'], string> = {
  AI: 'AI Suggested',
  RULE: 'Rule-based',
  COMPILER: 'Compiler',
  STATIC_ANALYSIS: 'Static Analysis',
  DIFFERENTIAL_TEST: 'Differential Test',
};

const STATUS_LABELS: Record<ValidationFinding['status'], string> = {
  PENDING: 'Pending',
  NEEDS_CORRECTION: 'Needs Correction',
  MANUAL_REVIEW: 'Manual Review',
  NOT_APPLICABLE: 'Not Applicable',
  RESOLVED: 'Resolved',
};

const ALLOWED_TRANSITIONS: Record<
  ValidationFinding['status'],
  HumanReviewTargetStatus[]
> = {
  PENDING: [
    ValidationFindingStatus.NEEDS_CORRECTION,
    ValidationFindingStatus.MANUAL_REVIEW,
    ValidationFindingStatus.NOT_APPLICABLE,
  ],
  NEEDS_CORRECTION: [
    ValidationFindingStatus.RESOLVED,
    ValidationFindingStatus.MANUAL_REVIEW,
  ],
  MANUAL_REVIEW: [
    ValidationFindingStatus.NEEDS_CORRECTION,
    ValidationFindingStatus.NOT_APPLICABLE,
    ValidationFindingStatus.RESOLVED,
  ],
  NOT_APPLICABLE: [ValidationFindingStatus.MANUAL_REVIEW],
  RESOLVED: [ValidationFindingStatus.MANUAL_REVIEW],
};

const ACTION_LABELS: Record<HumanReviewTargetStatus, string> = {
  NEEDS_CORRECTION: 'Needs Correction',
  MANUAL_REVIEW: 'Manual Review',
  NOT_APPLICABLE: 'Not Applicable',
  RESOLVED: 'Resolved',
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCodeLocation(location: CodeLocation | undefined): string {
  if (!location) return 'Location unavailable';
  const file = location.file ?? 'Unknown file';
  if (!location.startLine) return file;
  const range =
    location.endLine && location.endLine !== location.startLine
      ? `${location.startLine}-${location.endLine}`
      : `${location.startLine}`;
  return `${file} : Ln ${range}`;
}

export interface FindingCardProps {
  finding: ValidationFinding;
  isSelected?: boolean;
  isSubmitting?: boolean;
  onSelect?: () => void;
  onReview: (finding: ValidationFinding, status: HumanReviewTargetStatus) => void;
  onMarkNotApplicable: (finding: ValidationFinding) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isSelected = false,
  isSubmitting = false,
  onSelect,
  onReview,
  onMarkNotApplicable,
}) => {
  const allowedTransitions = ALLOWED_TRANSITIONS[finding.status];

  return (
    <article
      onClick={onSelect}
      className={`rounded-xl border p-5 transition-colors ${
        isSelected
          ? 'border-brand-400 bg-brand-50/30 ring-1 ring-brand-300/30'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {SOURCE_LABELS[finding.source]}
        </span>
        <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
          {humanize(finding.severity)}
        </span>
        <span className="text-xs font-semibold text-slate-500">{humanize(finding.category)}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {STATUS_LABELS[finding.status]}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">{finding.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{finding.explanation}</p>

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-2">
        <div>
          <span className="block font-bold uppercase tracking-wide text-slate-400">Source</span>
          <span className="mt-1 block font-mono font-semibold text-slate-700">
            {formatCodeLocation(finding.sourceLocation)}
          </span>
        </div>
        <div>
          <span className="block font-bold uppercase tracking-wide text-slate-400">Target</span>
          <span className="mt-1 block font-mono font-semibold text-brand-700">
            {formatCodeLocation(finding.targetLocation)}
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-xs text-slate-700">
        {finding.expectedBehavior && (
          <div>
            <dt className="inline font-bold text-slate-900">Expected: </dt>
            <dd className="inline">{finding.expectedBehavior}</dd>
          </div>
        )}
        {finding.actualBehavior && (
          <div>
            <dt className="inline font-bold text-slate-900">Actual: </dt>
            <dd className="inline">{finding.actualBehavior}</dd>
          </div>
        )}
        {finding.suggestion && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-brand-800">
            <dt className="inline font-bold">Suggestion: </dt>
            <dd className="inline">{finding.suggestion}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        {finding.confidence !== undefined && (
          <Tooltip content="Model confidence is advisory and is not a guaranteed probability of correctness.">
            <span className="cursor-help border-b border-dotted border-slate-400">
              AI confidence: {Math.round(finding.confidence * 100)}%
            </span>
          </Tooltip>
        )}
        {finding.reviewedBy && <span>Reviewed by {finding.reviewedBy}</span>}
        {finding.reviewedAt && <span>{new Date(finding.reviewedAt).toLocaleString()}</span>}
      </div>

      {finding.reviewNote && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <span className="font-bold text-slate-900">Review note: </span>
          {finding.reviewNote}
        </div>
      )}

      <div
        className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"
        onClick={(event) => event.stopPropagation()}
      >
        {allowedTransitions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (status === ValidationFindingStatus.NOT_APPLICABLE) {
                onMarkNotApplicable(finding);
                return;
              }
              onReview(finding, status);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ACTION_LABELS[status]}
          </button>
        ))}
      </div>
    </article>
  );
};

export default FindingCard;
