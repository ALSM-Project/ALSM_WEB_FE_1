import { describe, expect, it } from 'vitest';
import { ValidationRunStatus, type ValidationRun } from '../types/validation';
import { deriveReviewOperationState, selectLatestValidationRun } from './reviewFindingsState';

function run(id: string, createdAt: string): ValidationRun {
  return {
    id,
    organizationId: 'org-1',
    projectId: 'project-1',
    conversionJobId: 'job-1',
    status: ValidationRunStatus.COMPLETED,
    ruleValidationEnabled: false,
    aiValidationEnabled: true,
    findingCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('selectLatestValidationRun', () => {
  it('selects by createdAt even if the server order changes', () => {
    expect(
      selectLatestValidationRun([
        run('older', '2026-09-22T00:00:00.000Z'),
        run('newer', '2026-09-23T00:00:00.000Z'),
      ])?.id,
    ).toBe('newer');
  });
});

describe('deriveReviewOperationState', () => {
  it('makes an in-flight server review explicit', () => {
    expect(deriveReviewOperationState(true, false)).toBe('REVIEW_MUTATING');
  });

  it('makes a stale-review conflict explicit', () => {
    expect(deriveReviewOperationState(false, true)).toBe('REVIEW_CONFLICT');
  });
});
