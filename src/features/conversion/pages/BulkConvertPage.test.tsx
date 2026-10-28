import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { BulkConvertPage } from './BulkConvertPage';

// Regression test: a real backend failure when starting a bulk conversion (e.g. the queue
// is unavailable) used to be completely silent — no error, no navigation, nothing. It
// looked identical to the button doing nothing at all.
const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  bulkConvertScreens: vi.fn(),
  getProjectById: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: { getProjectById: mocks.getProjectById },
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    bulkConvertScreens: mocks.bulkConvertScreens,
  },
}));

const screens: LegacyScreen[] = [
  { id: 'scr-1', projectId: 'proj-acme', name: 'LOGIN.bms', sourceType: 'BMS', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
  { id: 'scr-2', projectId: 'proj-acme', name: 'ACCT.cbl', sourceType: 'COBOL', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
];

describe('BulkConvertPage', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/bulk-convert']}>
          <Routes>
            <Route path="/projects/:projectId/bulk-convert" element={<BulkConvertPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows a real error banner when starting the bulk conversion fails', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockRejectedValue(new Error('Conversion job could not be queued'));

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    expect(await screen.findByText('Conversion job could not be queued')).toBeInTheDocument();
  });

  it('shows no error banner when starting the bulk conversion succeeds', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockResolvedValue([
      { id: 'job-1', screenId: 'scr-1', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
      { id: 'job-2', screenId: 'scr-2', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
    ]);

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    await screen.findByRole('button', { name: /Start Conversion/i });
    expect(screen.queryByText(/Could not start/i)).not.toBeInTheDocument();
  });
});

describe('BulkConvertPage - COBOL to Java project', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/bulk-convert']}>
          <Routes>
            <Route path="/projects/:projectId/bulk-convert" element={<BulkConvertPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('names the programs, Java and the engine instead of React', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', name: 'Acme', conversionType: 'COBOL_TO_JAVA' });

    renderPage();

    expect(await screen.findByText('Bulk Convert Programs')).toBeInTheDocument();
    expect(screen.getByText(/Compile and modernize multiple COBOL programs into Java Spring Boot components/)).toBeInTheDocument();
    expect(screen.getByText('Java 17/21 (Spring Boot Batch)')).toBeInTheDocument();
    expect(screen.getByText('tool2java Deterministic Engine')).toBeInTheDocument();
    expect(screen.queryByText('React 19 + TypeScript')).not.toBeInTheDocument();
  });

  it('keeps the React wording for a BMS project', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', name: 'Acme', conversionType: 'BMS_DSPF_TO_FRONTEND' });

    renderPage();

    expect(await screen.findByText('Bulk Convert Screens')).toBeInTheDocument();
    expect(screen.getByText('React 19 + TypeScript')).toBeInTheDocument();
  });
});
