import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { ConversionJob } from '../services/conversion.service';
import type { ConversionResultBundle } from '../types/conversion';
import { ResultInspectionPage } from './ResultInspectionPage';

// This page must show only real data — no fabricated AST panel (removed as part of
// completing UC-24). Mock conversionService directly rather than apiClient, matching
// the convention used by ExportCodePage.test.tsx.
const mocks = vi.hoisted(() => ({
  getScreenById: vi.fn(),
  getLatestConversion: vi.fn(),
  getConversionJobById: vi.fn(),
  getConversionResult: vi.fn(),
  retryConversion: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreenById: mocks.getScreenById,
    getLatestConversion: mocks.getLatestConversion,
    getConversionJobById: mocks.getConversionJobById,
    getConversionResult: mocks.getConversionResult,
    retryConversion: mocks.retryConversion,
  },
}));

const screen1: LegacyScreen = {
  id: 'scr-1',
  projectId: 'proj-acme',
  name: 'CBACT01C.cbl',
  sourceType: 'COBOL',
  status: 'Completed',
  framework: 'React',
  lastUpdated: 'just now',
};

const completedJob: ConversionJob = {
  id: 'job-1',
  status: 'COMPLETED',
  resultReference: 'results/proj-acme/job-1',
  createdAt: '2026-09-25T00:00:00.000Z',
  startedAt: '2026-09-25T00:00:00.000Z',
  completedAt: '2026-09-25T00:00:05.000Z',
};

const failedJob: ConversionJob = {
  id: 'job-2',
  status: 'FAILED',
  errorCode: 'CONVERSION_ENGINE_UNAVAILABLE',
  errorMessage: 'No Java files were generated.',
  createdAt: '2026-09-25T00:00:00.000Z',
};

const resultBundle: ConversionResultBundle = {
  conversionJobId: 'job-1',
  toolVersion: 'tool2java',
  files: [
    { relativePath: 'cobolprogramclasses/Cbact01cTasklet.java', content: 'public class Cbact01cTasklet {}\nline2\n' },
    { relativePath: 'cobolprogramclasses/Cbact01cConfig.java', content: 'public class Cbact01cConfig {}\n' },
  ],
};

describe('ResultInspectionPage', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-1/result']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/result" element={<ResultInspectionPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('never renders the old fabricated AST panel', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(completedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);

    renderPage();

    expect(await screen.findByText('Generated Files')).toBeInTheDocument();
    expect(screen.queryByText(/Abstract Syntax Tree/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AST NODES/i)).not.toBeInTheDocument();
  });

  it('lists every real generated file with its real line count and shows the real file count stat', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(completedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);

    renderPage();

    // The real filename renders in both the file-switcher tabs and the "Generated Files"
    // list panel (by design) — assert at least one real occurrence of each, not exact count.
    expect((await screen.findAllByText('cobolprogramclasses/Cbact01cTasklet.java')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('cobolprogramclasses/Cbact01cConfig.java').length).toBeGreaterThan(0);
    expect(screen.getByText('2 lines')).toBeInTheDocument(); // Tasklet file: 2 lines
    expect(screen.getByText('FILES GENERATED')).toBeInTheDocument();
  });

  it('shows an honest empty state and no fake execution time before a real result exists', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue({ ...completedJob, status: 'QUEUED', resultReference: undefined, startedAt: undefined, completedAt: undefined });
    mocks.getConversionResult.mockResolvedValue(resultBundle);

    renderPage();

    expect(await screen.findByText(/No generated files yet/i)).toBeInTheDocument();
    // No hardcoded fake '0.8s' execution time when the job never actually ran.
    expect(screen.queryByText('0.8s')).not.toBeInTheDocument();
  });

  it('shows a real Retry Job button for a FAILED job and calls the real retry endpoint (UC-54)', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(failedJob);
    mocks.retryConversion.mockResolvedValue({ ...failedJob, status: 'QUEUED', errorCode: undefined, errorMessage: undefined });

    renderPage();

    const retryBtn = await screen.findByRole('button', { name: /Retry Job/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(mocks.retryConversion).toHaveBeenCalledWith('job-2');
    });
  });

  it('does not show a Retry Job button for a job that is not FAILED/DEAD', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue({ ...completedJob, status: 'PROCESSING', resultReference: undefined });

    renderPage();

    await screen.findByText(/currently "Processing"/i);
    expect(screen.queryByRole('button', { name: /Retry Job/i })).not.toBeInTheDocument();
  });
});

// UC-19: this page must also be able to show one specific historical version (linked from
// the Version History page via ?jobId=), not only the screen's latest job.
describe('ResultInspectionPage - viewing a specific historical version (UC-19)', () => {
  const renderWithJobId = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-1/result?jobId=job-old']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/result" element={<ResultInspectionPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  const oldCompletedJob: ConversionJob = {
    id: 'job-old',
    status: 'COMPLETED',
    resultReference: 'results/proj-acme/job-old',
    createdAt: '2026-09-01T00:00:00.000Z',
    startedAt: '2026-09-01T00:00:00.000Z',
    completedAt: '2026-09-01T00:00:03.000Z',
  };

  it('fetches and shows the specific job from ?jobId= instead of the latest job', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionJobById.mockResolvedValue(oldCompletedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);
    // The latest job is intentionally different (never rendered here) - if the page ever
    // regresses to always using the latest job, this test would show the wrong data.
    mocks.getLatestConversion.mockResolvedValue(completedJob);

    renderWithJobId();

    expect(mocks.getConversionJobById).toHaveBeenCalledWith('job-old');
    expect(await screen.findByText(/Viewing a past version from/i)).toBeInTheDocument();
  });

  it('offers a link back to the latest result', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionJobById.mockResolvedValue(oldCompletedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);
    mocks.getLatestConversion.mockResolvedValue(completedJob);

    renderWithJobId();

    const link = await screen.findByRole('link', { name: /View latest instead/i });
    expect(link.getAttribute('href')).toBe('/projects/proj-acme/screens/scr-1/result');
  });
});
