import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/api/apiClient';
import {
  ValidationFindingStatus,
  ValidationRunStatus,
  type ValidationFinding,
  type ValidationRun,
} from '../types/validation';
import { validationService } from './validation.service';

const run = {
  id: 'run-1',
  organizationId: 'org-1',
  projectId: 'project-1',
  conversionJobId: 'job-1',
  status: ValidationRunStatus.QUEUED,
  ruleValidationEnabled: false,
  aiValidationEnabled: true,
  findingCount: 0,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
} satisfies ValidationRun;

const finding = {
  id: 'finding-1',
  organizationId: 'org-1',
  projectId: 'project-1',
  conversionJobId: 'job-1',
  validationRunId: 'run-1',
  source: 'AI',
  category: 'LOGIC_MISMATCH',
  severity: 'HIGH',
  status: ValidationFindingStatus.NEEDS_CORRECTION,
  title: 'Behavior differs',
  explanation: 'Observed behavior differs from the source.',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
} satisfies ValidationFinding;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validationService', () => {
  it('calls the asynchronous validation trigger route', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(run);

    await expect(validationService.triggerAiValidation('project-1', 'job-1')).resolves.toBe(run);

    expect(post).toHaveBeenCalledWith(
      '/projects/project-1/conversions/job-1/validation-runs',
    );
  });

  it('calls the conversion-scoped run-list route', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue([run]);

    await expect(validationService.listValidationRuns('project-1', 'job-1')).resolves.toEqual([
      run,
    ]);

    expect(get).toHaveBeenCalledWith(
      '/projects/project-1/conversions/job-1/validation-runs',
    );
  });

  it('calls the single-run route', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(run);

    await validationService.getValidationRun('project-1', 'run-1');

    expect(get).toHaveBeenCalledWith('/projects/project-1/validation-runs/run-1');
  });

  it('calls the findings route', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue([finding]);

    await validationService.listValidationFindings('project-1', 'run-1');

    expect(get).toHaveBeenCalledWith('/projects/project-1/validation-runs/run-1/findings');
  });

  it('PATCHes only the exact human-review body with backend enum casing', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(finding);
    const input = {
      status: ValidationFindingStatus.NEEDS_CORRECTION,
      reviewNote: 'Confirmed by a reviewer',
    };

    await validationService.reviewFinding('project-1', 'run-1', 'finding-1', input);

    expect(patch).toHaveBeenCalledWith(
      '/projects/project-1/validation-runs/run-1/findings/finding-1/review',
      input,
    );
    expect(patch.mock.calls[0][1]).toEqual({
      status: 'NEEDS_CORRECTION',
      reviewNote: 'Confirmed by a reviewer',
    });
  });
});
