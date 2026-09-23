import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api/apiError';
import { validationService } from '../services/validation.service';
import {
  ValidationFindingStatus,
  type ValidationFinding,
} from '../types/validation';
import { useReviewValidationFinding } from './useValidation';
import { validationKeys } from './validationKeys';

const reviewedFinding: ValidationFinding = {
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
  explanation: 'Generated behavior differs.',
  reviewedBy: 'reviewer-1',
  reviewedAt: '2026-09-23T02:00:00.000Z',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T02:00:00.000Z',
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useReviewValidationFinding', () => {
  it('invalidates persisted findings after a successful review', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(validationService, 'reviewFinding').mockResolvedValue(reviewedFinding);
    const { result } = renderHook(
      () => useReviewValidationFinding('project-1', 'run-1'),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync({
        findingId: 'finding-1',
        input: { status: ValidationFindingStatus.NEEDS_CORRECTION },
      });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: validationKeys.findings('project-1', 'run-1'),
    });
  });

  it('invalidates findings after a 409 without overwriting cached state', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const findingsKey = validationKeys.findings('project-1', 'run-1');
    queryClient.setQueryData(findingsKey, [{ ...reviewedFinding, status: ValidationFindingStatus.PENDING }]);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(validationService, 'reviewFinding').mockRejectedValue(new ApiError('Conflict', 409));
    const { result } = renderHook(
      () => useReviewValidationFinding('project-1', 'run-1'),
      { wrapper: createWrapper(queryClient) },
    );

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          findingId: 'finding-1',
          input: { status: ValidationFindingStatus.NEEDS_CORRECTION },
        });
      }),
    ).rejects.toMatchObject({ status: 409 });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: findingsKey });
    expect(queryClient.getQueryData(findingsKey)).toEqual([
      expect.objectContaining({ status: ValidationFindingStatus.PENDING }),
    ]);
  });
});
