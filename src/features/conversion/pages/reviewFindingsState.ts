import type { ConversionJob } from '../services/conversion.service';
import {
  ValidationRunStatus,
  type ValidationFinding,
  type ValidationRun,
} from '../types/validation';

export type ReviewFindingsPageState =
  | 'LOADING_CONVERSION'
  | 'NO_CONVERSION'
  | 'CONVERSION_NOT_READY'
  | 'LOADING_VALIDATION'
  | 'NO_VALIDATION_RUN'
  | 'VALIDATION_QUEUED'
  | 'VALIDATION_PROCESSING'
  | 'LOADING_FINDINGS'
  | 'VALIDATION_COMPLETED_EMPTY'
  | 'VALIDATION_COMPLETED_WITH_FINDINGS'
  | 'VALIDATION_FAILED';

interface DeriveReviewFindingsPageStateInput {
  conversion: ConversionJob | null | undefined;
  conversionLoading: boolean;
  validationRunsLoading: boolean;
  validationRun: ValidationRun | undefined;
  findings: ValidationFinding[] | undefined;
  findingsLoading: boolean;
}

export function selectLatestValidationRun(runs: ValidationRun[]): ValidationRun | undefined {
  return runs.reduce<ValidationRun | undefined>((latest, run) => {
    if (!latest) return run;
    return new Date(run.createdAt).getTime() > new Date(latest.createdAt).getTime() ? run : latest;
  }, undefined);
}

export function deriveReviewFindingsPageState({
  conversion,
  conversionLoading,
  validationRunsLoading,
  validationRun,
  findings,
  findingsLoading,
}: DeriveReviewFindingsPageStateInput): ReviewFindingsPageState {
  if (conversionLoading) return 'LOADING_CONVERSION';
  if (!conversion) return 'NO_CONVERSION';
  if (conversion.status !== 'COMPLETED') return 'CONVERSION_NOT_READY';
  if (validationRunsLoading && !validationRun) return 'LOADING_VALIDATION';
  if (!validationRun) return 'NO_VALIDATION_RUN';
  if (validationRun.status === ValidationRunStatus.QUEUED) return 'VALIDATION_QUEUED';
  if (validationRun.status === ValidationRunStatus.PROCESSING) return 'VALIDATION_PROCESSING';
  if (validationRun.status === ValidationRunStatus.FAILED) return 'VALIDATION_FAILED';
  if (validationRun.findingCount === 0) return 'VALIDATION_COMPLETED_EMPTY';
  if (findingsLoading || !findings) return 'LOADING_FINDINGS';
  return findings.length === 0
    ? 'VALIDATION_COMPLETED_EMPTY'
    : 'VALIDATION_COMPLETED_WITH_FINDINGS';
}
