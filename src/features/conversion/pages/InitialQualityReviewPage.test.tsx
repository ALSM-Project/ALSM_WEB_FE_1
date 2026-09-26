import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api/apiError';
import type { ConversionJob } from '../services/conversion.service';
import type { ConversionResultBundle } from '../types/conversion';
import {
  ConversionQualityReviewStatus,
  type ConversionQualityReviewResponse,
} from '../types/quality-review';
import { InitialQualityReviewPage } from './InitialQualityReviewPage';

const mocks = vi.hoisted(() => ({
  useConversionJob: vi.fn(),
  useConversionResult: vi.fn(),
  useConversionQualityReview: vi.fn(),
  useSubmitQualityReview: vi.fn(),
}));

vi.mock('../queries/useConversionJob', () => ({
  useConversionJob: mocks.useConversionJob,
}));
vi.mock('../queries/useConversionResult', () => ({
  useConversionResult: mocks.useConversionResult,
}));
vi.mock('../queries/useQualityReview', () => ({
  useConversionQualityReview: mocks.useConversionQualityReview,
  useSubmitQualityReview: mocks.useSubmitQualityReview,
}));

const completedJob: ConversionJob = {
  id: 'job-1',
  screenId: 'screen-1',
  status: 'COMPLETED',
  resultReference: 'results/job-1',
  toolVersion: 'v1.2.0',
  createdAt: '2026-09-26T00:00:00.000Z',
};

const processingJob: ConversionJob = {
  id: 'job-2',
  screenId: 'screen-1',
  status: 'PROCESSING',
  createdAt: '2026-09-26T00:00:00.000Z',
};

const pendingReviewResponse: ConversionQualityReviewResponse = {
  review: {
    id: '',
    organizationId: 'org-1',
    projectId: 'proj-1',
    conversionJobId: 'job-1',
    screenId: 'screen-1',
    status: ConversionQualityReviewStatus.PENDING,
  },
  fileSummary: {
    fileCount: 2,
    totalLines: 120,
    toolVersion: 'v1.2.0',
  },
};

const resultBundle: ConversionResultBundle = {
  conversionJobId: 'job-1',
  toolVersion: 'v1.2.0',
  files: [
    { relativePath: 'Screen.java', content: 'public class Screen {}' },
    { relativePath: 'ScreenDto.java', content: 'public class ScreenDto {}' },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/proj-1/screens/screen-1/quality-review']}>
      <Routes>
        <Route
          path="/projects/:projectId/screens/:screenId/quality-review"
          element={<InitialQualityReviewPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InitialQualityReviewPage', () => {
  let mutateAsyncMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock = vi.fn().mockResolvedValue({
      id: 'rev-1',
      status: ConversionQualityReviewStatus.ACCEPTED,
    });

    mocks.useSubmitQualityReview.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
      isSuccess: false,
      variables: undefined,
    });
    mocks.useConversionResult.mockReturnValue({
      data: resultBundle,
      isLoading: false,
    });
  });

  it('Case 1: Renders loading spinner when fetching conversion job', () => {
    mocks.useConversionJob.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderPage();
    expect(screen.getByText(/Loading conversion quality details/i)).toBeInTheDocument();
  });

  it('Case 2: Shows In Progress state when job is not COMPLETED', () => {
    mocks.useConversionJob.mockReturnValue({
      data: processingJob,
      isLoading: false,
      refetch: vi.fn(),
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderPage();
    expect(screen.getByText(/Conversion In Progress or Not Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/PROCESSING/i)).toBeInTheDocument();
  });

  it('Case 3: Renders quality review form when job is COMPLETED and review is PENDING', () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    renderPage();
    expect(screen.getByText('Initial Conversion Quality Review')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Accept Quality')).toBeInTheDocument();
    expect(screen.getByText('Needs Rework')).toBeInTheDocument();
    expect(screen.getByText('Flag Issue')).toBeInTheDocument();
    expect(screen.getByText('Generated Code Preview')).toBeInTheDocument();
  });

  it('Case 4: Shows client validation error when clicking Needs Rework without a note', async () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    renderPage();
    fireEvent.click(screen.getByText('Needs Rework'));

    expect(
      await screen.findByText(/A review note is required when requesting rework or flagging issues/i),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('Case 5: Shows client validation error when clicking Flag Issue without a note', async () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    renderPage();
    fireEvent.click(screen.getByText('Flag Issue'));

    expect(
      await screen.findByText(/A review note is required when requesting rework or flagging issues/i),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('Case 6: Shows client validation error when review note exceeds 2000 chars', async () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    renderPage();
    const textarea = screen.getByPlaceholderText(/Add comments on structure/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(2001) } });

    fireEvent.click(screen.getByText('Accept Quality'));

    expect(
      await screen.findByText(/Review note must not exceed 2000 characters/i),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('Case 7: Submits ACCEPTED decision successfully with optional rating', async () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    renderPage();

    // Select star 5
    const star5 = screen.getByLabelText('5 - Excellent');
    fireEvent.click(star5);

    fireEvent.click(screen.getByText('Accept Quality'));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        status: ConversionQualityReviewStatus.ACCEPTED,
        qualityScore: 5,
        reviewNote: undefined,
      });
    });
  });

  it('Case 8: Displays 403 permission error message if user has VIEWER role', async () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    mutateAsyncMock.mockRejectedValue(
      new ApiError('Role VIEWER cannot submit reviews', 403, undefined, 'FORBIDDEN'),
    );

    renderPage();
    fireEvent.click(screen.getByText('Accept Quality'));

    expect(
      await screen.findByText(/You do not have permission to submit a review decision/i),
    ).toBeInTheDocument();
  });

  it('Case 9: Displays 409 conflict alert if review was concurrently modified', async () => {
    const refetchReviewMock = vi.fn();
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
      refetch: refetchReviewMock,
    });

    mutateAsyncMock.mockRejectedValue(
      new ApiError('Concurrent modification', 409, undefined, 'QUALITY_REVIEW_CONFLICT'),
    );

    renderPage();
    fireEvent.click(screen.getByText('Accept Quality'));

    expect(
      await screen.findByText(/Review modified concurrently/i),
    ).toBeInTheDocument();
    expect(refetchReviewMock).toHaveBeenCalled();
  });

  it('Case 10: Disables action buttons while submission is in progress', () => {
    mocks.useConversionJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });
    mocks.useConversionQualityReview.mockReturnValue({
      data: pendingReviewResponse,
      isLoading: false,
    });

    mocks.useSubmitQualityReview.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: true,
      isSuccess: false,
      variables: { status: ConversionQualityReviewStatus.ACCEPTED },
    });

    renderPage();

    // When isPending is true on ACCEPTED, button shows "Processing..."
    const acceptBtn = screen.getByText('Processing...').closest('button');
    const reworkBtn = screen.getByText('Needs Rework').closest('button');
    const flagBtn = screen.getByText('Flag Issue').closest('button');

    expect(acceptBtn).toBeDisabled();
    expect(reworkBtn).toBeDisabled();
    expect(flagBtn).toBeDisabled();
  });
});
