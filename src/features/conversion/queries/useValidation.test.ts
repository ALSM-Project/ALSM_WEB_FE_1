import { describe, expect, it } from 'vitest';
import { ValidationRunStatus, type ValidationRun } from '../types/validation';
import { validationRunPollingInterval } from './useValidation';

function runWithStatus(status: ValidationRunStatus): ValidationRun {
  return {
    id: 'run-1',
    organizationId: 'org-1',
    projectId: 'project-1',
    conversionJobId: 'job-1',
    status,
    ruleValidationEnabled: false,
    aiValidationEnabled: true,
    findingCount: 0,
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
  };
}

describe('validationRunPollingInterval', () => {
  it.each([ValidationRunStatus.QUEUED, ValidationRunStatus.PROCESSING])(
    'polls every three seconds while the run is %s',
    (status) => {
      expect(validationRunPollingInterval(runWithStatus(status))).toBe(3000);
    },
  );

  it.each([ValidationRunStatus.COMPLETED, ValidationRunStatus.FAILED])(
    'stops polling when the run is %s',
    (status) => {
      expect(validationRunPollingInterval(runWithStatus(status))).toBe(false);
    },
  );
});
