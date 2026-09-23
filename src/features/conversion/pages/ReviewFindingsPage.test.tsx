import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api/apiError';
import type { ConversionJob } from '../services/conversion.service';
import {
  ValidationFindingStatus,
  ValidationRunStatus,
  type ValidationFinding,
  type ValidationRun,
} from '../types/validation';
import { ReviewFindingsPage } from './ReviewFindingsPage';

const mocks = vi.hoisted(() => ({
  useConversionJob: vi.fn(),
  useConversionResult: vi.fn(),
  useValidationRuns: vi.fn(),
  useValidationRun: vi.fn(),
  useValidationFindings: vi.fn(),
  useTriggerAiValidation: vi.fn(),
  useReviewValidationFinding: vi.fn(),
}));

vi.mock('../queries/useConversionJob', () => ({ useConversionJob: mocks.useConversionJob }));
vi.mock('../queries/useConversionResult', () => ({
  useConversionResult: mocks.useConversionResult,
}));
vi.mock('../queries/useValidation', () => ({
  useValidationRuns: mocks.useValidationRuns,
  useValidationRun: mocks.useValidationRun,
  useValidationFindings: mocks.useValidationFindings,
  useTriggerAiValidation: mocks.useTriggerAiValidation,
  useReviewValidationFinding: mocks.useReviewValidationFinding,
}));

const conversion: ConversionJob = {
  id: 'job-1',
  screenId: 'screen-1',
  status: 'COMPLETED',
  resultReference: 'results/job-1',
  createdAt: '2026-09-23T00:00:00.000Z',
};

const run: ValidationRun = {
  id: 'run-1',
  organizationId: 'org-1',
  projectId: 'project-1',
  conversionJobId: 'job-1',
  status: ValidationRunStatus.COMPLETED,
  ruleValidationEnabled: false,
  aiValidationEnabled: true,
  findingCount: 0,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const finding: ValidationFinding = {
  id: 'finding-1',
  organizationId: 'org-1',
  projectId: 'project-1',
  conversionJobId: 'job-1',
  validationRunId: 'run-1',
  source: 'AI',
  category: 'LOGIC_MISMATCH',
  severity: 'HIGH',
  status: ValidationFindingStatus.PENDING,
  title: 'Conditional behavior differs',
  explanation: 'The generated branch does not match the legacy condition.',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

function queryResult<T>(data: T, overrides: Record<string, unknown> = {}) {
  return { data, isLoading: false, isError: false, error: null, ...overrides };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/project-1/screens/screen-1/review']}>
      <Routes>
        <Route
          path="/projects/:projectId/screens/:screenId/review"
          element={<ReviewFindingsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.useConversionJob.mockReturnValue(queryResult(conversion));
  mocks.useConversionResult.mockReturnValue(queryResult(undefined));
  mocks.useValidationRuns.mockReturnValue(queryResult([]));
  mocks.useValidationRun.mockReturnValue(queryResult(undefined));
  mocks.useValidationFindings.mockReturnValue(queryResult([]));
  mocks.useTriggerAiValidation.mockReturnValue({
    data: undefined,
    mutate: vi.fn(),
    isPending: false,
    error: null,
  });
  mocks.useReviewValidationFinding.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  });
});

describe('ReviewFindingsPage validation lifecycle', () => {
  it('shows an empty state when no conversion exists', () => {
    mocks.useConversionJob.mockReturnValue(queryResult(null));
    renderPage();
    expect(screen.getByText('No conversion available')).toBeInTheDocument();
  });

  it.each(['QUEUED', 'PROCESSING'] as const)(
    'blocks validation while conversion is %s',
    (status) => {
      mocks.useConversionJob.mockReturnValue(queryResult({ ...conversion, status }));
      renderPage();
      expect(screen.getByText('Conversion is still in progress')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Run AI Validation' })).not.toBeInTheDocument();
    },
  );

  it('offers the trigger when a completed conversion has no validation run', () => {
    const mutate = vi.fn();
    mocks.useTriggerAiValidation.mockReturnValue({
      data: undefined,
      mutate,
      isPending: false,
      error: null,
    });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Run AI Validation' }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it.each([
    [ValidationRunStatus.QUEUED, 'Status: Queued'],
    [ValidationRunStatus.PROCESSING, 'Status: Processing'],
  ] as const)('renders an active %s run', (status, text) => {
    const activeRun = { ...run, status };
    mocks.useValidationRuns.mockReturnValue(queryResult([activeRun]));
    mocks.useValidationRun.mockReturnValue(queryResult(activeRun));
    renderPage();

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finalize & Export/ })).toBeDisabled();
  });

  it('renders the completed zero-findings advisory state', () => {
    mocks.useValidationRuns.mockReturnValue(queryResult([run]));
    mocks.useValidationRun.mockReturnValue(queryResult(run));
    renderPage();

    expect(
      screen.getByText('No semantic findings were detected in this validation run.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not guarantee semantic equivalence/i)).toBeInTheDocument();
  });

  it('renders real completed findings and accurate review progress', () => {
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(queryResult([finding]));
    renderPage();

    expect(screen.getByText('Conditional behavior differs')).toBeInTheDocument();
    expect(screen.getAllByText('0 of 1 findings reviewed')).toHaveLength(2);
  });

  it('renders a failed run and allows a new trigger', () => {
    const mutate = vi.fn();
    const failedRun = {
      ...run,
      status: ValidationRunStatus.FAILED,
      failureCode: 'AI_PROVIDER_UNAVAILABLE',
      failureMessage: 'AI validation is temporarily unavailable',
    };
    mocks.useValidationRuns.mockReturnValue(queryResult([failedRun]));
    mocks.useValidationRun.mockReturnValue(queryResult(failedRun));
    mocks.useTriggerAiValidation.mockReturnValue({
      data: undefined,
      mutate,
      isPending: false,
      error: null,
    });
    renderPage();

    expect(screen.getByText('AI validation failed')).toBeInTheDocument();
    expect(screen.getByText('AI_PROVIDER_UNAVAILABLE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Run Validation Again' }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Needs Correction', ValidationFindingStatus.NEEDS_CORRECTION],
    ['Manual Review', ValidationFindingStatus.MANUAL_REVIEW],
  ] as const)('persists the %s decision through the review mutation', (label, status) => {
    const mutate = vi.fn();
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(queryResult([finding]));
    mocks.useReviewValidationFinding.mockReturnValue({ mutate, isPending: false, error: null });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(mutate).toHaveBeenCalledWith({
      findingId: 'finding-1',
      input: { status },
    });
  });

  it('requires a reason before persisting Not Applicable', () => {
    const mutate = vi.fn();
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(queryResult([finding]));
    mocks.useReviewValidationFinding.mockReturnValue({ mutate, isPending: false, error: null });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Not Applicable' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'This branch is not used by the migrated flow.' },
    });
    fireEvent.click(confirm);

    expect(mutate).toHaveBeenCalledWith(
      {
        findingId: 'finding-1',
        input: {
          status: ValidationFindingStatus.NOT_APPLICABLE,
          reviewNote: 'This branch is not used by the migrated flow.',
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('only exposes Resolved when the backend transition map allows it', () => {
    const mutate = vi.fn();
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(queryResult([finding]));
    mocks.useReviewValidationFinding.mockReturnValue({ mutate, isPending: false, error: null });
    const { rerender } = renderPage();

    expect(screen.queryByRole('button', { name: 'Resolved' })).not.toBeInTheDocument();

    mocks.useValidationFindings.mockReturnValue(
      queryResult([{ ...finding, status: ValidationFindingStatus.NEEDS_CORRECTION }]),
    );
    rerender(
      <MemoryRouter initialEntries={['/projects/project-1/screens/screen-1/review']}>
        <Routes>
          <Route
            path="/projects/:projectId/screens/:screenId/review"
            element={<ReviewFindingsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Resolved' }));
    expect(mutate).toHaveBeenCalledWith({
      findingId: 'finding-1',
      input: { status: ValidationFindingStatus.RESOLVED },
    });
  });

  it('shows the conflict message without applying a local status change', () => {
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(queryResult([finding]));
    mocks.useReviewValidationFinding.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new ApiError('Conflict', 409),
    });
    renderPage();

    expect(
      screen.getByText(
        'This finding was updated by another reviewer. The latest state has been reloaded.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('reconstructs reviewed status and notes from query data', () => {
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(
      queryResult([
        {
          ...finding,
          status: ValidationFindingStatus.NOT_APPLICABLE,
          reviewNote: 'Confirmed as out of scope.',
          reviewedBy: 'reviewer-1',
          reviewedAt: '2026-09-23T02:00:00.000Z',
        },
      ]),
    );
    renderPage();

    expect(screen.getAllByText('1 of 1 findings reviewed')).toHaveLength(2);
    expect(screen.getByText(/Confirmed as out of scope/)).toBeInTheDocument();
    expect(screen.getByText('Reviewed by reviewer-1')).toBeInTheDocument();
  });

  it('shows authorized generated code and highlights the finding target location', () => {
    const completedWithFindings = { ...run, findingCount: 1 };
    mocks.useValidationRuns.mockReturnValue(queryResult([completedWithFindings]));
    mocks.useValidationRun.mockReturnValue(queryResult(completedWithFindings));
    mocks.useValidationFindings.mockReturnValue(
      queryResult([
        {
          ...finding,
          targetLocation: { file: 'src/Payment.java', startLine: 2, endLine: 2 },
        },
      ]),
    );
    mocks.useConversionResult.mockReturnValue(
      queryResult({
        conversionJobId: 'job-1',
        files: [
          { relativePath: 'src/Payment.java', content: 'class Payment {\n  void pay() {}\n}' },
        ],
      }),
    );
    renderPage();

    expect(screen.getByText('Source preview unavailable')).toBeInTheDocument();
    expect(screen.getByText('src/Payment.java')).toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-highlighted', 'true');
  });
});
