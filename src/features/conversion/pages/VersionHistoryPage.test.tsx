import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { ConversionJob } from '../services/conversion.service';
import { VersionHistoryPage } from './VersionHistoryPage';

// UC-19: this page must show the real, full conversion history for a screen (every past
// attempt, not just the latest) — mock conversionService directly, matching the convention
// used elsewhere in this codebase.
const mocks = vi.hoisted(() => ({
  getScreenById: vi.fn(),
  getConversionHistory: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreenById: mocks.getScreenById,
    getConversionHistory: mocks.getConversionHistory,
  },
}));

const screen1: LegacyScreen = {
  id: 'scr-1',
  projectId: 'proj-acme',
  name: 'COACTUP.bms',
  sourceType: 'BMS',
  status: 'Completed',
  framework: 'React',
  lastUpdated: 'just now',
};

// Backend already returns newest-first.
const history: ConversionJob[] = [
  {
    id: 'job-3',
    status: 'COMPLETED',
    resultReference: 'results/proj-acme/job-3',
    toolVersion: 'convert2fe',
    createdAt: '2026-09-25T02:00:00.000Z',
    startedAt: '2026-09-25T02:00:00.000Z',
    completedAt: '2026-09-25T02:00:01.000Z',
  },
  {
    id: 'job-2',
    status: 'FAILED',
    errorCode: 'CONVERSION_ENGINE_UNAVAILABLE',
    errorMessage: 'No .tsx files were generated.',
    createdAt: '2026-09-25T01:00:00.000Z',
  },
  {
    id: 'job-1',
    status: 'COMPLETED',
    resultReference: 'results/proj-acme/job-1',
    toolVersion: 'convert2fe',
    createdAt: '2026-09-25T00:00:00.000Z',
    startedAt: '2026-09-25T00:00:00.000Z',
    completedAt: '2026-09-25T00:00:02.000Z',
  },
];

describe('VersionHistoryPage', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-1/history']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/history" element={<VersionHistoryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('lists every real past conversion attempt, not just the latest', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockResolvedValue(history);

    renderPage();

    expect(await screen.findByText('Version 3')).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Version 1')).toBeInTheDocument();
  });

  it('marks only the newest entry as Latest', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockResolvedValue(history);

    renderPage();

    await screen.findByText('Version 3');
    expect(screen.getAllByText('Latest')).toHaveLength(1);
  });

  it('shows the real error for a failed attempt', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockResolvedValue(history);

    renderPage();

    expect(await screen.findByText(/No \.tsx files were generated\./)).toBeInTheDocument();
  });

  it('only offers "View Code" for completed attempts with a real result', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockResolvedValue(history);

    renderPage();

    await screen.findByText('Version 3');
    expect(screen.getAllByRole('link', { name: /View Code/i })).toHaveLength(2);
    expect(screen.getByText('No output')).toBeInTheDocument();
  });

  it('shows an honest empty state instead of fake rows when no jobs have ever run', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/No conversion attempts have been run/i)).toBeInTheDocument();
  });

  it('shows a real error banner instead of silently showing nothing when the history call fails', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getConversionHistory.mockRejectedValue(new Error('Request failed'));

    renderPage();

    expect(await screen.findByText(/Could not load version history/i)).toBeInTheDocument();
  });
});
