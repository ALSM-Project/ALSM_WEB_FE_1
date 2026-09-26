import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { qualityReviewService } from '../services/quality-review.service';
import { ConversionQualityReviewStatus } from '../types/quality-review';
import { useConversionQualityReview, useSubmitQualityReview } from './useQualityReview';

vi.mock('../services/quality-review.service', () => ({
  qualityReviewService: {
    getQualityReview: vi.fn(),
    submitQualityReview: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useQualityReview hooks', () => {
  it('fetches conversion quality review data successfully', async () => {
    const mockData = {
      review: {
        id: 'rev-1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        conversionJobId: 'job-1',
        status: ConversionQualityReviewStatus.ACCEPTED,
        qualityScore: 4,
      },
      fileSummary: {
        fileCount: 3,
        totalLines: 350,
      },
    };

    vi.mocked(qualityReviewService.getQualityReview).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useConversionQualityReview('proj-1', 'job-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(qualityReviewService.getQualityReview).toHaveBeenCalledWith('proj-1', 'job-1');
  });

  it('submits quality review mutation successfully', async () => {
    const mockUpdated = {
      id: 'rev-1',
      organizationId: 'org-1',
      projectId: 'proj-1',
      conversionJobId: 'job-1',
      status: ConversionQualityReviewStatus.ACCEPTED,
      qualityScore: 5,
    };

    vi.mocked(qualityReviewService.submitQualityReview).mockResolvedValue(mockUpdated);

    const { result } = renderHook(
      () => useSubmitQualityReview('proj-1', 'job-1'),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({
      status: ConversionQualityReviewStatus.ACCEPTED,
      qualityScore: 5,
    });

    expect(qualityReviewService.submitQualityReview).toHaveBeenCalledWith(
      'proj-1',
      'job-1',
      { status: ConversionQualityReviewStatus.ACCEPTED, qualityScore: 5 },
    );
  });
});
